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

  const roleHierarchy = { viewer: 1, publisher: 2, admin: 3 }
  const userRoleLevel = roleHierarchy[profile?.role || 'viewer'] || 1
  const requiredLevel = roleHierarchy[requiredRole] || 1

  if (userRoleLevel < requiredLevel) {
    return <Navigate to="/" replace />
  }

  return children
}
