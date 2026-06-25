import { create } from 'zustand'
import supabase from '../lib/supabase'
import { withRetry } from '../utils/retry'

const useTripStore = create((set, get) => ({
  // State
  trips: [],
  featuredTrips: [],
  currentTrip: null,
  tripDates: [],
  tripAddons: [],
  tags: [],
  loading: false,
  isLoadingTrips: false,
  isLoadingTrip: false,
  error: null,

  // ── Fetch published trips (public) ──
  fetchTrips: async (filters = {}) => {
    set({ isLoadingTrips: true, error: null })
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

      // Apply zone filter (lookup zone ID by name, then filter by navigation_zone_id)
      if (filters.zone) {
        const { data: zoneData } = await supabase
          .from('navigation_zones')
          .select('id')
          .ilike('name', `%${filters.zone}%`)
          .limit(1)
          .single()

        if (zoneData?.id) {
          query = query.eq('navigation_zone_id', zoneData.id)
        } else {
          // Fallback: search by location text if zone not found
          query = query.ilike('location', `%${filters.zone}%`)
        }
      }

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

      const data = await withRetry(async () => {
        const { data: d, error: e } = await query.abortSignal(AbortSignal.timeout(12000))
        if (e) throw e
        return d
      }, { label: 'fetchTrips', maxRetries: 2, baseDelay: 500 })

      set({ trips: data || [], isLoadingTrips: false })
      return data || []
    } catch (error) {
      set({ error: error.message, isLoadingTrips: false })
      return []
    }
  },

  // ── Fetch featured trips for landing page ──
  fetchFeaturedTrips: async () => {
    try {
      const data = await withRetry(async () => {
        const { data: d, error: e } = await supabase
          .from('trips')
          .select(`
            *,
            captain:profiles!captain_id(id, full_name, avatar_url, is_verified),
            boat:boats!boat_id(id, name, type, length_m)
          `)
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(6)
          .abortSignal(AbortSignal.timeout(6000))
        if (e) throw e
        return d
      }, { label: 'fetchFeaturedTrips', maxRetries: 2 })

      set({ featuredTrips: data || [], error: null })
    } catch (error) {
      console.error('Error fetching featured trips:', error)
      set({ error: error.message })
    }
  },

  // ── Fetch single trip with all details ──
  fetchTrip: async (tripId) => {
    set({ isLoadingTrip: true, error: null })
    try {
      // Fetch trip (critical — must succeed)
      const trip = await withRetry(async () => {
        const { data: d, error: e } = await supabase
          .from('trips')
          .select(`
            *,
            captain:profiles!captain_id(id, full_name, avatar_url, is_verified, bio, location),
            boat:boats!boat_id(*)
          `)
          .eq('id', tripId)
          .single()
          .abortSignal(AbortSignal.timeout(6000))
        if (e) throw e
        return d
      }, { label: 'fetchTrip', maxRetries: 1 })

      // Fetch dates, addons, reviews in parallel — each with its own timeout
      // If any fails, we still show the trip with partial data
      const [datesResult, addonsResult, reviewsResult] = await Promise.allSettled([
        supabase.from('trip_dates').select('*').eq('trip_id', tripId).eq('is_active', true)
          .gte('date', new Date().toISOString().split('T')[0]).order('date', { ascending: true })
          .abortSignal(AbortSignal.timeout(5000)),
        supabase.from('trip_addons').select('*').eq('trip_id', tripId).eq('is_active', true)
          .abortSignal(AbortSignal.timeout(5000)),
        supabase.from('reviews').select(`*, user:profiles!user_id(full_name, avatar_url)`)
          .eq('trip_id', tripId).eq('is_published', true).order('created_at', { ascending: false })
          .abortSignal(AbortSignal.timeout(5000)),
      ])

      const dates = datesResult.status === 'fulfilled' ? datesResult.value.data : []
      const addons = addonsResult.status === 'fulfilled' ? addonsResult.value.data : []
      const reviews = reviewsResult.status === 'fulfilled' ? reviewsResult.value.data : []

      // Calculate average rating
      const avgRating = reviews?.length
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : null

      set({
        currentTrip: { ...trip, avgRating, reviewCount: reviews?.length || 0 },
        tripDates: dates || [],
        tripAddons: addons || [],
        isLoadingTrip: false,
      })

      return { trip: { ...trip, avgRating, reviewCount: reviews?.length || 0 }, dates, addons, reviews }
    } catch (error) {
      console.error('Error en fetchTrip:', error)
      set({ error: error.message, isLoadingTrip: false })
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
        .abortSignal(AbortSignal.timeout(6000))

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
      // Use user from auth store instead of getSession() — avoids race with token refresh
      const { default: useAuthStore } = await import('./authStore')
      const user = useAuthStore.getState().user
      if (!user) {
        set({ loading: false })
        return []
      }

      const data = await withRetry(async () => {
        const { data: d, error: e } = await supabase
          .from('trips')
          .select(`
            *,
            boat:boats!boat_id(id, name, type)
          `)
          .eq('captain_id', user.id)
          .order('created_at', { ascending: false })
          .abortSignal(AbortSignal.timeout(6000))

        if (e) throw e
        return d
      }, { label: 'fetchMyTrips', maxRetries: 1, baseDelay: 500 })

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
      const { default: useAuthStore } = await import('./authStore')
      const user = useAuthStore.getState().user
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

  deleteTrip: async (tripId) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', tripId)

      if (error) throw error
      
      set((state) => ({ 
        trips: state.trips.filter(t => t.id !== tripId),
        loading: false 
      }))
      return { success: true }
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
