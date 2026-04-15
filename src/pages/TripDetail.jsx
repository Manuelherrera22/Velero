import { useParams, Link, useNavigate } from 'react-router-dom'
import { MapPin, Clock, Users, Star, Anchor, ArrowLeft, CalendarDays, Plus, Minus, Shield, ChevronRight, Compass, Loader, MessageCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import useTripStore from '../stores/tripStore'
import './TripDetail.css'

/* WhatsApp inline icon */
const WhatsAppIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

const WHATSAPP_NUMBER = '5491136696696'

export default function TripDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentTrip: trip, tripDates, tripAddons, loading, fetchTrip, clearCurrentTrip } = useTripStore()

  const [guests, setGuests] = useState(2)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedAddons, setSelectedAddons] = useState({})

  useEffect(() => {
    fetchTrip(id)
    return () => clearCurrentTrip()
  }, [id])

  if (loading || !trip) {
    return (
      <div className="protected-loading">
        <Loader size={32} className="spin" />
        <p>Cargando travesía...</p>
      </div>
    )
  }

  const toggleAddon = (addonId) => {
    setSelectedAddons(prev => ({
      ...prev,
      [addonId]: prev[addonId] ? 0 : 1
    }))
  }

  const addonsTotal = tripAddons.reduce((sum, a) => sum + (selectedAddons[a.id] || 0) * a.price, 0)
  const subtotal = (trip.price_per_person || 0) * guests
  const total = subtotal + addonsTotal

  const formatPrice = (p, cur) => {
    if (cur === 'EUR') return `€${p}`
    if (cur === 'USD') return `US$${p}`
    return `$${p?.toLocaleString('es-AR')}`
  }

  const getImageUrl = () => {
    if (trip.images?.length > 0) return trip.images[0]
    return null
  }

  const selectedDateObj = tripDates.find(d => d.id === selectedDate)

  const buildWhatsAppUrl = () => {
    const dateText = selectedDateObj
      ? `\nFecha: ${new Date(selectedDateObj.date + 'T12:00:00').toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })} a las ${selectedDateObj.start_time?.slice(0, 5)}hs`
      : ''
    const msg = `¡Hola! 👋 Me interesa la travesía *${trip.title}* en ${trip.location}.${dateText}\nSomos ${guests} persona${guests > 1 ? 's' : ''}.\n\n¿Podrían darme más información?`
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`
  }

  return (
    <div className="trip-detail">
      <div className="container">
        <Link to="/explorar" className="trip-detail__back">
          <ArrowLeft size={18} /> Volver a búsqueda
        </Link>

        <div className="trip-detail__layout">
          {/* Left Column — Info */}
          <div className="trip-detail__info">
            {/* Image */}
            {getImageUrl() ? (
              <img src={getImageUrl()} alt={trip.title} style={{ width: '100%', borderRadius: 'var(--radius-xl)', marginBottom: 'var(--space-6)', aspectRatio: '16/9', objectFit: 'cover' }} />
            ) : (
              <div className="trip-card__image-placeholder" style={{ borderRadius: 'var(--radius-xl)', marginBottom: 'var(--space-6)', height: '300px' }}>
                <Compass size={60} />
                <span>{trip.location}</span>
              </div>
            )}

            <div className="trip-detail__tags">
              {trip.tags?.map(t => <span key={t} className="card__tag">{t}</span>)}
            </div>

            <h1 className="trip-detail__title">{trip.title}</h1>

            <div className="trip-detail__meta">
              <span><MapPin size={16} /> {trip.location}</span>
              <span><Users size={16} /> Hasta {trip.capacity} personas</span>
            </div>

            <div className="trip-detail__rating-bar">
              <div className="card__rating">
                <Star size={16} fill="currentColor" /> {trip.avgRating || '—'}
                <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>({trip.reviewCount} reseñas)</span>
              </div>
            </div>

            <div className="divider" />

            <div className="trip-detail__section">
              <h2>Descripción</h2>
              <p className="trip-detail__desc">{trip.description || 'Sin descripción disponible.'}</p>
            </div>

            {trip.captain && (
              <div className="trip-detail__section">
                <h2>Capitán</h2>
                <div className="trip-detail__captain glass">
                  <div className="trip-detail__captain-avatar">
                    {(trip.captain.full_name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <strong>{trip.captain.full_name || 'Capitán Verificado'}</strong>
                    {trip.captain.location && <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{trip.captain.location}</p>}
                  </div>
                  {trip.captain.is_verified && (
                    <Shield size={20} className="trip-detail__verified" />
                  )}
                </div>
              </div>
            )}

            {trip.boat && (
              <div className="trip-detail__section">
                <h2>Embarcación</h2>
                <div className="trip-detail__boat glass">
                  <p><strong>{trip.boat.name}</strong></p>
                  <p>{trip.boat.type} · {trip.boat.length_m ? `${trip.boat.length_m}m` : ''}</p>
                  {trip.boat.amenities && <p style={{ marginTop: '4px', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>{trip.boat.amenities}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Right Column — Booking Card */}
          <div className="trip-detail__sidebar">
            <div className="booking-card glass">
              <div className="booking-card__price">
                {formatPrice(trip.price_per_person, trip.currency)}
                <span>/persona</span>
              </div>

              {/* Date Selection */}
              <div className="booking-card__section">
                <label className="booking-card__label">
                  <CalendarDays size={16} /> Fecha
                </label>
                {tripDates.length > 0 ? (
                  <div className="booking-card__dates">
                    {tripDates.map(d => (
                      <button
                        key={d.id}
                        className={`booking-card__date ${selectedDate === d.id ? 'booking-card__date--selected' : ''}`}
                        onClick={() => setSelectedDate(d.id)}
                      >
                        <span className="booking-card__date-day">
                          {new Date(d.date + 'T12:00:00').toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </span>
                        <span className="booking-card__date-time">{d.start_time?.slice(0, 5)}hs</span>
                        <span className="booking-card__date-spots">{d.available_spots} lugares</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>No hay fechas disponibles actualmente.</p>
                )}
              </div>

              {/* Guests */}
              <div className="booking-card__section">
                <label className="booking-card__label">
                  <Users size={16} /> Personas
                </label>
                <div className="booking-card__counter">
                  <button className="booking-card__counter-btn" onClick={() => setGuests(Math.max(1, guests - 1))}>
                    <Minus size={16} />
                  </button>
                  <span className="booking-card__counter-value">{guests}</span>
                  <button className="booking-card__counter-btn" onClick={() => setGuests(Math.min(trip.capacity, guests + 1))}>
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Addons */}
              {tripAddons.length > 0 && (
                <div className="booking-card__section">
                  <label className="booking-card__label">Extras</label>
                  {tripAddons.map(addon => (
                    <button
                      key={addon.id}
                      className={`booking-card__addon ${selectedAddons[addon.id] ? 'booking-card__addon--selected' : ''}`}
                      onClick={() => toggleAddon(addon.id)}
                    >
                      <div>
                        <strong>{addon.name}</strong>
                        {addon.description && <span>{addon.description}</span>}
                      </div>
                      <span className="booking-card__addon-price">+{formatPrice(addon.price, trip.currency)}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Summary */}
              <div className="booking-card__summary">
                <div className="booking-card__line">
                  <span>{formatPrice(trip.price_per_person, trip.currency)} × {guests}</span>
                  <span>{formatPrice(subtotal, trip.currency)}</span>
                </div>
                {addonsTotal > 0 && (
                  <div className="booking-card__line">
                    <span>Extras</span>
                    <span>{formatPrice(addonsTotal, trip.currency)}</span>
                  </div>
                )}
                <div className="booking-card__total">
                  <span>Total</span>
                  <span>{formatPrice(total, trip.currency)}</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <Link
                to={`/checkout/${trip.id}?date=${selectedDate}&guests=${guests}&addons=${JSON.stringify(selectedAddons)}&total=${total}`}
                className={`btn btn--accent btn--lg booking-card__cta ${!selectedDate ? 'booking-card__cta--disabled' : ''}`}
              >
                Reservar ahora
                <ChevronRight size={18} />
              </Link>

              {/* WhatsApp Button */}
              <a
                href={buildWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--whatsapp btn--lg booking-card__cta"
              >
                <WhatsAppIcon /> Consultar por WhatsApp
              </a>

              <p className="booking-card__note">
                Sin registro obligatorio · Pago seguro con Mercado Pago
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
