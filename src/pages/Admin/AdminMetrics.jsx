import { useState, useEffect } from 'react'
import { BarChart3, DollarSign, Users, Ship, CalendarCheck, TrendingUp, QrCode, MapPin } from 'lucide-react'
import supabase from '../../lib/supabase'
import './AdminMetrics.css'

export default function AdminMetrics() {
  const [stats, setStats] = useState({
    totalBookings: 0,
    confirmedBookings: 0,
    totalRevenue: 0,
    totalTrips: 0,
    publishedTrips: 0,
    pendingTrips: 0,
    totalUsers: 0,
    totalBoats: 0,
    totalQRScans: 0,
  })
  const [topTrips, setTopTrips] = useState([])
  const [topHotels, setTopHotels] = useState([])
  const [recentBookings, setRecentBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchMetrics() }, [])

  const fetchMetrics = async () => {
    setLoading(true)

    // Fetch all metrics in parallel
    const [
      { count: totalBookings },
      { count: confirmedBookings },
      { data: bookingsData },
      { count: totalTrips },
      { count: publishedTrips },
      { count: pendingTrips },
      { count: totalUsers },
      { count: totalBoats },
      { data: qrData },
      { data: topTripsData },
      { data: hotelsData },
      { data: recentData },
    ] = await Promise.all([
      supabase.from('bookings').select('*', { count: 'exact', head: true }),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
      supabase.from('bookings').select('total').in('status', ['confirmed', 'completed']),
      supabase.from('trips').select('*', { count: 'exact', head: true }),
      supabase.from('trips').select('*', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('trips').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('boats').select('*', { count: 'exact', head: true }),
      supabase.from('qr_codes').select('scan_count'),
      supabase.from('trips').select('id, title, location, price_per_person, currency, bookings(id)').eq('status', 'published').order('created_at', { ascending: false }).limit(10),
      supabase.from('hotels').select('*, qr_codes(scan_count)').order('created_at', { ascending: false }),
      supabase.from('bookings').select('*, trip:trips!trip_id(title)').order('created_at', { ascending: false }).limit(8),
    ])

    const totalRevenue = (bookingsData || []).reduce((s, b) => s + (b.total || 0), 0)
    const totalQRScans = (qrData || []).reduce((s, q) => s + (q.scan_count || 0), 0)

    // Process top trips by booking count
    const tripsWithBookings = (topTripsData || [])
      .map(t => ({ ...t, bookingCount: t.bookings?.length || 0 }))
      .sort((a, b) => b.bookingCount - a.bookingCount)
      .slice(0, 5)

    // Process hotels with total scans
    const hotelsWithScans = (hotelsData || [])
      .map(h => ({
        ...h,
        totalScans: (h.qr_codes || []).reduce((s, q) => s + (q.scan_count || 0), 0)
      }))
      .sort((a, b) => b.totalScans - a.totalScans)

    setStats({
      totalBookings: totalBookings || 0,
      confirmedBookings: confirmedBookings || 0,
      totalRevenue,
      totalTrips: totalTrips || 0,
      publishedTrips: publishedTrips || 0,
      pendingTrips: pendingTrips || 0,
      totalUsers: totalUsers || 0,
      totalBoats: totalBoats || 0,
      totalQRScans,
    })
    setTopTrips(tripsWithBookings)
    setTopHotels(hotelsWithScans)
    setRecentBookings(recentData || [])
    setLoading(false)
  }

  if (loading) {
    return <div className="protected-loading"><p>Cargando métricas...</p></div>
  }

  return (
    <div className="dash-page">
      <div className="dash-pane">
        <div className="dash-pane__header">
          <div className="dash-pane__header-left">
            <h1 className="dash-pane__title">Métricas del Negocio</h1>
          </div>
        </div>

      {/* KPI Cards */}
      <div className="metrics-grid">
        <div className="metric-card glass">
          <div className="metric-card__icon" style={{ background: 'rgba(0, 180, 180, 0.1)', color: 'var(--color-accent-400)' }}>
            <DollarSign size={22} />
          </div>
          <div className="metric-card__info">
            <span className="metric-card__value">${stats.totalRevenue.toLocaleString('es-AR')}</span>
            <span className="metric-card__label">Ingresos Totales</span>
          </div>
        </div>

        <div className="metric-card glass">
          <div className="metric-card__icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            <CalendarCheck size={22} />
          </div>
          <div className="metric-card__info">
            <span className="metric-card__value">{stats.totalBookings}</span>
            <span className="metric-card__label">Reservas Totales ({stats.confirmedBookings} confirmadas)</span>
          </div>
        </div>

        <div className="metric-card glass">
          <div className="metric-card__icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
            <Ship size={22} />
          </div>
          <div className="metric-card__info">
            <span className="metric-card__value">{stats.publishedTrips}</span>
            <span className="metric-card__label">Travesías Publicadas ({stats.pendingTrips} pendientes)</span>
          </div>
        </div>

        <div className="metric-card glass">
          <div className="metric-card__icon" style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
            <Users size={22} />
          </div>
          <div className="metric-card__info">
            <span className="metric-card__value">{stats.totalUsers}</span>
            <span className="metric-card__label">Usuarios · {stats.totalBoats} Embarcaciones</span>
          </div>
        </div>

        <div className="metric-card glass">
          <div className="metric-card__icon" style={{ background: 'rgba(249, 115, 22, 0.1)', color: '#f97316' }}>
            <QrCode size={22} />
          </div>
          <div className="metric-card__info">
            <span className="metric-card__value">{stats.totalQRScans}</span>
            <span className="metric-card__label">Escaneos QR Totales</span>
          </div>
        </div>
      </div>

      {/* Tables Row */}
      <div className="metrics-tables">
        {/* Top Trips */}
        <div className="metrics-table glass">
          <h3 className="metrics-table__title"><TrendingUp size={18} /> Travesías Más Reservadas</h3>
          {topTrips.length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>Sin datos aún</p>
          ) : (
            <div className="metrics-table__rows">
              {topTrips.map((trip, i) => (
                <div key={trip.id} className="metrics-table__row">
                  <span className="metrics-table__rank">#{i + 1}</span>
                  <div className="metrics-table__info">
                    <strong>{trip.title}</strong>
                    <span><MapPin size={12} /> {trip.location}</span>
                  </div>
                  <span className="metrics-table__count">{trip.bookingCount} reservas</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Hotels QR */}
        <div className="metrics-table glass">
          <h3 className="metrics-table__title"><QrCode size={18} /> QR por Hotel</h3>
          {topHotels.length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>Sin hoteles registrados</p>
          ) : (
            <div className="metrics-table__rows">
              {topHotels.map((hotel, i) => (
                <div key={hotel.id} className="metrics-table__row">
                  <span className="metrics-table__rank">#{i + 1}</span>
                  <div className="metrics-table__info">
                    <strong>{hotel.name}</strong>
                    <span>{hotel.location}</span>
                  </div>
                  <span className="metrics-table__count">{hotel.totalScans} scans</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="metrics-table glass" style={{ marginTop: 'var(--space-6)' }}>
        <h3 className="metrics-table__title"><CalendarCheck size={18} /> Últimas Reservas</h3>
        {recentBookings.length === 0 ? (
          <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>Sin reservas aún</p>
        ) : (
          <div className="metrics-table__rows">
            {recentBookings.map(b => (
              <div key={b.id} className="metrics-table__row">
                <span className={`status-badge status-badge--${b.status}`} style={{ fontSize: '10px', minWidth: '70px', textAlign: 'center' }}>
                  {b.status === 'pending' ? 'Pendiente' : b.status === 'confirmed' ? 'Confirmada' : b.status}
                </span>
                <div className="metrics-table__info">
                  <strong>{b.trip?.title || '—'}</strong>
                  <span>{b.guest_name || b.guest_email || 'Usuario registrado'} · {b.quantity} pers.</span>
                </div>
                <span className="metrics-table__count" style={{ color: 'var(--color-accent-400)' }}>
                  ${b.total?.toLocaleString('es-AR')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
