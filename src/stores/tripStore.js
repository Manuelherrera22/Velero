import { create } from 'zustand'
import supabase from '../lib/supabase'

const useTripStore = create((set, get) => ({
  // State
  trips: [],
  featuredTrips: [],
  currentTrip: null,
  tripDates: [],
  tripAddons: [],
  tags: [],
  loading: false,
  error: null,

  // ── Fetch published trips (public) ──
  fetchTrips: async (filters = {}) => {
    set({ loading: true, error: null })
    try {
      let query = supabase
        .from('trips')
        .select(`
          *,
          captain:profiles!captain_id(id, full_name, avatar_url, is_verified),
          boat:boats!boat_id(id, name, type, length_m)
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`)
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,location.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }
      if (filters.tag) {
        query = query.contains('tags', [filters.tag])
      }
      if (filters.minPrice) {
        query = query.gte('price_per_person', filters.minPrice)
      }
      if (filters.maxPrice) {
        query = query.lte('price_per_person', filters.maxPrice)
      }
      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      const { data, error } = await query

      if (error) throw error
      set({ trips: data || [], loading: false })
      return data || []
    } catch (error) {
      set({ error: error.message, loading: false })
      return []
    }
  },

  // ── Fetch featured trips for landing page ──
  fetchFeaturedTrips: async () => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          captain:profiles!captain_id(id, full_name, avatar_url, is_verified),
          boat:boats!boat_id(id, name, type, length_m)
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(6)

      if (error) throw error
      set({ featuredTrips: data || [] })
    } catch (error) {
      console.error('Error fetching featured trips:', error)
    }
  },

  // ── Fetch single trip with all details ──
  fetchTrip: async (tripId) => {
    set({ loading: true, error: null })
    try {
      // Fetch trip
      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .select(`
          *,
          captain:profiles!captain_id(id, full_name, avatar_url, is_verified, bio, location),
          boat:boats!boat_id(*)
        `)
        .eq('id', tripId)
        .single()

      if (tripError) throw tripError

      // Fetch dates
      const { data: dates } = await supabase
        .from('trip_dates')
        .select('*')
        .eq('trip_id', tripId)
        .eq('is_active', true)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })

      // Fetch addons
      const { data: addons } = await supabase
        .from('trip_addons')
        .select('*')
        .eq('trip_id', tripId)
        .eq('is_active', true)

      // Fetch reviews
      const { data: reviews } = await supabase
        .from('reviews')
        .select(`
          *,
          user:profiles!user_id(full_name, avatar_url)
        `)
        .eq('trip_id', tripId)
        .eq('is_published', true)
        .order('created_at', { ascending: false })

      // Calculate average rating
      const avgRating = reviews?.length
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : null

      set({
        currentTrip: { ...trip, avgRating, reviewCount: reviews?.length || 0 },
        tripDates: dates || [],
        tripAddons: addons || [],
        loading: false,
      })

      return { trip: { ...trip, avgRating, reviewCount: reviews?.length || 0 }, dates, addons, reviews }
    } catch (error) {
      set({ error: error.message, loading: false })
      return null
    }
  },

  // ── Fetch tags ──
  fetchTags: async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name')

      if (error) throw error
      set({ tags: data || [] })
    } catch (error) {
      console.error('Error fetching tags:', error)
    }
  },

  // ── Captain: fetch my trips ──
  fetchMyTrips: async () => {
    set({ loading: true, error: null })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          boat:boats!boat_id(id, name, type)
        `)
        .eq('captain_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      set({ trips: data || [], loading: false })
      return data || []
    } catch (error) {
      set({ error: error.message, loading: false })
      return []
    }
  },

  // ── Captain: create trip ──
  createTrip: async (tripData) => {
    set({ loading: true, error: null })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      const { data, error } = await supabase
        .from('trips')
        .insert({
          ...tripData,
          captain_id: user.id,
          status: 'pending',
        })
        .select()
        .single()

      if (error) throw error
      set({ loading: false })
      return { success: true, data }
    } catch (error) {
      set({ error: error.message, loading: false })
      return { success: false, error: error.message }
    }
  },

  // ── Captain: update trip ──
  updateTrip: async (tripId, updates) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('trips')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', tripId)
        .select()
        .single()

      if (error) throw error
      set({ loading: false })
      return { success: true, data }
    } catch (error) {
      set({ error: error.message, loading: false })
      return { success: false, error: error.message }
    }
  },

  // ── Manage trip dates ──
  addTripDate: async (dateData) => {
    try {
      const { data, error } = await supabase
        .from('trip_dates')
        .insert(dateData)
        .select()
        .single()

      if (error) throw error
      set((state) => ({ tripDates: [...state.tripDates, data] }))
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  removeTripDate: async (dateId) => {
    try {
      const { error } = await supabase
        .from('trip_dates')
        .delete()
        .eq('id', dateId)

      if (error) throw error
      set((state) => ({ tripDates: state.tripDates.filter(d => d.id !== dateId) }))
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // ── Manage trip addons ──
  addTripAddon: async (addonData) => {
    try {
      const { data, error } = await supabase
        .from('trip_addons')
        .insert(addonData)
        .select()
        .single()

      if (error) throw error
      set((state) => ({ tripAddons: [...state.tripAddons, data] }))
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  removeTripAddon: async (addonId) => {
    try {
      const { error } = await supabase
        .from('trip_addons')
        .delete()
        .eq('id', addonId)

      if (error) throw error
      set((state) => ({ tripAddons: state.tripAddons.filter(a => a.id !== addonId) }))
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // ── Image upload ──
  uploadTripImage: async (tripId, file) => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${tripId}/${Date.now()}.${fileExt}`

      const { data, error } = await supabase.storage
        .from('trip-images')
        .upload(fileName, file, { upsert: true })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('trip-images')
        .getPublicUrl(fileName)

      return { success: true, url: publicUrl }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Clear
  clearCurrentTrip: () => set({ currentTrip: null, tripDates: [], tripAddons: [] }),
  clearError: () => set({ error: null }),
}))

export default useTripStore
