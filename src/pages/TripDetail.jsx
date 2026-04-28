import { useParams, Link, useNavigate } from 'react-router-dom'
import { MapPin, Clock, Users, Star, Anchor, ArrowLeft, CalendarDays, Plus, Minus, Shield, ChevronRight, ChevronLeft, Compass, Loader, MessageCircle, Image } from 'lucide-react'
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
  const [bookingMode, setBookingMode] = useState('shared') // 'shared' | 'private'
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    fetchTrip(id)
  }, [id])

  const isWrongTrip = trip && trip.id !== id;

  if (loading && (!trip || isWrongTrip)) {
    return (
      <div className="protected-loading">
        <Loader size={32} className="spin" />
        <p>Cargando travesía...</p>
      </div>
    )
  }

  // If loading finished but there's no trip (error or not found)
  if (!loading && (!trip || isWrongTrip)) {
    return (
      <div className="protected-loading">
        <Loader size={32} style={{ opacity: 0 }} />
        <p>No se pudo cargar la travesía. Por favor, refresca la página.</p>
        <Link to="/explorar" className="btn btn--accent mt-4">Volver a Explorar</Link>
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
  
  // Dynamic Pricing based on Mode + selected time slot override
  const selectedDateObj = tripDates.find(d => d.id === selectedDate)
  const basePriceOriginal = bookingMode === 'private'
    ? (selectedDateObj?.full_boat_price_override || trip.full_boat_price)
    : (selectedDateObj?.price_per_person_override || trip.price_per_person)
  const discountMultiplier = trip.discount_percentage ? (1 - trip.discount_percentage / 100) : 1
  const basePrice = basePriceOriginal * discountMultiplier

  const subtotal = bookingMode === 'private' ? basePrice : (basePrice || 0) * guests
  const total = subtotal + addonsTotal

  // Group dates by day for UI
  const datesByDay = tripDates.reduce((acc, d) => {
    const dayKey = d.date
    if (!acc[dayKey]) acc[dayKey] = []
    acc[dayKey].push(d)
    return acc
  }, {})

  const formatPrice = (p, cur) => {
    if (cur === 'EUR') return `€${p}`
    if (cur === 'USD') return `US$${p}`
    return `$${p?.toLocaleString('es-AR')}`
  }

  const getImageUrl = () => {
    if (trip.images?.length > 0) return trip.images[currentImageIndex]
    return null
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % trip.images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + trip.images.length) % trip.images.length)
  }

  // selectedDateObj already defined above in pricing section

  const buildWhatsAppUrl = () => {
    const dateText = selectedDateObj
      ? `\nFecha: ${new Date(selectedDateObj.date + 'T12:00:00').toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })} a las ${selectedDateObj.start_time?.slice(0, 5)}hs`
      : ''
    const modeText = bookingMode === 'private' ? ' (Navío exclusivo)' : ' (Lugares compartidos)'
    const msg = `¡Hola! 👋 Me interesa la travesía *${trip.title}* en ${trip.location}${modeText}.${dateText}\nSomos ${guests} persona${guests > 1 ? 's' : ''}.\n\n¿Podrían darme más información?`
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
            {/* Image Carousel */}
            {getImageUrl() ? (
              <div className="relative group mb-6 overflow-hidden" style={{ borderRadius: 'var(--radius-xl)', aspectRatio: '16/9' }}>
                <img src={getImageUrl()} alt={trip.title} className="w-full h-full object-cover transition-opacity duration-300" />
                {trip.images?.length > 1 && (
                  <>
                    <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100">
                      <ChevronLeft size={24} />
                    </button>
                    <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100">
                      <ChevronRight size={24} />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 p-2 rounded-full bg-black/20 backdrop-blur-md">
                      {trip.images.map((_, idx) => (
                        <div key={idx} className={`w-2 h-2 rounded-full transition-all ${idx === currentImageIndex ? 'bg-white scale-125' : 'bg-white/50'}`} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="trip-card__image-placeholder" style={{ borderRadius: 'var(--radius-xl)', marginBottom: 'var(--space-6)', aspectRatio: '16/9' }}>
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
              {trip.boat?.cabins && <span>🛏 {trip.boat.cabins} Camarotes</span>}
              {trip.boat?.bathrooms && <span>🚿 {trip.boat.bathrooms} Baños</span>}
            </div>
            
            <div className="trip-detail__rating-bar">
              <div className="card__rating">
                <Star size={16} fill={trip.reviewCount > 0 ? "currentColor" : "none"} color={trip.reviewCount > 0 ? "currentColor" : "var(--text-tertiary)"} />
                <span style={{ fontWeight: 'bold' }}>
                  {trip.reviewCount > 0 ? trip.avgRating : 'Nuevo'}
                </span>
                <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>
                  ({trip.reviewCount === 1 ? '1 reseña' : `${trip.reviewCount || 0} reseñas`})
                </span>
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
            
            {(trip.cancellation_policy || trip.pension_type) && (
              <div className="trip-detail__section" style={{ background: 'var(--color-bg-secondary)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)' }}>
                <h2>Políticas y Reglas</h2>
                <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)', marginTop: '10px' }}>
                  {trip.pension_type && <li><strong>Pensión:</strong> {trip.pension_type}</li>}
                  {trip.cancellation_policy && <li><strong>Cancelación:</strong> Política {trip.cancellation_policy}</li>}
                  {trip.min_passengers && <li><strong>Pasajeros mínimos:</strong> Requiere {trip.min_passengers} pasajeros para zarpar.</li>}
                </ul>
              </div>
            )}
          </div>

          {/* Right Column — Booking Card */}
          <div className="trip-detail__sidebar">
            <div className="booking-card glass">
              
              {/* Dynamic Price Header */}
              <div className="booking-card__price mb-4 flex flex-col">
                {trip.discount_percentage > 0 && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-muted-foreground line-through text-lg font-normal">
                      {formatPrice(basePriceOriginal, trip.currency)}
                    </span>
                    <span className="badge badge-primary bg-primary/10 text-primary border-none text-xs font-bold px-2 py-1">
                      -{trip.discount_percentage}% dto
                    </span>
                  </div>
                )}
                <div className="flex items-baseline gap-1">
                  {formatPrice(basePrice, trip.currency)}
                  <span className="text-sm font-normal text-muted-foreground">
                    {bookingMode === 'private' ? ' / navío' : ' / persona'}
                  </span>
                </div>
              </div>

              {/* Mode Selector */}
              {trip.allow_full_boat && (
                <div className="flex bg-secondary/20 p-1 rounded-xl mb-6">
                  <button 
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${bookingMode === 'shared' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    onClick={() => setBookingMode('shared')}
                  >
                    Compartido
                  </button>
                  <button 
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${bookingMode === 'private' ? 'bg-primary text-primary-content shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    onClick={() => setBookingMode('private')}
                  >
                    Navío Exclusivo
                  </button>
                </div>
              )}


              {/* Date Selection */}
              <div className="booking-card__section">
                <label className="booking-card__label">
                  <CalendarDays size={16} /> Fecha
                </label>
                {tripDates.length > 0 ? (
                  <div className="booking-card__dates">
                    {Object.entries(datesByDay).map(([dayKey, slots]) => (
                      <div key={dayKey} className="booking-card__day-group">
                        <div className="booking-card__day-label">
                          {new Date(dayKey + 'T12:00:00').toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'short' })}
                        </div>
                        <div className="booking-card__day-slots">
                          {slots
                            .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
                            .map(d => {
                              const slotPrice = bookingMode === 'private'
                                ? (d.full_boat_price_override || trip.full_boat_price)
                                : (d.price_per_person_override || trip.price_per_person)
                              const hasCustomPrice = bookingMode === 'private'
                                ? !!d.full_boat_price_override
                                : !!d.price_per_person_override
                              return (
                                <button
                                  key={d.id}
                                  className={`booking-card__date ${selectedDate === d.id ? 'booking-card__date--selected' : ''}`}
                                  onClick={() => setSelectedDate(d.id)}
                                >
                                  <span className="booking-card__date-time">{d.start_time?.slice(0, 5)}hs</span>
                                  {hasCustomPrice && (
                                    <span className="booking-card__date-price">{formatPrice(slotPrice, trip.currency)}</span>
                                  )}
                                  <span className="booking-card__date-spots">{d.available_spots} disp.</span>
                                </button>
                              )
                            })}
                        </div>
                      </div>
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
                  <button className="booking-card__counter-btn" disabled={bookingMode === 'private'} onClick={() => setGuests(Math.max(1, guests - 1))}>
                    <Minus size={16} />
                  </button>
                  <span className="booking-card__counter-value">{bookingMode === 'private' ? `Hasta ${trip.capacity}` : guests}</span>
                  <button className="booking-card__counter-btn" disabled={bookingMode === 'private'} onClick={() => setGuests(Math.min(trip.capacity, guests + 1))}>
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
                  <span>{formatPrice(basePrice, trip.currency)} × {bookingMode === 'private' ? '1 navío' : guests}</span>
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
                to={`/checkout/${trip.id}?date=${selectedDate}&guests=${guests}&addons=${JSON.stringify(selectedAddons)}&total=${total}&mode=${bookingMode}`}
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
