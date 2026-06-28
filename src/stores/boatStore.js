import { create } from 'zustand'
import supabase from '../lib/supabase'
import useAuthStore from './authStore'

const useBoatStore = create((set, get) => ({
  boats: [],
  isLoadingBoats: false,  // fetchMyBoats
  isSaving: false,         // createBoat, updateBoat
  error: null,
  _initialized: false,

  // Fetch boats for the current user
  fetchMyBoats: async () => {
    set({ isLoadingBoats: true, error: null })
    try {
      const user = useAuthStore.getState().user
      if (!user) {
        set({ boats: [], isLoadingBoats: false, error: null, _initialized: true })
        return []
      }

      const { data, error } = await supabase
        .from('boats')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .abortSignal(AbortSignal.timeout(6000))

      if (error) throw error
      set({ boats: data || [], isLoadingBoats: false, error: null, _initialized: true })
      return data || []
    } catch (error) {
      console.error('Error fetching boats:', error)
      set({ error: error.message, boats: [], isLoadingBoats: false, _initialized: true })
      return []
    }
  },

  // Create a boat
  createBoat: async (boatData) => {
    set({ isSaving: true, error: null })
    try {
      const user = useAuthStore.getState().user
      if (!user) throw new Error('No autenticado')

      const { data, error } = await supabase
        .from('boats')
        .insert({ ...boatData, owner_id: user.id })
        .select()
        .single()

      if (error) throw error
      set((state) => ({ boats: [data, ...state.boats], isSaving: false }))
      return { success: true, data }
    } catch (error) {
      set({ error: error.message, isSaving: false })
      return { success: false, error: error.message }
    }
  },

  // Update a boat
  updateBoat: async (boatId, updates) => {
    set({ isSaving: true, error: null })
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
        isSaving: false,
      }))
      return { success: true, data }
    } catch (error) {
      set({ error: error.message, isSaving: false })
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
