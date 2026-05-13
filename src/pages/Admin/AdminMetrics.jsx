import { useState, useEffect } from 'react'
import { BarChart3, DollarSign, Users, Ship, CalendarCheck, TrendingUp, QrCode, MapPin, Download, ChevronDown, ChevronUp, Filter } from 'lucide-react'
import supabase from '../../lib/supabase'
import './AdminMetrics.css'

export default function AdminMetrics() {
  const [stats, setStats] = useState({
    totalBookings: 0,
    confirmedBookings: 0,
    pendingBookings: 0,
    cancelledBookings: 0,
    completedBookings: 0,
    totalRevenue: 0,
    totalTrips: 0,
    publishedTrips: 0,
    pendingTrips: 0,
    draftTrips: 0,
    rejectedTrips: 0,
    totalUsers: 0,
    totalBoats: 0,
    totalQRScans: 0,
    viewerUsers: 0,
    publisherUsers: 0,
    affiliateUsers: 0,
    adminUsers: 0,
  })
  const [topTrips, setTopTrips] = useState([])
  const [topHotels, setTopHotels] = useState([])
  const [recentBookings, setRecentBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedCard, setExpandedCard] = useState(null)

  // Date range filter
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => { fetchMetrics() }, [])

  const fetchMetrics = async (from, to) => {
    setLoading(true)

    // Build date filters
    const applyDateFilter = (query, dateCol = 'created_at') => {
      if (from) query = query.gte(dateCol, `${from}T00:00:00`)
      if (to) query = query.lte(dateCol, `${to}T23:59:59`)
      return query
    }

    // Fetch all metrics in parallel
    const [
      { count: totalBookings },
      { count: confirmedBookings },
      { count: pendingBookings },
      { count: cancelledBookings },
      { count: completedBookings },
      { data: bookingsData },
      { count: totalTrips },
      { count: publishedTrips },
      { count: pendingTrips },
      { count: draftTrips },
      { count: rejectedTrips },
      { count: totalUsers },
      { count: viewerUsers },
      { count: publisherUsers },
      { count: affiliateUsers },
      { count: adminUsers },
      { count: totalBoats },
      { data: qrData },
      { data: topTripsData },
      { data: hotelsData },
      { data: recentData },
    ] = await Promise.all([
      applyDateFilter(supabase.from('bookings').select('*', { count: 'exact', head: true })),
      applyDateFilter(supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'confirmed')),
      applyDateFilter(supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending')),
      applyDateFilter(supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'cancelled')),
      applyDateFilter(supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'completed')),
      applyDateFilter(supabase.from('bookings').select('total, status, created_at, guest_name, guest_email, quantity').in('status', ['confirmed', 'completed'])),
      applyDateFilter(supabase.from('trips').select('*', { count: 'exact', head: true })),
      applyDateFilter(supabase.from('trips').select('*', { count: 'exact', head: true }).eq('status', 'published')),
      applyDateFilter(supabase.from('trips').select('*', { count: 'exact', head: true }).eq('status', 'pending')),
      applyDateFilter(supabase.from('trips').select('*', { count: 'exact', head: true }).eq('status', 'draft')),
      applyDateFilter(supabase.from('trips').select('*', { count: 'exact', head: true }).eq('status', 'rejected')),
      applyDateFilter(supabase.from('profiles').select('*', { count: 'exact', head: true })),
      applyDateFilter(supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'viewer')),
      applyDateFilter(supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'publisher')),
      applyDateFilter(supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'affiliate')),
      applyDateFilter(supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin')),
      supabase.from('boats').select('*', { count: 'exact', head: true }),
      supabase.from('qr_codes').select('scan_count'),
      supabase.from('trips').select('id, title, location, price_per_person, currency, bookings(id)').eq('status', 'published').order('created_at', { ascending: false }).limit(10),
      supabase.from('hotels').select('*, qr_codes(scan_count)').order('created_at', { ascending: false }),
      applyDateFilter(supabase.from('bookings').select('*, trip:trips!trip_id(title)').order('created_at', { ascending: false }).limit(8)),
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
      pendingBookings: pendingBookings || 0,
      cancelledBookings: cancelledBookings || 0,
      completedBookings: completedBookings || 0,
      totalRevenue,
      totalTrips: totalTrips || 0,
      publishedTrips: publishedTrips || 0,
      pendingTrips: pendingTrips || 0,
      draftTrips: draftTrips || 0,
      rejectedTrips: rejectedTrips || 0,
      totalUsers: totalUsers || 0,
      viewerUsers: viewerUsers || 0,
      publisherUsers: publisherUsers || 0,
      affiliateUsers: affiliateUsers || 0,
      adminUsers: adminUsers || 0,
      totalBoats: totalBoats || 0,
      totalQRScans,
    })
    setTopTrips(tripsWithBookings)
    setTopHotels(hotelsWithScans)
    setRecentBookings(recentData || [])
    setLoading(false)
  }

  const handleApplyFilter = () => {
    fetchMetrics(dateFrom, dateTo)
  }

  const handleClearFilter = () => {
    setDateFrom('')
    setDateTo('')
    fetchMetrics()
  }

  const toggleCard = (card) => {
    setExpandedCard(expandedCard === card ? null : card)
  }

  // Export to CSV/Excel
  const handleExport = () => {
    const dateLabel = (dateFrom || dateTo) ? ` (${dateFrom || '∞'} a ${dateTo || '∞'})` : ' (Todos los períodos)'
    
    let csv = `Métricas Kailu${dateLabel}\n\n`
    csv += `Métrica,Valor\n`
    csv += `Ingresos Totales,$${stats.totalRevenue.toLocaleString('es-AR')}\n`
    csv += `Reservas Totales,${stats.totalBookings}\n`
    csv += `Reservas Confirmadas,${stats.confirmedBookings}\n`
    csv += `Reservas Pendientes,${stats.pendingBookings}\n`
    csv += `Reservas Canceladas,${stats.cancelledBookings}\n`
    csv += `Reservas Completadas,${stats.completedBookings}\n`
    csv += `Travesías Totales,${stats.totalTrips}\n`
    csv += `Travesías Publicadas,${stats.publishedTrips}\n`
    csv += `Travesías Pendientes,${stats.pendingTrips}\n`
    csv += `Travesías Borradores,${stats.draftTrips}\n`
    csv += `Travesías Rechazadas,${stats.rejectedTrips}\n`
    csv += `Usuarios Totales,${stats.totalUsers}\n`
    csv += `Pasajeros,${stats.viewerUsers}\n`
    csv += `Capitanes,${stats.publisherUsers}\n`
    csv += `Aliados,${stats.affiliateUsers}\n`
    csv += `Administradores,${stats.adminUsers}\n`
    csv += `Embarcaciones,${stats.totalBoats}\n`
    csv += `Escaneos QR Totales,${stats.totalQRScans}\n`

    csv += `\nTravesías Más Reservadas\n`
    csv += `Posición,Nombre,Ubicación,Reservas\n`
    topTrips.forEach((t, i) => {
      csv += `${i + 1},"${t.title}","${t.location}",${t.bookingCount}\n`
    })

    csv += `\nAliados por QR\n`
    csv += `Posición,Nombre,Ubicación,Escaneos\n`
    topHotels.forEach((h, i) => {
      csv += `${i + 1},"${h.name}","${h.location || ''}",${h.totalScans}\n`
    })

    csv += `\nÚltimas Reservas\n`
    csv += `Estado,Travesía,Pasajero,Cantidad,Total\n`
    recentBookings.forEach(b => {
      csv += `${b.status},"${b.trip?.title || '—'}","${b.guest_name || b.guest_email || ''}",${b.quantity},$${b.total?.toLocaleString('es-AR') || '0'}\n`
    })

    // Download
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `metricas-kailu-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return <div className="protected-loading"><p>Cargando métricas...</p></div>
  }

  const kpiCards = [
    {
      key: 'revenue',
      icon: <DollarSign size={22} />,
      iconBg: 'rgba(0, 180, 180, 0.1)',
      iconColor: 'var(--color-accent-400)',
      value: `$${stats.totalRevenue.toLocaleString('es-AR')}`,
      label: 'Ingresos Totales',
      breakdown: [
        { label: 'Reservas confirmadas', value: stats.confirmedBookings },
        { label: 'Reservas completadas', value: stats.completedBookings },
      ]
    },
    {
      key: 'bookings',
      icon: <CalendarCheck size={22} />,
      iconBg: 'rgba(59, 130, 246, 0.1)',
      iconColor: '#3b82f6',
      value: stats.totalBookings,
      label: `Reservas Totales`,
      breakdown: [
        { label: 'Confirmadas', value: stats.confirmedBookings },
        { label: 'Pendientes', value: stats.pendingBookings },
        { label: 'Completadas', value: stats.completedBookings },
        { label: 'Canceladas', value: stats.cancelledBookings },
      ]
    },
    {
      key: 'trips',
      icon: <Ship size={22} />,
      iconBg: 'rgba(34, 197, 94, 0.1)',
      iconColor: '#22c55e',
      value: stats.publishedTrips,
      label: `Travesías Publicadas`,
      breakdown: [
        { label: 'Publicadas', value: stats.publishedTrips },
        { label: 'Pendientes de revisión', value: stats.pendingTrips },
        { label: 'Borradores', value: stats.draftTrips },
        { label: 'Rechazadas', value: stats.rejectedTrips },
        { label: 'Total', value: stats.totalTrips },
      ]
    },
    {
      key: 'users',
      icon: <Users size={22} />,
      iconBg: 'rgba(168, 85, 247, 0.1)',
      iconColor: '#a855f7',
      value: stats.totalUsers,
      label: `Usuarios · ${stats.totalBoats} Embarcaciones`,
      breakdown: [
        { label: 'Pasajeros', value: stats.viewerUsers },
        { label: 'Capitanes', value: stats.publisherUsers },
        { label: 'Aliados', value: stats.affiliateUsers },
        { label: 'Administradores', value: stats.adminUsers },
      ]
    },
    {
      key: 'qr',
      icon: <QrCode size={22} />,
      iconBg: 'rgba(249, 115, 22, 0.1)',
      iconColor: '#f97316',
      value: stats.totalQRScans,
      label: 'Escaneos QR Totales',
      breakdown: topHotels.slice(0, 5).map(h => ({
        label: h.name,
        value: `${h.totalScans} scans`
      }))
    },
  ]

  return (
    <div className="dash-page">
      <div className="dash-pane">
        <div className="dash-pane__header">
          <div className="dash-pane__header-left">
            <h1 className="dash-pane__title">Métricas del Negocio</h1>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn--outline btn--sm" onClick={() => setShowFilters(!showFilters)}>
              <Filter size={14} /> {showFilters ? 'Ocultar Filtros' : 'Filtrar por Fecha'}
            </button>
            <button className="btn btn--accent btn--sm" onClick={handleExport}>
              <Download size={14} /> Exportar Excel
            </button>
          </div>
        </div>

        {/* Date Range Filter */}
        {showFilters && (
          <div className="metrics-filter glass" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
            <div className="input-group" style={{ flex: 1, minWidth: '160px', marginBottom: 0 }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Desde</label>
              <input className="input" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ minHeight: '36px', padding: '4px 10px' }} />
            </div>
            <div className="input-group" style={{ flex: 1, minWidth: '160px', marginBottom: 0 }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Hasta</label>
              <input className="input" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ minHeight: '36px', padding: '4px 10px' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px', paddingTop: '18px' }}>
              <button className="btn btn--accent btn--sm" onClick={handleApplyFilter}>Aplicar</button>
              {(dateFrom || dateTo) && (
                <button className="btn btn--ghost btn--sm" onClick={handleClearFilter}>Limpiar</button>
              )}
            </div>
          </div>
        )}

        {(dateFrom || dateTo) && (
          <div style={{ fontSize: '13px', color: 'var(--color-accent-400)', marginBottom: 'var(--space-4)', fontWeight: 500 }}>
            📊 Mostrando datos {dateFrom && `desde ${dateFrom}`} {dateTo && `hasta ${dateTo}`}
          </div>
        )}

      {/* KPI Cards */}
      <div className="metrics-grid">
        {kpiCards.map(card => (
          <div key={card.key} className={`metric-card glass metric-card--clickable ${expandedCard === card.key ? 'metric-card--expanded' : ''}`} onClick={() => toggleCard(card.key)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', width: '100%' }}>
              <div className="metric-card__icon" style={{ background: card.iconBg, color: card.iconColor }}>
                {card.icon}
              </div>
              <div className="metric-card__info" style={{ flex: 1 }}>
                <span className="metric-card__value">{card.value}</span>
                <span className="metric-card__label">{card.label}</span>
              </div>
              <div style={{ color: 'var(--text-tertiary)', transition: 'transform 0.2s' }}>
                {expandedCard === card.key ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>
            {expandedCard === card.key && card.breakdown.length > 0 && (
              <div className="metric-card__breakdown" onClick={(e) => e.stopPropagation()}>
                {card.breakdown.map((item, i) => (
                  <div key={i} className="metric-card__breakdown-row">
                    <span>{item.label}</span>
                    <span style={{ fontWeight: 600 }}>{item.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
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
          <h3 className="metrics-table__title"><QrCode size={18} /> QR por Aliado</h3>
          {topHotels.length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>Sin aliados registrados</p>
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
