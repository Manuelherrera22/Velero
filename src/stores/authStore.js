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
      // Get current session
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) throw error

      if (session?.user) {
        const profile = await get().fetchProfile(session.user.id)
        set({ user: session.user, session, profile, loading: false })
      } else {
        set({ loading: false })
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await get().fetchProfile(session.user.id)
          set({ user: session.user, session, profile })
        } else if (event === 'SIGNED_OUT') {
          set({ user: null, session: null, profile: null })
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
      set({ error: error.message })
      return { success: false, error: error.message }
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
      set({ error: error.message })
      return { success: false, error: error.message }
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
    await supabase.auth.signOut()
    set({ user: null, session: null, profile: null })
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

  // Clear error
  clearError: () => set({ error: null }),
}))

export default useAuthStore
