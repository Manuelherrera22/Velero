import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { Sailboat, Ship, CalendarCheck, BarChart3, Plus } from 'lucide-react'
import MyTrips from './MyTrips'
import TripEditor from './TripEditor'
import MyBoats from './MyBoats'
import Bookings from './Bookings'
import './Dashboard.css'

export default function Dashboard() {
  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard__layout">
          {/* Sidebar */}
          <aside className="dashboard__sidebar glass">
            <h2 className="dashboard__sidebar-title">
              <Sailboat size={20} /> Dashboard
            </h2>
            <nav className="dashboard__nav">
              <NavLink to="/dashboard/travesias" className={({ isActive }) => `dashboard__nav-item ${isActive ? 'dashboard__nav-item--active' : ''}`}>
                <CalendarCheck size={18} /> Mis Travesías
              </NavLink>
              <NavLink to="/dashboard/embarcaciones" className={({ isActive }) => `dashboard__nav-item ${isActive ? 'dashboard__nav-item--active' : ''}`}>
                <Ship size={18} /> Embarcaciones
              </NavLink>
              <NavLink to="/dashboard/reservas" className={({ isActive }) => `dashboard__nav-item ${isActive ? 'dashboard__nav-item--active' : ''}`}>
                <BarChart3 size={18} /> Reservas
              </NavLink>
            </nav>
          </aside>

          {/* Content */}
          <div className="dashboard__content">
            <Routes>
              <Route index element={<Navigate to="travesias" replace />} />
              <Route path="travesias" element={<MyTrips />} />
              <Route path="travesias/nueva" element={<TripEditor />} />
              <Route path="travesias/:tripId/editar" element={<TripEditor />} />
              <Route path="embarcaciones" element={<MyBoats />} />
              <Route path="reservas" element={<Bookings />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  )
}
