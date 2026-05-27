import { create } from 'zustand'
import supabase from '../lib/supabase'

// Helper: wait until supabase has a session (or timeout)
const waitForSession = async (maxWaitMs = 5000) => {
  // First try: instant check
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.user) return session.user

  // If no session yet, wait for auth state change
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      sub.unsubscribe()
      resolve(null)
    }, maxWaitMs)

    const { data: { subscription: sub } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        clearTimeout(timeout)
        sub.unsubscribe()
        resolve(session.user)
      }
    })
  })
}

const useBoatStore = create((set, get) => ({
  boats: [],
  loading: false,
  error: null,
  _initialized: false,

  // Fetch boats for the current user — waits for auth if needed
  fetchMyBoats: async () => {
    set({ loading: true, error: null })
    try {
      // Wait for user to be available (handles race condition on page load)
      const user = await waitForSession(6000)
      if (!user) {
        console.warn('[BoatStore] No session after waiting — boats will be empty')
        set({ boats: [], loading: false, _initialized: true })
        return []
      }

      const { data, error } = await supabase
        .from('boats')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .abortSignal(AbortSignal.timeout(15000))

      if (error) throw error
      set({ boats: data || [], loading: false, _initialized: true })
      return data || []
    } catch (error) {
      console.error('Error fetching boats:', error)
      set({ error: error.message, boats: [], loading: false, _initialized: true })
      return []
    }
  },

  // Create a boat
  createBoat: async (boatData) => {
    set({ loading: true, error: null })
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) throw new Error('No autenticado')

      const { data, error } = await supabase
        .from('boats')
        .insert({ ...boatData, owner_id: user.id })
        .select()
        .single()

      if (error) throw error
      set((state) => ({ boats: [data, ...state.boats], loading: false }))
      return { success: true, data }
    } catch (error) {
      set({ error: error.message, loading: false })
      return { success: false, error: error.message }
    }
  },

  // Update a boat
  updateBoat: async (boatId, updates) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('boats')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', boatId)
        .select()
        .single()

      if (error) throw error
      set((state) => ({
        boats: state.boats.map(b => b.id === boatId ? data : b),
        loading: false,
      }))
      return { success: true, data }
    } catch (error) {
      set({ error: error.message, loading: false })
      return { success: false, error: error.message }
    }
  },

  // Delete a boat
  deleteBoat: async (boatId) => {
    try {
      const { error } = await supabase
        .from('boats')
        .delete()
        .eq('id', boatId)

      if (error) throw error
      set((state) => ({ boats: state.boats.filter(b => b.id !== boatId) }))
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Upload boat image
  uploadBoatImage: async (boatId, file) => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${boatId}/${Date.now()}.${fileExt}`

      const { error } = await supabase.storage
        .from('boat-images')
        .upload(fileName, file, { upsert: true })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('boat-images')
        .getPublicUrl(fileName)

      return { success: true, url: publicUrl }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  clearError: () => set({ error: null }),
}))

export default useBoatStore
