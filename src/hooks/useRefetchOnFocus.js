import { useEffect, useRef } from 'react'

/**
 * Hook that re-runs a callback when the browser tab becomes visible again.
 * 
 * This ensures data is always fresh after the user switches tabs,
 * without requiring F5 or any manual action.
 * 
 * NOTE: Route-change refetching was removed to avoid double-fetches.
 * Each component's own useEffect handles the initial fetch on mount.
 * This hook ONLY handles tab visibility changes.
 * 
 * @param {Function} callback - Function to call when tab becomes visible
 * @param {number} minInterval - Minimum ms between re-fetches (default 5s)
 */
export function useRefetchOnFocus(callback, minInterval = 5000) {
  const lastFetch = useRef(Date.now()) // Start as "just fetched" to avoid immediate re-fetch
  const timerRef = useRef(null)

  // Re-fetch on tab visibility change only
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now()
        if (now - lastFetch.current > minInterval) {
          console.log(`[Refetch] tab visible, refetching (${Math.round((now - lastFetch.current) / 1000)}s since last)`)
          lastFetch.current = now
          if (timerRef.current) clearTimeout(timerRef.current)
          // Small delay to let the tab settle
          timerRef.current = setTimeout(() => {
            callback()
          }, 300)
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
