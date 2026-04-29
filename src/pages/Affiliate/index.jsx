import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { Building2, QrCode, DollarSign, BarChart3 } from 'lucide-react'
import AffiliateHome from './AffiliateHome'
import AffiliateQRs from './AffiliateQRs'
import AffiliateCommissions from './AffiliateCommissions'
import '../Dashboard/Dashboard.css'

export default function AffiliateDashboard() {
  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard__layout">
          <aside className="dashboard__sidebar glass">
            <h2 className="dashboard__sidebar-title">
              <Building2 size={20} /> Mi Negocio
            </h2>
            <nav className="dashboard__nav">
              <NavLink to="/afiliado/resumen" className={({ isActive }) => `dashboard__nav-item ${isActive ? 'dashboard__nav-item--active' : ''}`}>
                <BarChart3 size={18} /> Resumen
              </NavLink>
              <NavLink to="/afiliado/qr" className={({ isActive }) => `dashboard__nav-item ${isActive ? 'dashboard__nav-item--active' : ''}`}>
                <QrCode size={18} /> Mis Códigos QR
              </NavLink>
              <NavLink to="/afiliado/comisiones" className={({ isActive }) => `dashboard__nav-item ${isActive ? 'dashboard__nav-item--active' : ''}`}>
                <DollarSign size={18} /> Comisiones
              </NavLink>
            </nav>
          </aside>

          <div className="dashboard__content">
            <Routes>
              <Route index element={<Navigate to="resumen" replace />} />
              <Route path="resumen" element={<AffiliateHome />} />
              <Route path="qr" element={<AffiliateQRs />} />
              <Route path="comisiones" element={<AffiliateCommissions />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  )
}
