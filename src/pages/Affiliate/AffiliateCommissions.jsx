import { useState, useEffect } from 'react'
import { DollarSign, CheckCircle2, Calendar, MapPin } from 'lucide-react'
import supabase from '../../lib/supabase'

export default function AffiliateCommissions() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCommissions()
  }, [])

  const fetchCommissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get user's hotel QRs
      const { data: hotels } = await supabase
        .from('hotels')
        .select('id, qr_codes(code)')
        .eq('owner_id', user.id)

      const qrCodes = hotels?.flatMap(h => h.qr_codes.map(qr => qr.code)) || []

      if (qrCodes.length === 0) {
        setLoading(false)
        return
      }

      // Get bookings from those QRs
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select(`
          id,
          created_at,
          total,
          affiliate_commission,
          status,
          qr_code,
          trip:trips!trip_id(title, location)
        `)
        .in('qr_code', qrCodes)
        .order('created_at', { ascending: false })

      setBookings(bookingsData || [])
    } catch (err) {
      console.error('Error fetching commissions:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (p) => `$${p?.toLocaleString('es-AR')}`
  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })

  if (loading) {
    return <div className="protected-loading"><p>Cargando reporte de comisiones...</p></div>
  }

  return (
    <div>
      <div className="dashboard__header">
        <h1 className="dashboard__title">Comisiones</h1>
      </div>

      {bookings.length === 0 ? (
        <div className="dashboard__empty">
          <div className="dashboard__empty-icon"><DollarSign size={48} /></div>
          <h3>Sin comisiones aún</h3>
          <p>Las reservas realizadas a través de tus códigos QR aparecerán aquí.</p>
        </div>
      ) : (
        <div className="table-responsive glass" style={{ borderRadius: 'var(--radius-lg)' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Travesía</th>
                <th>Estado Reserva</th>
                <th>Total Reserva</th>
                <th>Tu Comisión</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(booking => (
                <tr key={booking.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                      <Calendar size={14} />
                      {formatDate(booking.created_at)}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{booking.trip?.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <MapPin size={10} /> {booking.trip?.location}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge status-badge--${booking.status === 'confirmed' ? 'success' : 'pending'}`}>
                      {booking.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {formatPrice(booking.total)}
                  </td>
                  <td style={{ fontWeight: 600, color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <DollarSign size={14} />
                    {formatPrice(booking.affiliate_commission)}
                    {booking.status === 'confirmed' && <CheckCircle2 size={14} style={{ marginLeft: '4px', opacity: 0.8 }}/>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
