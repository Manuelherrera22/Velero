import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Hook that re-runs a callback when:
 * 1. The browser tab becomes visible again (tab switching)
 * 2. The route changes (SPA navigation between panels)
 * 
 * This ensures data is always fresh after the user switches tabs or panels,
 * without requiring F5 or any manual action.
 * 
 * @param {Function} callback - Function to call when tab becomes visible or route changes
 * @param {number} minInterval - Minimum ms between re-fetches (default 3s)
 */
export function useRefetchOnFocus(callback, minInterval = 1000) {
  const lastFetch = useRef(0)
  const timerRef = useRef(null)
  const location = useLocation()

  // Re-fetch on tab visibility change
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now()
        if (now - lastFetch.current > minInterval) {
          lastFetch.current = now
          if (timerRef.current) clearTimeout(timerRef.current)
          // Fast refetch — 300ms is enough to let the tab settle
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

  // Re-fetch on route change (SPA navigation)
  useEffect(() => {
    const now = Date.now()
    if (now - lastFetch.current > minInterval) {
      lastFetch.current = now
      callback()
    }
  }, [location.pathname]) // eslint-disable-line react-hooks/exhaustive-deps
}
