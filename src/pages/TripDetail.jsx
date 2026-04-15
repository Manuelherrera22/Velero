import { useParams, Link, useNavigate } from 'react-router-dom'
import { MapPin, Clock, Users, Star, Anchor, ArrowLeft, CalendarDays, Plus, Minus, Shield, ChevronRight, Compass, Loader } from 'lucide-react'
import { useState, useEffect } from 'react'
import useTripStore from '../stores/tripStore'
import './TripDetail.css'

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

              <Link
                to={`/checkout/${trip.id}?date=${selectedDate}&guests=${guests}&addons=${JSON.stringify(selectedAddons)}&total=${total}`}
                className={`btn btn--accent btn--lg booking-card__cta ${!selectedDate ? 'booking-card__cta--disabled' : ''}`}
              >
                Reservar ahora
                <ChevronRight size={18} />
              </Link>

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
