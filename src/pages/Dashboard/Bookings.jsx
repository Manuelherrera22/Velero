import { useEffect } from 'react'
import { CalendarCheck, MapPin, User, Mail, Phone } from 'lucide-react'
import useBookingStore from '../../stores/bookingStore'

export default function Bookings() {
  const { bookings, loading, fetchCaptainBookings } = useBookingStore()

  useEffect(() => { fetchCaptainBookings() }, [])

  const statusLabels = {
    pending: 'Pendiente',
    confirmed: 'Confirmada',
    cancelled: 'Cancelada',
    completed: 'Completada',
    refunded: 'Reembolsada',
  }

  return (
    <div>
      <div className="dashboard__header">
        <h1 className="dashboard__title">Reservas</h1>
      </div>

      {loading && <div className="protected-loading"><p>Cargando...</p></div>}

      {!loading && bookings.length === 0 && (
        <div className="dashboard__empty">
          <div className="dashboard__empty-icon"><CalendarCheck size={48} /></div>
          <h3>Sin reservas aún</h3>
          <p>Cuando los viajeros reserven tus travesías, las verás aquí.</p>
        </div>
      )}

      <div className="dashboard__grid">
        {bookings.map(booking => (
          <div key={booking.id} className="item-card glass">
            <div className="item-card__header">
              <div>
                <h3 className="item-card__title">{booking.trip?.title || 'Travesía'}</h3>
                <p className="item-card__subtitle">
                  <MapPin size={13} style={{ display: 'inline', verticalAlign: '-2px' }} /> {booking.trip?.location}
                </p>
              </div>
              <span className={`status-badge status-badge--${booking.status}`}>
                {statusLabels[booking.status] || booking.status}
              </span>
            </div>

            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {booking.trip_date && (
                <span>
                  <CalendarCheck size={13} style={{ verticalAlign: '-2px' }} />{' '}
                  {new Date(booking.trip_date.date + 'T12:00:00').toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })} · {booking.trip_date.start_time}hs
                </span>
              )}

              {/* Guest or user info */}
              {booking.user ? (
                <>
                  <span><User size={13} style={{ verticalAlign: '-2px' }} /> {booking.user.full_name || 'Sin nombre'}</span>
                  {booking.user.email && <span><Mail size={13} style={{ verticalAlign: '-2px' }} /> {booking.user.email}</span>}
                </>
              ) : (
                <>
                  {booking.guest_name && <span><User size={13} style={{ verticalAlign: '-2px' }} /> {booking.guest_name} (invitado)</span>}
                  {booking.guest_email && <span><Mail size={13} style={{ verticalAlign: '-2px' }} /> {booking.guest_email}</span>}
                  {booking.guest_phone && <span><Phone size={13} style={{ verticalAlign: '-2px' }} /> {booking.guest_phone}</span>}
                </>
              )}
            </div>

            <div className="item-card__footer">
              <span>{booking.quantity} persona{booking.quantity > 1 ? 's' : ''}</span>
              <span style={{ color: 'var(--color-accent-400)', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                ${booking.total?.toLocaleString('es-AR')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
