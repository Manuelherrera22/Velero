import { useEffect } from 'react'
import { CalendarCheck, MapPin, User, Phone, Ship, CheckCircle2 } from 'lucide-react'
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
                  {booking.trip?.boat?.name && (
                    <span style={{ marginLeft: '12px' }}>
                      <Ship size={13} style={{ display: 'inline', verticalAlign: '-2px' }} /> {booking.trip.boat.name}
                    </span>
                  )}
                </p>
              </div>
              {booking.status === 'confirmed' ? (
                <span className="status-badge status-badge--success" style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'transparent', color: 'var(--color-success-500)', border: 'none', padding: 0 }}>
                  <CheckCircle2 size={24} />
                </span>
              ) : (
                <span className={`status-badge status-badge--${booking.status}`}>
                  {statusLabels[booking.status] || booking.status}
                </span>
              )}
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
                  {booking.user.phone && (
                    <span>
                      <Phone size={13} style={{ verticalAlign: '-2px' }} />{' '}
                      <a href={`https://wa.me/${booking.user.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary-500)', textDecoration: 'none' }}>
                        {booking.user.phone}
                      </a>
                    </span>
                  )}
                </>
              ) : (
                <>
                  {booking.guest_name && <span><User size={13} style={{ verticalAlign: '-2px' }} /> {booking.guest_name} (invitado)</span>}
                  {booking.guest_phone && (
                    <span>
                      <Phone size={13} style={{ verticalAlign: '-2px' }} />{' '}
                      <a href={`https://wa.me/${booking.guest_phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary-500)', textDecoration: 'none' }}>
                        {booking.guest_phone}
                      </a>
                    </span>
                  )}
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
