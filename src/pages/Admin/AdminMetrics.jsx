import { useState, useEffect, useCallback } from 'react'
import { BarChart3, DollarSign, Users, Ship, CalendarCheck, TrendingUp, QrCode, MapPin, Download, ChevronDown, ChevronUp, Filter, X, AlertTriangle, Anchor, Plus } from 'lucide-react'
import supabase from '../../lib/supabase'
import { useRefetchOnFocus } from '../../hooks/useRefetchOnFocus'
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

  // Voucher search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [hasSearched, setHasSearched] = useState(false)

  // Capacity Alerts & Navigation Zones states
  const [capacityAlerts, setCapacityAlerts] = useState([])
  const [navigationZones, setNavigationZones] = useState([])
  const [newZoneName, setNewZoneName] = useState('')
  const [zoneActionLoading, setZoneActionLoading] = useState(false)

  useEffect(() => {
    fetchMetrics()
    const t = setTimeout(() => setLoading(false), 8000)
    return () => clearTimeout(t)
  }, [])

  const refetchMetrics = useCallback(() => { fetchMetrics() }, [])
  useRefetchOnFocus(refetchMetrics)

  const handleAddZone = async (e) => {
    e.preventDefault()
    if (!newZoneName.trim()) return
    setZoneActionLoading(true)
    try {
      const { data, error } = await supabase
        .from('navigation_zones')
        .insert([{ name: newZoneName.trim() }])
        .select()
      
      if (error) {
        alert("Error al agregar zona: " + error.message)
      } else if (data) {
        setNavigationZones(prev => [...prev, ...data].sort((a, b) => a.name.localeCompare(b.name)))
        setNewZoneName('')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setZoneActionLoading(false)
    }
  }

  const handleToggleZone = async (zoneId, currentStatus) => {
    setZoneActionLoading(true)
    try {
      const { error } = await supabase
        .from('navigation_zones')
        .update({ is_active: !currentStatus })
        .eq('id', zoneId)
      
      if (error) {
        alert("Error al actualizar zona: " + error.message)
      } else {
        setNavigationZones(prev => prev.map(z => z.id === zoneId ? { ...z, is_active: !currentStatus } : z))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setZoneActionLoading(false)
    }
  }

  const handleSearchSubmit = async (e) => {
    e.preventDefault()
    const query = searchQuery.trim().toLowerCase()
    if (!query) {
      setHasSearched(false)
      setSearchResults([])
      return
    }

    setSearchLoading(true)
    try {
      let promises = []
      
      // 1. Search by voucher code (first 8 chars of UUID)
      if (/^[0-9a-f]{8}$/.test(query)) {
        const lower = `${query}-0000-0000-0000-000000000000`
        const upper = `${query}-ffff-ffff-ffff-ffffffffffff`
        promises.push(
          supabase
            .from('bookings')
            .select('*, trip:trips!trip_id(title, location), trip_date:trip_dates!trip_date_id(date, start_time)')
            .gte('id', lower)
            .lte('id', upper)
        )
      } else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(query)) {
        promises.push(
          supabase
            .from('bookings')
            .select('*, trip:trips!trip_id(title, location), trip_date:trip_dates!trip_date_id(date, start_time)')
            .eq('id', query)
        )
      }
      
      // 2. Search by guest name or email
      promises.push(
        supabase
          .from('bookings')
          .select('*, trip:trips!trip_id(title, location), trip_date:trip_dates!trip_date_id(date, start_time)')
          .or(`guest_name.ilike.%${query}%,guest_email.ilike.%${query}%`)
          .limit(30)
      )
      
      const results = await Promise.all(promises)
      const allBookings = []
      const seenIds = new Set()
      
      for (const res of results) {
        if (res.data) {
          for (const b of res.data) {
            if (!seenIds.has(b.id)) {
              seenIds.add(b.id)
              allBookings.push(b)
            }
          }
        }
      }

      setSearchResults(allBookings)
      setHasSearched(true)
      if (allBookings.length === 1) {
        setSelectedBooking(allBookings[0])
      }
    } catch (err) {
      console.error("Error searching bookings:", err)
    } finally {
      setSearchLoading(false)
    }
  }


  const fetchMetrics = async (from, to) => {
    setLoading(true)

    // Build date filters
    const applyDateFilter = (query, dateCol = 'created_at') => {
      if (from) query = query.gte(dateCol, `${from}T00:00:00`)
      if (to) query = query.lte(dateCol, `${to}T23:59:59`)
      return query
    }

    try {
      // Calculate date range for 72 hour capacity alerts
      const nowStr = new Date().toISOString().split('T')[0]
      const limitStr = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString().split('T')[0]

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
        { data: alertsData },
        { data: zonesData },
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
        // Capacity alerts
        supabase
          .from('trip_dates')
          .select('id, date, start_time, available_spots, trip:trips!trip_id(id, title, location, capacity, min_passengers, max_passengers, captain:profiles!captain_id(id, full_name, email, phone))')
          .gte('date', nowStr)
          .lte('date', limitStr)
          .eq('is_active', true)
          .order('date', { ascending: true }),
        // Navigation zones
        supabase
          .from('navigation_zones')
          .select('*')
          .order('name', { ascending: true }),
      ])

      const totalRevenue = (bookingsData || []).reduce((s, b) => s + (b.total || 0), 0)
      const totalQRScans = (qrData || []).reduce((s, q) => s + (q.scan_count || 0), 0)

      // Process top trips by booking count
      const tripsWithBookings = (topTripsData || [])
        .map(t => ({ ...t, bookingCount: t.bookings?.length || 0 }))
        .sort((a, b) => b.bookingCount - a.bookingCount)
        .slice(0, 5)

      // Process top hotels by QR scans
      const hotelsWithScans = (hotelsData || [])
        .map(h => ({
          ...h,
          totalScans: h.qr_codes?.reduce((s, qr) => s + (qr.scan_count || 0), 0) || 0
        }))
        .sort((a, b) => b.totalScans - a.totalScans)
        .slice(0, 5)

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

      // Process capacity alerts defensively
      const processedAlerts = []
      if (alertsData) {
        for (const d of alertsData) {
          if (d && d.trip) {
            const cap = d.trip.capacity || d.trip.max_passengers || 6
            const currentPassengers = cap - d.available_spots
            const minPass = d.trip.min_passengers ?? 1
            if (currentPassengers < minPass) {
              processedAlerts.push(d)
            }
          }
        }
      }
      setCapacityAlerts(processedAlerts)

      if (zonesData) {
        setNavigationZones(zonesData)
      }
    } catch (err) {
      console.error("Error fetching metrics:", err)
    } finally {
      setLoading(false)
    }
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
    csv += `ID,Estado,Travesía,Pasajero,Cantidad,Total\n`
    recentBookings.forEach(b => {
      csv += `${b.id?.slice(0,8).toUpperCase()},${b.status},"${b.trip?.title || '—'}","${b.guest_name || b.guest_email || ''}",${b.quantity},$${b.total?.toLocaleString('es-AR') || '0'}\n`
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

      {/* Capacity Alerts Section */}
      <div className="metrics-alerts-section" style={{ marginBottom: 'var(--space-6)' }}>
        <h3 className="metrics-table__title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b' }}>
          <AlertTriangle size={18} /> Alertas de Capacidad (Próximas 72 horas)
        </h3>
        {capacityAlerts.length === 0 ? (
          <div className="glass" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', color: 'var(--text-secondary)', fontSize: '14px' }}>
            ✅ Todas las salidas de las próximas 72hs cumplen con el mínimo de pasajeros o no tienen alertas.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 'var(--space-4)' }}>
            {capacityAlerts.map(alert => {
              const capacity = alert.trip.capacity || alert.trip.max_passengers || 6
              const currentPassengers = capacity - alert.available_spots
              const minPassengers = alert.trip.min_passengers || 1
              const captain = alert.trip.captain
              return (
                <div key={alert.id} className="glass alert-card" style={{
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-lg)',
                  borderLeft: '4px solid #f59e0b',
                  background: 'rgba(245, 158, 11, 0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{alert.trip.title}</h4>
                    <p style={{ margin: '6px 0 2px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      📅 <strong>Salida:</strong> {new Date(alert.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })} a las {alert.start_time.slice(0, 5)} hs
                    </p>
                    <p style={{ margin: '2px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      👥 <strong>Pasajeros:</strong> <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{currentPassengers}</span> / Mínimo: {minPassengers} (Max: {capacity})
                    </p>
                    {captain && (
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                        ⚓ <strong>Capitán:</strong> {captain.full_name || 'Sin nombre'} ({captain.email})
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: 'auto' }}>
                    <a href={`/trip/${alert.trip.id}`} target="_blank" rel="noreferrer" className="btn btn--outline btn--sm" style={{ padding: '4px 10px', minHeight: 'unset', fontSize: '11px' }}>
                      Ver Travesía
                    </a>
                    {captain?.phone && (
                      <a href={`https://wa.me/${captain.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="btn btn--accent btn--sm" style={{ padding: '4px 10px', minHeight: 'unset', fontSize: '11px', background: '#25d366', borderColor: '#25d366' }}>
                        WhatsApp
                      </a>
                    )}
                    {captain?.email && (
                      <a href={`mailto:${captain.email}?subject=Alerta de capacidad - Salida del ${alert.date}`} className="btn btn--ghost btn--sm" style={{ padding: '4px 10px', minHeight: 'unset', fontSize: '11px' }}>
                        Email
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: '12px' }}>
          <h3 className="metrics-table__title" style={{ marginBottom: 0 }}><CalendarCheck size={18} /> Últimas Reservas</h3>
          <form onSubmit={handleSearchSubmit} className="search-voucher-form" style={{ display: 'flex', gap: '8px', width: '100%', maxWidth: '400px' }}>
            <input 
              type="text" 
              className="input" 
              placeholder="Buscar por voucher (8 carac.) o cliente..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ minHeight: '36px', padding: '6px 12px', fontSize: '14px', flex: 1 }}
            />
            <button type="submit" className="btn btn--accent btn--sm" disabled={searchLoading} style={{ minHeight: '36px' }}>
              {searchLoading ? 'Buscando...' : 'Buscar'}
            </button>
          </form>
        </div>

        {/* Search Results */}
        {hasSearched && (
          <div className="search-results-container glass" style={{
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: 'var(--space-6)',
            background: 'rgba(255, 255, 255, 0.02)',
            animation: 'fadeSlide 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Resultados de la búsqueda</h4>
              <button 
                className="btn btn--ghost btn--sm" 
                style={{ padding: '2px 8px', minHeight: 'unset' }}
                onClick={() => {
                  setHasSearched(false);
                  setSearchResults([]);
                  setSearchQuery('');
                }}
              >
                Limpiar Resultados
              </button>
            </div>

            {searchResults.length === 0 ? (
              <p style={{ color: 'var(--text-tertiary)', fontSize: '13px', margin: 0 }}>No se encontraron reservas con esos criterios.</p>
            ) : (
              <div className="metrics-table__rows" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {searchResults.map(b => (
                  <div 
                    key={b.id} 
                    className="metrics-table__row" 
                    style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                    onClick={() => setSelectedBooking(b)}
                  >
                    <span className={`status-badge status-badge--${b.status}`} style={{ fontSize: '10px', minWidth: '70px', textAlign: 'center' }}>
                      {b.status === 'pending' ? 'Pendiente' : b.status === 'confirmed' ? 'Confirmada' : b.status}
                    </span>
                    <div className="metrics-table__info">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong>{b.trip?.title || '—'}</strong>
                        <span style={{ fontSize: '10px', background: 'var(--color-primary-50)', color: 'var(--color-primary-600)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--color-primary-100)' }}>
                          #{b.id?.slice(0, 8).toUpperCase()}
                        </span>
                      </div>
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
        )}

        {recentBookings.length === 0 ? (
          <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>Sin reservas aún</p>
        ) : (
          <div className="metrics-table__rows">
            {recentBookings.map(b => (
              <div key={b.id} className="metrics-table__row" style={{ cursor: 'pointer' }} onClick={() => setSelectedBooking(b)}>
                <span className={`status-badge status-badge--${b.status}`} style={{ fontSize: '10px', minWidth: '70px', textAlign: 'center' }}>
                  {b.status === 'pending' ? 'Pendiente' : b.status === 'confirmed' ? 'Confirmada' : b.status}
                </span>
                <div className="metrics-table__info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong>{b.trip?.title || '—'}</strong>
                    <span style={{ fontSize: '10px', background: 'var(--color-primary-50)', color: 'var(--color-primary-600)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--color-primary-100)' }}>
                      #{b.id?.slice(0, 8).toUpperCase()}
                    </span>
                  </div>
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

      {/* Navigation Zones Panel */}
      <div className="metrics-table glass" style={{ marginTop: 'var(--space-6)' }}>
        <h3 className="metrics-table__title">
          <Anchor size={18} /> Panel de Zonas de Navegación
        </h3>
        
        <form onSubmit={handleAddZone} style={{ display: 'flex', gap: '8px', marginBottom: 'var(--space-4)', maxWidth: '500px' }}>
          <input 
            type="text" 
            className="input" 
            placeholder="Nueva zona de navegación (ej. Patagonia Norte)..." 
            value={newZoneName}
            onChange={(e) => setNewZoneName(e.target.value)}
            disabled={zoneActionLoading}
            style={{ minHeight: '36px', padding: '6px 12px', fontSize: '14px', flex: 1 }}
          />
          <button type="submit" className="btn btn--accent btn--sm" disabled={zoneActionLoading || !newZoneName.trim()} style={{ minHeight: '36px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Plus size={14} /> Agregar
          </button>
        </form>

        {navigationZones.length === 0 ? (
          <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', fontStyle: 'italic' }}>
            No hay zonas de navegación configuradas o la base de datos no está migrada.
          </p>
        ) : (
          <div className="metrics-table__rows" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-2)' }}>
            {navigationZones.map(zone => (
              <div key={zone.id} className="metrics-table__row" style={{
                background: 'rgba(255, 255, 255, 0.01)',
                border: '1px solid rgba(255, 255, 255, 0.04)',
                borderRadius: '8px',
                padding: '10px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                minWidth: 'unset'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: zone.is_active ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                    {zone.name}
                  </span>
                  <span style={{ fontSize: '11px', color: zone.is_active ? '#22c55e' : '#ef4444' }}>
                    {zone.is_active ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
                <button
                  type="button"
                  className={`btn btn--sm ${zone.is_active ? 'btn--outline' : 'btn--accent'}`}
                  onClick={() => handleToggleZone(zone.id, zone.is_active)}
                  disabled={zoneActionLoading}
                  style={{ minHeight: '28px', padding: '2px 10px', fontSize: '11px' }}
                >
                  {zone.is_active ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Detalle de Reserva */}
      {selectedBooking && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }} onClick={() => setSelectedBooking(null)}>
          <div className="modal-content glass" style={{
            background: 'rgba(18, 25, 35, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-6)',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
          }} onClick={(e) => e.stopPropagation()}>
            <button 
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '4px'
              }} 
              onClick={() => setSelectedBooking(null)}
            >
              <X size={20} />
            </button>

            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Detalle de Reserva
              <span style={{ fontSize: '12px', background: 'var(--color-primary-50)', color: 'var(--color-primary-600)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--color-primary-100)' }}>
                #{selectedBooking.id?.slice(0, 8).toUpperCase()}
              </span>
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: 'var(--space-5)' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'block', textTransform: 'uppercase' }}>Travesía</span>
                <strong style={{ fontSize: '15px' }}>{selectedBooking.trip?.title || '—'}</strong>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'block', textTransform: 'uppercase' }}>Estado</span>
                <div>
                  <span className={`status-badge status-badge--${selectedBooking.status}`} style={{ display: 'inline-block', marginTop: '4px' }}>
                    {selectedBooking.status === 'pending' ? 'Pendiente' : selectedBooking.status === 'confirmed' ? 'Confirmada' : selectedBooking.status}
                  </span>
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'block', textTransform: 'uppercase' }}>Fecha y Hora</span>
                <strong>{selectedBooking.trip_date?.date ? new Date(selectedBooking.trip_date.date).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : '—'}</strong>
                {selectedBooking.trip_date?.start_time && <span style={{ color: 'var(--text-secondary)', marginLeft: '6px' }}>({selectedBooking.trip_date.start_time.slice(0, 5)} hs)</span>}
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'block', textTransform: 'uppercase' }}>Total Abonado</span>
                <strong style={{ fontSize: '16px', color: 'var(--color-accent-400)' }}>${selectedBooking.total?.toLocaleString('es-AR')} {selectedBooking.metadata?.currency || 'ARS'}</strong>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.06)', margin: 'var(--space-4) 0' }} />

            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: 'var(--space-3)' }}>Contacto de la Reserva</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: 'var(--space-5)' }}>
              <div>
                <strong>Nombre:</strong> {selectedBooking.guest_name || selectedBooking.metadata?.contact?.name || '—'}
              </div>
              <div>
                <strong>Email:</strong> {selectedBooking.guest_email || selectedBooking.metadata?.contact?.email || '—'}
              </div>
              <div>
                <strong>Teléfono:</strong> {selectedBooking.metadata?.contact?.phone || '—'}
              </div>
              <div>
                <strong>Pasajeros:</strong> {selectedBooking.quantity}
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.06)', margin: 'var(--space-4) 0' }} />

            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: 'var(--space-3)' }}>Lista de Pasajeros</h3>
            {selectedBooking.metadata?.passengers?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedBooking.metadata.passengers.map((pax, idx) => (
                  <div key={idx} style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.04)', borderRadius: '8px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: '13px', display: 'block' }}>{pax.name || '—'}</strong>
                      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Nacionalidad: {pax.nationality || '—'}</span>
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'rgba(255, 255, 255, 0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                      {pax.id_type?.toUpperCase() || 'DNI'}: {pax.id_number || '—'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-tertiary)', fontSize: '13px', fontStyle: 'italic' }}>No se especificaron detalles individuales de pasajeros.</p>
            )}

            {selectedBooking.metadata?.selected_addons?.length > 0 && (
              <>
                <hr style={{ border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.06)', margin: 'var(--space-4) 0' }} />
                <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: 'var(--space-3)' }}>Servicios Adicionales</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                  {selectedBooking.metadata.selected_addons.map((addon, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                      <span>{addon.name} (x{addon.quantity || 1})</span>
                      <span>${((addon.price || addon.unit_price) * (addon.quantity || 1))?.toLocaleString('es-AR')}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      </div>
    </div>
  )
}
