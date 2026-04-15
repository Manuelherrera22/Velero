import { useState, useEffect } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { Compass, CalendarDays, Users, MapPin, Download, Clock, CheckCircle, XCircle, Loader, AlertCircle, Ticket } from 'lucide-react'
import useAuthStore from '../stores/authStore'
import useBookingStore from '../stores/bookingStore'
import { generateTicketPDF } from '../utils/generateTicket'
import './MyTrips.css'

const WhatsAppIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

const WHATSAPP_NUMBER = '5491136696696'

const STATUS_MAP = {
  pending: { label: 'Pendiente', color: 'warning', icon: Clock },
  confirmed: { label: 'Confirmada', color: 'success', icon: CheckCircle },
  completed: { label: 'Completada', color: 'info', icon: CheckCircle },
  cancelled: { label: 'Cancelada', color: 'error', icon: XCircle },
  refunded: { label: 'Reembolsada', color: 'error', icon: AlertCircle },
}

export default function MyTrips() {
  const { user, profile } = useAuthStore()
  const { bookings, fetchMyBookings, loading } = useBookingStore()
  const [activeTab, setActiveTab] = useState('upcoming')

  useEffect(() => {
    if (user) fetchMyBookings()
  }, [user])

  if (!user) return <Navigate to="/login" replace />

  const now = new Date()
  const upcoming = bookings.filter(b => {
    if (b.status === 'cancelled' || b.status === 'refunded') return false
    const tripDate = b.trip_date?.date ? new Date(b.trip_date.date + 'T23:59:59') : null
    return !tripDate || tripDate >= now
  })
  const past = bookings.filter(b => {
    const tripDate = b.trip_date?.date ? new Date(b.trip_date.date + 'T23:59:59') : null
    return (tripDate && tripDate < now) || b.status === 'completed'
  })
  const cancelled = bookings.filter(b => b.status === 'cancelled' || b.status === 'refunded')

  const displayBookings = activeTab === 'upcoming' ? upcoming : activeTab === 'past' ? past : cancelled

  const handleDownloadTicket = (booking) => {
    generateTicketPDF({
      trip: booking.trip?.title || 'Travesía',
      date: booking.trip_date ? { date: booking.trip_date.date, start_time: booking.trip_date.start_time } : null,
      guests: booking.quantity,
      total: booking.total,
      currency: booking.metadata?.currency || 'ARS',
      bookingId: booking.id,
      name: profile?.full_name || booking.guest_name || 'Viajero',
      email: user.email || booking.guest_email || '',
      phone: profile?.phone || booking.guest_phone || '',
    })
  }

  return (
    <div className="my-trips">
      <div className="container">
        <div className="my-trips__header">
          <div>
            <h1><Ticket size={28} /> Mis Viajes</h1>
            <p>Tus experiencias náuticas con Velero</p>
          </div>
          <Link to="/explorar" className="btn btn--accent">
            <Compass size={16} /> Explorar Travesías
          </Link>
        </div>

        {/* Tabs */}
        <div className="my-trips__tabs">
          <button
            className={`my-trips__tab ${activeTab === 'upcoming' ? 'my-trips__tab--active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            Próximos ({upcoming.length})
          </button>
          <button
            className={`my-trips__tab ${activeTab === 'past' ? 'my-trips__tab--active' : ''}`}
            onClick={() => setActiveTab('past')}
          >
            Anteriores ({past.length})
          </button>
          <button
            className={`my-trips__tab ${activeTab === 'cancelled' ? 'my-trips__tab--active' : ''}`}
            onClick={() => setActiveTab('cancelled')}
          >
            Cancelados ({cancelled.length})
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="protected-loading" style={{ minHeight: '300px' }}>
            <Loader size={32} className="spin" />
            <p>Cargando tus viajes...</p>
          </div>
        ) : displayBookings.length === 0 ? (
          <div className="my-trips__empty glass animate-fade-in">
            <Compass size={48} />
            <h3>{activeTab === 'upcoming' ? 'No tenés viajes próximos' : activeTab === 'past' ? 'Aún no completaste ningún viaje' : 'Sin cancelaciones'}</h3>
            <p>Explorá las travesías disponibles y viví la experiencia Velero.</p>
            <Link to="/explorar" className="btn btn--accent btn--lg">
              Explorar Travesías
            </Link>
          </div>
        ) : (
          <div className="my-trips__list animate-fade-in">
            {displayBookings.map(booking => {
              const status = STATUS_MAP[booking.status] || STATUS_MAP.pending
              const StatusIcon = status.icon
              const shortId = booking.id?.slice(0, 8).toUpperCase()
              const tripDate = booking.trip_date?.date
                ? new Date(booking.trip_date.date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
                : null
              const tripTime = booking.trip_date?.start_time?.slice(0, 5)
              const formatPrice = (p) => {
                const cur = booking.metadata?.currency || 'ARS'
                if (cur === 'EUR') return `€${p}`
                if (cur === 'USD') return `US$${p}`
                return `$${Number(p).toLocaleString('es-AR')}`
              }

              return (
                <div key={booking.id} className="boarding-pass glass">
                  {/* Left: Main info */}
                  <div className="boarding-pass__main">
                    <div className="boarding-pass__header">
                      <span className="boarding-pass__brand">⛵ VELERO</span>
                      <span className={`badge badge--${status.color}`}>
                        <StatusIcon size={12} /> {status.label}
                      </span>
                    </div>

                    <h3 className="boarding-pass__title">
                      <Link to={`/travesia/${booking.trip_id}`}>{booking.trip?.title || 'Travesía'}</Link>
                    </h3>

                    <div className="boarding-pass__details">
                      <div className="boarding-pass__detail">
                        <span className="boarding-pass__label">FECHA</span>
                        <span className="boarding-pass__value">{tripDate || 'Por confirmar'}</span>
                      </div>
                      <div className="boarding-pass__detail">
                        <span className="boarding-pass__label">HORA</span>
                        <span className="boarding-pass__value boarding-pass__time">{tripTime ? `${tripTime}hs` : '--:--'}</span>
                      </div>
                      <div className="boarding-pass__detail">
                        <span className="boarding-pass__label">PERSONAS</span>
                        <span className="boarding-pass__value">{booking.quantity}</span>
                      </div>
                      <div className="boarding-pass__detail">
                        <span className="boarding-pass__label">UBICACIÓN</span>
                        <span className="boarding-pass__value">{booking.trip?.location || '—'}</span>
                      </div>
                    </div>

                    <div className="boarding-pass__actions">
                      {(booking.status === 'pending' || booking.status === 'confirmed') && (
                        <button className="btn btn--accent btn--sm" onClick={() => handleDownloadTicket(booking)}>
                          <Download size={14} /> Descargar Boleto
                        </button>
                      )}
                      <a
                        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hola! Mi código de reserva es: *${shortId}*\n\nTravesía: ${booking.trip?.title}\n\n¿Podrían ayudarme?`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn--whatsapp btn--sm"
                      >
                        <WhatsAppIcon /> Consultar
                      </a>
                      {booking.status === 'completed' && (
                        <Link to={`/review/${booking.id}`} className="btn btn--ghost btn--sm">
                          ⭐ Dejar Reseña
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Right: Stub */}
                  <div className="boarding-pass__stub">
                    <span className="boarding-pass__label">CÓDIGO</span>
                    <span className="boarding-pass__code">{shortId}</span>
                    <span className="boarding-pass__total-label">TOTAL</span>
                    <span className="boarding-pass__total">{formatPrice(booking.total)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
