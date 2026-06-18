import { useEffect, useRef } from 'react'

/**
 * Hook that re-runs a callback when the browser tab becomes visible again.
 * This ensures data is always fresh after the user switches tabs,
 * without requiring F5 or any manual action.
 * 
 * @param {Function} callback - Function to call when tab becomes visible
 * @param {number} minInterval - Minimum ms between re-fetches (default 5s)
 */
export function useRefetchOnFocus(callback, minInterval = 5000) {
  const lastFetch = useRef(Date.now())

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now()
        // Only re-fetch if enough time has passed (avoid rapid re-fetches)
        if (now - lastFetch.current > minInterval) {
          lastFetch.current = now
          callback()
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [callback, minInterval])
}
