import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { Shield, Eye, Tag, BarChart3, Building2, Users } from 'lucide-react'
import ReviewTrips from './ReviewTrips'
import ManageCoupons from './ManageCoupons'
import ManageHotels from './ManageHotels'
import ManageUsers from './ManageUsers'
import AdminMetrics from './AdminMetrics'
import '../Dashboard/Dashboard.css'
import './Admin.css'
import './AdminMetrics.css'

export default function Admin() {
  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard__layout">
          <aside className="dashboard__sidebar glass">
            <h2 className="dashboard__sidebar-title">
              <Shield size={20} /> Admin
            </h2>
            <nav className="dashboard__nav">
              <NavLink to="/admin/metricas" className={({ isActive }) => `dashboard__nav-item ${isActive ? 'dashboard__nav-item--active' : ''}`}>
                <BarChart3 size={18} /> Métricas
              </NavLink>
              <NavLink to="/admin/travesias" className={({ isActive }) => `dashboard__nav-item ${isActive ? 'dashboard__nav-item--active' : ''}`}>
                <Eye size={18} /> Revisar Travesías
              </NavLink>
              <NavLink to="/admin/usuarios" className={({ isActive }) => `dashboard__nav-item ${isActive ? 'dashboard__nav-item--active' : ''}`}>
                <Users size={18} /> Usuarios
              </NavLink>
              <NavLink to="/admin/cupones" className={({ isActive }) => `dashboard__nav-item ${isActive ? 'dashboard__nav-item--active' : ''}`}>
                <Tag size={18} /> Cupones
              </NavLink>
              <NavLink to="/admin/hoteles" className={({ isActive }) => `dashboard__nav-item ${isActive ? 'dashboard__nav-item--active' : ''}`}>
                <Building2 size={18} /> Hoteles & QR
              </NavLink>
            </nav>
          </aside>

          <div className="dashboard__content">
            <Routes>
              <Route index element={<Navigate to="metricas" replace />} />
              <Route path="metricas" element={<AdminMetrics />} />
              <Route path="travesias" element={<ReviewTrips />} />
              <Route path="usuarios" element={<ManageUsers />} />
              <Route path="cupones" element={<ManageCoupons />} />
              <Route path="hoteles" element={<ManageHotels />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  )
}
