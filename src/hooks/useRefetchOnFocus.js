import { useEffect, useRef } from 'react'

/**
 * Hook that re-runs a callback when the browser tab becomes visible again.
 * This ensures data is always fresh after the user switches tabs,
 * without requiring F5 or any manual action.
 * 
 * Adds a small delay (300ms) to let the auth session refresh complete
 * before re-fetching data.
 * 
 * @param {Function} callback - Function to call when tab becomes visible
 * @param {number} minInterval - Minimum ms between re-fetches (default 2s)
 */
export function useRefetchOnFocus(callback, minInterval = 2000) {
  const lastFetch = useRef(0)

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now()
        if (now - lastFetch.current > minInterval) {
          lastFetch.current = now
          // Small delay to let auth session refresh first (App.jsx visibility handler)
          setTimeout(() => {
            callback()
          }, 300)
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [callback, minInterval])
}
