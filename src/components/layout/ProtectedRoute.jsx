import { Navigate } from 'react-router-dom'
import useAuthStore from '../../stores/authStore'
import { Loader } from 'lucide-react'

/**
 * ProtectedRoute — Route guard component
 * 
 * @param {object} props
 * @param {React.ReactNode} props.children - Child components to render if authorized
 * @param {'viewer'|'publisher'|'admin'} [props.requiredRole] - Minimum role required
 */
export default function ProtectedRoute({ children, requiredRole = 'viewer' }) {
  const { user, profile, loading } = useAuthStore()

  // Safety: if still loading after 5s, redirect to login
  if (loading) {
    return (
      <div className="protected-loading">
        <Loader size={32} className="spin" />
        <p>Cargando...</p>
      </div>
    )
  }

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
