import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Bypass navigator.locks API — it causes 5000ms timeout when browser
    // throttles background tabs (e.g., user has many tabs open).
    // This is safe for single-tab apps. The server handles concurrent refreshes gracefully.
    lock: async (name, acquireTimeout, fn) => await fn(),
  },
})

export default supabase
