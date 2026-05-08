import { useState, useEffect } from 'react'
import { QrCode, DollarSign, Target, MousePointerClick, TrendingUp } from 'lucide-react'
import supabase from '../../lib/supabase'

export default function AffiliateHome() {
  const [stats, setStats] = useState({
    scans: 0,
    bookings: 0,
    commissions: 0,
    activeQRs: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMetrics()
  }, [])

  const fetchMetrics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get user's hotel(s)
      const { data: hotels } = await supabase
        .from('hotels')
        .select('id')
        .eq('owner_id', user.id)

      if (!hotels?.length) {
        setLoading(false)
        return
      }

      const hotelIds = hotels.map(h => h.id)

      // Get QRs for those hotels
      const { data: qrs } = await supabase
        .from('qr_codes')
        .select('scan_count, code')
        .in('hotel_id', hotelIds)

      const totalScans = qrs?.reduce((acc, curr) => acc + (curr.scan_count || 0), 0) || 0
      const activeQRs = qrs?.length || 0

      // Get bookings from those QRs
      const qrCodes = qrs?.map(q => q.code) || []
      let totalBookings = 0
      let totalCommissions = 0

      if (qrCodes.length > 0) {
        const { data: bookings } = await supabase
          .from('bookings')
          .select('affiliate_commission')
          .in('qr_code', qrCodes)
          .eq('status', 'confirmed')

        totalBookings = bookings?.length || 0
        totalCommissions = bookings?.reduce((acc, curr) => acc + (curr.affiliate_commission || 0), 0) || 0
      }

      setStats({
        scans: totalScans,
        bookings: totalBookings,
        commissions: totalCommissions,
        activeQRs,
      })
    } catch (err) {
      console.error('Error fetching affiliate metrics:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="protected-loading"><p>Cargando métricas...</p></div>
  }

  return (
    <div>
      <div className="dashboard__header">
        <h1 className="dashboard__title">Resumen de Aliado Kailu</h1>
      </div>

      <div className="metrics-grid">
        <div className="metric-card glass">
          <div className="metric-card__icon" style={{ background: 'rgba(0, 180, 180, 0.1)', color: 'var(--color-accent-400)' }}>
            <MousePointerClick size={24} />
          </div>
          <div className="metric-card__content">
            <h3 className="metric-card__title">Escaneos Totales</h3>
            <p className="metric-card__value">{stats.scans}</p>
          </div>
        </div>

        <div className="metric-card glass">
          <div className="metric-card__icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            <Target size={24} />
          </div>
          <div className="metric-card__content">
            <h3 className="metric-card__title">Reservas Generadas</h3>
            <p className="metric-card__value">{stats.bookings}</p>
          </div>
        </div>

        <div className="metric-card glass">
          <div className="metric-card__icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <DollarSign size={24} />
          </div>
          <div className="metric-card__content">
            <h3 className="metric-card__title">Comisiones Estimadas</h3>
            <p className="metric-card__value">${stats.commissions.toLocaleString('es-AR')}</p>
          </div>
        </div>

        <div className="metric-card glass">
          <div className="metric-card__icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
            <QrCode size={24} />
          </div>
          <div className="metric-card__content">
            <h3 className="metric-card__title">QRs Activos</h3>
            <p className="metric-card__value">{stats.activeQRs}</p>
          </div>
        </div>
      </div>

      <div className="item-card glass" style={{ marginTop: 'var(--space-8)' }}>
        <h3 className="item-card__title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={18} /> ¿Cómo funciona?
        </h3>
        <p className="item-card__subtitle" style={{ marginTop: '12px', lineHeight: '1.6' }}>
          Generá códigos QR desde la pestaña <strong>Mis Códigos QR</strong> y colocalos en la recepción o habitaciones. 
          Cuando los huéspedes escanean el código, ven una lista curada de travesías. Si reservan a través de tu link, ganás la comisión acordada automáticamente.
        </p>
      </div>
    </div>
  )
}
