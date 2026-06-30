import { create } from 'zustand'
import supabase from '../lib/supabase'
import { withRetry } from '../utils/retry'

/**
 * Auth Store — Manages authentication state
 * 
 * 3 user levels (as defined by Hernán):
 * 1. Guest (no auth) — can browse & buy with email/phone
 * 2. Registered user (viewer) — can buy, rate, view history
 * 3. Publisher (captain) — can create trips, manage boats, view bookings
 */
const useAuthStore = create((set, get) => ({
  // State
  user: null,
  profile: null,
  session: null,
  loading: true,
  initialized: false,
  error: null,
  _subscription: null,

  // Initialize auth — call once on app mount
  initialize: async () => {
    // Prevent double initialization (React StrictMode, HMR)
    if (get().initialized || get()._subscription) return

    // Flag to prevent the auth listener from running during init.
    // Without this, both onAuthStateChange AND getSession fire in parallel,
    // both call fetchProfile, and the second set() re-renders App.jsx,
    // which unmounts + remounts all child routes, discarding in-flight data fetches.
    let isInitializing = true
    console.log('[Auth] initialize started')

    try {
      // 1. Register auth listener FIRST — but it will SKIP events while isInitializing=true
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        // During init, getSession() handles everything. Ignore listener events.
        if (isInitializing) { console.log(`[Auth] listener: skipped ${event} (initializing)`); return }

        console.log(`[Auth] listener: ${event}`)
        if (event === 'TOKEN_REFRESHED' && session) {
          // ONLY update session token — do NOT re-fetch profile or touch user/profile.
          set({ session })
        } else if (event === 'SIGNED_IN' && session?.user) {
          // If the same user is already loaded, just refresh the session silently.
          // Supabase fires SIGNED_IN on every tab focus — don't re-fetch profile each time.
          const currentUser = get().user
          if (currentUser?.id === session.user.id) {
            console.log('[Auth] listener: same user, silent session refresh')
            set({ session })
          } else {
            console.log('[Auth] listener: new user, fetching profile')
            const profile = await get().fetchProfile(session.user.id)
            if (profile) {
              set({ user: session.user, session, profile, loading: false, initialized: true })
            } else {
              // Profile fetch failed (permission denied / corrupt token) — don't set broken state
              console.warn('[Auth] listener: profile fetch failed, clearing corrupt session')
              set({ user: null, session: null, profile: null, loading: false, initialized: true })
              try { localStorage.clear() } catch (_) {}
              try { sessionStorage.clear() } catch (_) {}
              supabase.auth.signOut({ scope: 'local' }).catch(() => {})
            }
          }
        } else if (event === 'SIGNED_OUT') {
          set({ user: null, session: null, profile: null, loading: false, initialized: true })
        }
      })

      set({ _subscription: subscription })

      // 2. Get current session — this is the SINGLE source of truth during init
      const { data: { session }, error } = await withRetry(
        () => supabase.auth.getSession().then(r => { if (r.error) throw r.error; return r }),
        { label: 'getSession', maxRetries: 2 }
      ).catch(err => ({ data: { session: null }, error: err }))
      
      if (error) {
        // If the refresh token is invalid/expired, quietly sign out to clean local storage
        if (error.message?.includes('Refresh Token') || error.status === 400) {
          await supabase.auth.signOut().catch(() => {})
          set({ loading: false, initialized: true })
          isInitializing = false
          return
        }
        throw error
      }

      if (session?.user) {
        console.log('[Auth] session found, fetching profile...')
        const profile = await get().fetchProfile(session.user.id)
        console.log(`[Auth] init complete: role=${profile?.role}`)
        set({ user: session.user, session, profile, loading: false, initialized: true })
      } else {
        console.log('[Auth] no session, init complete')
        set({ loading: false, initialized: true })
      }
    } catch (error) {
      console.error('Auth initialization error:', error)
      set({ loading: false, initialized: true, error: error.message })
    }

    // NOW allow the listener to handle future events (sign-in, sign-out, token refresh)
    isInitializing = false
  },

  // Fetch user profile from profiles table
  fetchProfile: async (userId) => {
    try {
      const data = await withRetry(async () => {
        const { data: d, error: e } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()
          .abortSignal(AbortSignal.timeout(6000))
        if (e && e.code !== 'PGRST116') throw e
        return d
      }, { label: 'fetchProfile', maxRetries: 2 })

      return data
    } catch (err) {
      console.error('[Auth] fetchProfile failed:', err.message)
      // If permission denied, the session token is corrupt/revoked
      if (err.message?.includes('permission denied')) {
        console.warn('[Auth] permission denied — session is corrupt, will sign out')
      }
      return null
    }
  },

  // Sign up with email + password + role
  signUp: async (email, password, fullName, role = 'viewer', metadata = {}) => {
    set({ error: null })
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role, ...metadata },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (authError) throw authError

      // Detect fake success (user already exists)
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        throw new Error('already registered')
      }

      // El perfil se crea automáticamente en Supabase mediante el trigger on_auth_user_created

      return { success: true, data }
    } catch (error) {
      let msg = error.message
      if (msg.includes('already registered') || msg.includes('already been registered')) {
        msg = 'Este email ya está registrado. Por favor, iniciá sesión.'
      } else if (msg.includes('Password should be')) {
        msg = 'La contraseña debe tener al menos 6 caracteres.'
      }
      set({ error: msg })
      return { success: false, error: msg }
    }
  },

  // Sign in with email magic link
  signInWithEmail: async (email) => {
    set({ error: null })
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
      return { success: true }
    } catch (error) {
      let msg = error.message
      if (msg.includes('Error sending confirmation email') || msg.includes('rate limit')) {
        msg = 'No pudimos enviar el correo (límite alcanzado o proveedor satuturado). Por favor intenta más tarde o usa otro método.'
      } else if (msg.includes('Invalid email')) {
        msg = 'El formato del correo electrónico no es válido.'
      }
      set({ error: msg })
      return { success: false, error: msg }
    }
  },

  // Sign in with phone OTP
  signInWithPhone: async (phone) => {
    set({ error: null })
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone })
      if (error) throw error
      return { success: true }
    } catch (error) {
      let msg = error.message
      if (msg.includes('rate limit') || msg.includes('sending sms')) {
        msg = 'Límite de SMS excedido. Intenta más tarde.'
      }
      set({ error: msg })
      return { success: false, error: msg }
    }
  },

  // Verify phone OTP
  verifyPhoneOtp: async (phone, token) => {
    set({ error: null })
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: 'sms',
      })
      if (error) throw error
      return { success: true, data }
    } catch (error) {
      set({ error: error.message })
      return { success: false, error: error.message }
    }
  },

  // Update profile
  updateProfile: async (updates) => {
    const user = get().user
    if (!user) return { success: false, error: 'Not authenticated' }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error
      set({ profile: data })
      return { success: true, data }
    } catch (error) {
      set({ error: error.message })
      return { success: false, error: error.message }
    }
  },

  // Sign out
  signOut: async () => {
    console.log('[Auth] signOut: clearing state')
    // 1. Clear Zustand state immediately
    set({ user: null, session: null, profile: null, loading: false })
    
    // 2. Clear ALL local storage (Supabase tokens live here)
    try { localStorage.clear() } catch (_) {}
    try { sessionStorage.clear() } catch (_) {}
    
    // 3. Tell Supabase to invalidate the session on the server too
    try {
      await supabase.auth.signOut({ scope: 'global' })
    } catch (err) {
      console.error('[Auth] signOut error:', err)
    }
    
    console.log('[Auth] signOut: complete')
  },

  // Computed
  get isAuthenticated() {
    return !!get().user
  },

  get isPublisher() {
    return get().profile?.role === 'publisher' || get().profile?.role === 'admin'
  },

  get isAdmin() {
    return get().profile?.role === 'admin'
  },

  get isAffiliate() {
    return get().profile?.role === 'affiliate' || get().profile?.role === 'admin'
  },

  // Clear error
  clearError: () => set({ error: null }),
}))

export default useAuthStore
