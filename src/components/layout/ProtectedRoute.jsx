import { Navigate } from 'react-router-dom'
import useAuthStore from '../../stores/authStore'

/**
 * ProtectedRoute — Route guard component
 * 
 * Since App.jsx now gates all routes behind auth loading,
 * by the time this component mounts, auth is already resolved.
 * No need for loading states or safety timeouts here.
 * 
 * @param {object} props
 * @param {React.ReactNode} props.children - Child components to render if authorized
 * @param {'viewer'|'publisher'|'admin'} [props.requiredRole] - Minimum role required
 */
export default function ProtectedRoute({ children, requiredRole = 'viewer' }) {
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const hasAccess = () => {
    const role = profile?.role || 'viewer'
    if (role === 'admin') return true
    if (requiredRole === 'publisher' && role === 'publisher') return true
    if (requiredRole === 'affiliate' && role === 'affiliate') return true
    if (requiredRole === 'viewer') return true
    return false
  }

  if (!hasAccess()) {
    return <Navigate to="/" replace />
  }

  return children
}
