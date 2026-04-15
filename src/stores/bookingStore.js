import { create } from 'zustand'
import supabase from '../lib/supabase'

const useBookingStore = create((set, get) => ({
  bookings: [],
  currentBooking: null,
  loading: false,
  error: null,

  // Create a booking (supports guest checkout)
  createBooking: async (bookingData) => {
    set({ loading: true, error: null })
    try {
      // Separate addons from booking data — 'addons' is not a column in bookings table
      const { addons, ...bookingInsert } = bookingData

      const { data, error } = await supabase
        .from('bookings')
        .insert(bookingInsert)
        .select()
        .single()

      if (error) throw error

      // Insert booking addons if any
      if (addons?.length > 0) {
        const addonInserts = addons.map(addon => ({
          booking_id: data.id,
          addon_id: addon.id,
          name: addon.name,
          quantity: addon.quantity || 1,
          unit_price: addon.price,
          total: addon.price * (addon.quantity || 1),
        }))

        await supabase.from('booking_addons').insert(addonInserts)
      }

      set({ currentBooking: data, loading: false })
      return { success: true, data }
    } catch (error) {
      set({ error: error.message, loading: false })
      return { success: false, error: error.message }
    }
  },

  // Fetch user's bookings
  fetchMyBookings: async () => {
    set({ loading: true, error: null })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          trip:trips!trip_id(id, title, location, images),
          trip_date:trip_dates!trip_date_id(date, start_time)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      set({ bookings: data || [], loading: false })
      return data || []
    } catch (error) {
      set({ error: error.message, loading: false })
      return []
    }
  },

  // Fetch bookings for captain's trips
  fetchCaptainBookings: async () => {
    set({ loading: true, error: null })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      // First get captain's trip IDs
      const { data: trips } = await supabase
        .from('trips')
        .select('id')
        .eq('captain_id', user.id)

      if (!trips?.length) {
        set({ bookings: [], loading: false })
        return []
      }

      const tripIds = trips.map(t => t.id)

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          trip:trips!trip_id(id, title, location),
          trip_date:trip_dates!trip_date_id(date, start_time),
          user:profiles!user_id(full_name, email, phone)
        `)
        .in('trip_id', tripIds)
        .order('created_at', { ascending: false })

      if (error) throw error
      set({ bookings: data || [], loading: false })
      return data || []
    } catch (error) {
      set({ error: error.message, loading: false })
      return []
    }
  },

  // Validate coupon
  validateCoupon: async (code) => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single()

      if (error) return { valid: false, error: 'Cupón no encontrado' }

      const now = new Date()
      if (data.valid_from && new Date(data.valid_from) > now) return { valid: false, error: 'Cupón aún no válido' }
      if (data.valid_until && new Date(data.valid_until) < now) return { valid: false, error: 'Cupón expirado' }
      if (data.current_uses >= data.max_uses) return { valid: false, error: 'Cupón agotado' }

      return { valid: true, coupon: data }
    } catch (error) {
      return { valid: false, error: error.message }
    }
  },

  clearError: () => set({ error: null }),
}))

export default useBookingStore
