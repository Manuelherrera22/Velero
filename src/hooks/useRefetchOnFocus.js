import { useEffect, useRef } from 'react'

/**
 * Hook that re-runs a callback when the browser tab becomes visible again.
 * This ensures data is always fresh after the user switches tabs,
 * without requiring F5 or any manual action.
 * 
 * Uses a 1.5s delay to let Supabase's internal auth token refresh 
 * complete before re-fetching data (avoids Web Lock conflicts).
 * 
 * @param {Function} callback - Function to call when tab becomes visible
 * @param {number} minInterval - Minimum ms between re-fetches (default 3s)
 */
export function useRefetchOnFocus(callback, minInterval = 3000) {
  const lastFetch = useRef(0)
  const timerRef = useRef(null)

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now()
        if (now - lastFetch.current > minInterval) {
          lastFetch.current = now
          // Clear any pending refetch
          if (timerRef.current) clearTimeout(timerRef.current)
          // Delay to let Supabase auth token refresh settle
          // (avoids Web Lock API conflicts that cause AbortError)
          timerRef.current = setTimeout(() => {
            callback()
          }, 1500)
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [callback, minInterval])
}
