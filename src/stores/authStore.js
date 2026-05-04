import { create } from 'zustand'
import supabase from '../lib/supabase'

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
  error: null,

  // Initialize auth — call once on app mount
  initialize: async () => {
    try {
      // Safety timeout: force loading=false after 5s
      const timeout = setTimeout(() => {
        if (get().loading) {
          console.warn('Auth init timeout — forcing loaded state')
          set({ loading: false })
        }
      }, 5000)

      // Get current session
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) throw error

      if (session?.user) {
        const profile = await get().fetchProfile(session.user.id)
        set({ user: session.user, session, profile, loading: false })
      } else {
        set({ loading: false })
      }

      clearTimeout(timeout)

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
          const profile = await get().fetchProfile(session.user.id)
          set({ user: session.user, session, profile, loading: false })
        } else if (event === 'SIGNED_OUT') {
          set({ user: null, session: null, profile: null, loading: false })
        }
      })
    } catch (error) {
      console.error('Auth initialization error:', error)
      set({ loading: false, error: error.message })
    }
  },

  // Fetch user profile from profiles table
  fetchProfile: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Profile fetch error:', error)
        return null
      }

      return data
    } catch (err) {
      console.error('Profile fetch exception:', err)
      return null
    }
  },

  // Sign up with email + password + role
  signUp: async (email, password, fullName, role = 'viewer') => {
    set({ error: null })
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (authError) throw authError

      // Create profile immediately
      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: fullName,
          role,
          updated_at: new Date().toISOString(),
        })
      }

      return { success: true, data }
    } catch (error) {
      let msg = error.message
      if (msg.includes('already registered') || msg.includes('already been registered')) {
        msg = 'Este email ya está registrado. Intentá iniciar sesión.'
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
        .upsert({
          id: user.id,
          ...updates,
          updated_at: new Date().toISOString(),
        })
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
    try {
      // Intentar cerrar sesión en el servidor y forzar limpieza local
      await supabase.auth.signOut({ scope: 'local' })
      // También intentar cerrar la sesión global por las dudas, pero atrapando errores
      await supabase.auth.signOut().catch(() => {})
    } catch (err) {
      console.error('Signout error:', err)
    } finally {
      set({ user: null, session: null, profile: null })
      // Forzamos recarga y redirección a inicio
      window.location.href = '/'
    }
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
