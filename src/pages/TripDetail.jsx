import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom'
import { MapPin, Clock, Users, Star, Anchor, ArrowLeft, CalendarDays, Plus, Minus, Shield, ChevronRight, ChevronLeft, Compass, Loader, MessageCircle, Image } from 'lucide-react'
import { useState, useEffect } from 'react'
import useTripStore from '../stores/tripStore'
import useAuthStore from '../stores/authStore'
import './TripDetail.css'

/* WhatsApp inline icon */
const WhatsAppIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

const WHATSAPP_NUMBER = '5491161789818'

export default function TripDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { currentTrip: trip, tripDates, tripAddons, isLoadingTrip: loading, fetchTrip, clearCurrentTrip } = useTripStore()
  
  const { user, profile } = useAuthStore()

  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false)
  const [inquiryForm, setInquiryForm] = useState({ name: '', email: '', message: '' })
  const [inquiryLoading, setInquiryLoading] = useState(false)
  const [inquirySuccess, setInquirySuccess] = useState(false)
  const [inquiryError, setInquiryError] = useState('')

  useEffect(() => {
    if (isInquiryModalOpen) {
      setInquiryForm({
        name: profile?.full_name || '',
        email: user?.email || '',
        message: ''
      })
      setInquirySuccess(false)
      setInquiryError('')
    }
  }, [isInquiryModalOpen, profile, user])

  const handleSendInquiry = async (e) => {
    e.preventDefault()
    setInquiryError('')
    setInquiryLoading(true)

    if (!inquiryForm.name.trim() || !inquiryForm.email.trim() || !inquiryForm.message.trim()) {
      setInquiryError('Todos los campos son obligatorios.')
      setInquiryLoading(false)
      return
    }

    try {
      const dateText = selectedDateObj
        ? `${new Date(selectedDateObj.date + 'T12:00:00').toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })} a las ${selectedDateObj.start_time?.slice(0, 5)}hs`
        : ''

      const protocol = window.location.protocol
      const host = window.location.host
      
      const response = await fetch(`${protocol}//${host}/api/send-inquiry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tripId: trip.id,
          tripTitle: trip.title,
          captainId: trip.captain?.id || trip.captain_id,
          name: inquiryForm.name.trim(),
          email: inquiryForm.email.trim(),
          message: inquiryForm.message.trim(),
          dateText,
          guests
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'No se pudo enviar la consulta. Intente más tarde.')
      }

      setInquirySuccess(true)
    } catch (err) {
      setInquiryError(err.message)
    } finally {
      setInquiryLoading(false)
    }
  }
  
  const qrCode = searchParams.get('qr')

  const [guests, setGuests] = useState(2)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedAddons, setSelectedAddons] = useState({})
  const [bookingMode, setBookingMode] = useState('shared') // 'shared' | 'private'
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const basePrivateAllowed = trip?.metadata?.allow_full_boat || trip?.allow_full_boat;
  const privatePrice = trip?.metadata?.full_boat_price || trip?.full_boat_price;

  const selectedDateObj = tripDates?.find(d => d.id === selectedDate);
  const capacity = trip?.max_capacity || trip?.capacity || 6;
  const hasBookings = selectedDateObj && selectedDateObj.available_spots < capacity;
  const hasBlockedSpots = selectedDateObj && selectedDateObj.blocked_spots > 0;
  const isPrivateAllowed = basePrivateAllowed && !hasBookings && !hasBlockedSpots;

  useEffect(() => {
    if (trip) {
      const hasShared = trip.price_per_person > 0;
      const hasPrivate = isPrivateAllowed && privatePrice > 0;
      
      // If shared isn't an option, force private
      if (!hasShared && hasPrivate) {
        setBookingMode('private');
      }
      
      // If they selected private but it became unavailable (e.g. they clicked a date with bookings), revert to shared
      if (bookingMode === 'private' && !hasPrivate && hasShared) {
        setBookingMode('shared');
      }
    }
  }, [trip, isPrivateAllowed, privatePrice, bookingMode]);

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

  const updateAddonQuantity = (e, addonId, change) => {
    e.stopPropagation()
    setSelectedAddons(prev => {
      const current = prev[addonId] || 0
      const next = Math.max(0, current + change)
      return { ...prev, [addonId]: next }
    })
  }

  const addonsTotal = tripAddons.reduce((sum, a) => sum + (selectedAddons[a.id] || 0) * a.price, 0)
  
  // Dynamic Pricing based on Mode + selected time slot override
  const basePriceOriginal = bookingMode === 'private'
    ? (selectedDateObj?.full_boat_price_override || trip.full_boat_price || trip.metadata?.full_boat_price)
    : (selectedDateObj?.price_per_person_override || trip.price_per_person || trip.metadata?.price_per_person)
  const discountPercent = trip?.metadata?.discount_percentage || trip?.discount_percentage || 0
  const discountMultiplier = discountPercent > 0 ? (1 - discountPercent / 100) : 1
  const basePrice = basePriceOriginal * discountMultiplier

  const subtotal = bookingMode === 'private' ? basePrice : (basePrice || 0) * guests
  const total = subtotal + addonsTotal

  // Group dates by day for UI
  const datesByDay = tripDates.reduce((acc, d) => {
    // En velero en privado no sale la fecha si está reservado o bloqueado
    const remainingSpots = d.available_spots - (d.blocked_spots || 0);
    const dateHasBookings = d.available_spots < capacity;
    if (bookingMode === 'private' && (dateHasBookings || d.blocked_spots > 0)) {
      return acc;
    }

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
    const modeText = isPrivateAllowed ? (bookingMode === 'private' ? ' (Navío exclusivo)' : ' (Lugares compartidos)') : ''
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
              <div className="trip-detail__carousel">
                <img src={getImageUrl()} alt={trip.title} className="trip-detail__carousel-img" />
                {trip.images?.length > 1 && (
                  <>
                    <button onClick={prevImage} className="trip-detail__carousel-btn trip-detail__carousel-btn--left">
                      <ChevronLeft size={22} />
                    </button>
                    <button onClick={nextImage} className="trip-detail__carousel-btn trip-detail__carousel-btn--right">
                      <ChevronRight size={22} />
                    </button>
                    <div className="trip-detail__carousel-dots">
                      {trip.images.map((_, idx) => (
                        <button
                          key={idx}
                          className={`trip-detail__carousel-dot ${idx === currentImageIndex ? 'trip-detail__carousel-dot--active' : ''}`}
                          onClick={() => setCurrentImageIndex(idx)}
                        />
                      ))}
                    </div>
                    <div className="trip-detail__carousel-counter">
                      {currentImageIndex + 1} / {trip.images.length}
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
              <span><Users size={16} /> Mínimo {trip.min_passengers || 1} {trip.min_passengers === 1 ? 'persona' : 'personas'}</span>
              <span><Users size={16} /> Hasta {capacity} personas</span>
              {trip.boat?.cabins > 0 && <span>🛏 {trip.boat.cabins} Camarotes</span>}
              {trip.boat?.bathrooms > 0 && <span>🚿 {trip.boat.bathrooms} Baños</span>}
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
            
            {(trip.cancellation_policy || trip.pension_type || trip.min_passengers) && (
              <div className="trip-detail__section" style={{ background: 'var(--color-bg-secondary)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)' }}>
                <h2>Información adicional</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                  {trip.pension_type && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)' }}>
                      <span style={{ fontSize: '18px' }}>🍽️</span>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>Régimen de comidas</p>
                        <p style={{ fontSize: '13px' }}>{trip.pension_type}</p>
                      </div>
                    </div>
                  )}
                  {trip.min_passengers && trip.min_passengers > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)' }}>
                      <span style={{ fontSize: '18px' }}>👥</span>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>Mínimo de pasajeros</p>
                        <p style={{ fontSize: '13px' }}>Se necesitan al menos {trip.min_passengers} pasajeros para confirmar la salida.</p>
                      </div>
                    </div>
                  )}
                  {trip.cancellation_policy && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)' }}>
                      <span style={{ fontSize: '18px' }}>📋</span>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>Cancelación</p>
                        <p style={{ fontSize: '13px' }}>{trip.cancellation_policy}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column — Booking Card */}
          <div className="trip-detail__sidebar">
            <div className="booking-card glass">
              
              {/* Mode Selector */}
              <div className="booking-card__section mb-6">
                <label className="booking-card__label" style={{ marginBottom: '12px' }}>
                  Tipo de experiencia
                </label>
                {(() => {
                  let privateDisabledTitle = '';
                  if (tripDates.length === 0) {
                    privateDisabledTitle = 'No hay fechas disponibles';
                  } else if (!basePrivateAllowed || !(privatePrice > 0)) {
                    privateDisabledTitle = 'El capitán no habilitó la opción de velero privado para esta travesía';
                  } else if (hasBookings) {
                    privateDisabledTitle = 'Esta fecha ya cuenta con reservas compartidas y no se puede reservar como velero privado';
                  } else if (hasBlockedSpots) {
                    privateDisabledTitle = 'Esta fecha tiene lugares bloqueados y no se puede reservar como velero privado';
                  }

                  return (
                    <div className="booking-card__mode-selector" style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <button 
                        className={`mode-btn ${bookingMode === 'shared' ? 'mode-btn--active' : ''}`}
                        style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px 8px', borderRadius: 'var(--radius-lg)', transition: 'all 0.2s', background: bookingMode === 'shared' ? 'var(--color-primary-500)' : 'var(--color-neutral-100)', color: bookingMode === 'shared' ? 'white' : 'var(--text-secondary)', border: bookingMode === 'shared' ? '1px solid var(--color-primary-600)' : '1px solid var(--color-neutral-200)', cursor: (tripDates.length > 0 && trip.price_per_person > 0) ? 'pointer' : 'not-allowed', opacity: (tripDates.length > 0 && trip.price_per_person > 0) ? 1 : 0.5 }}
                        onClick={() => { if (tripDates.length > 0 && trip.price_per_person > 0) setBookingMode('shared') }}
                        title={tripDates.length === 0 ? 'No hay fechas disponibles' : (trip.price_per_person <= 0 ? 'Esta travesía solo se ofrece como velero privado' : '')}
                      >
                        <span style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '4px' }}>Compartido</span>
                        <span style={{ fontSize: '11px', fontWeight: 'normal', opacity: bookingMode === 'shared' ? 0.9 : 0.6, textAlign: 'center', lineHeight: '1.2' }}>Viajás con otras personas</span>
                      </button>
                      <button 
                        className={`mode-btn ${bookingMode === 'private' ? 'mode-btn--active' : ''}`}
                        style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px 8px', borderRadius: 'var(--radius-lg)', transition: 'all 0.2s', background: bookingMode === 'private' ? 'var(--color-primary-500)' : 'var(--color-neutral-100)', color: bookingMode === 'private' ? 'white' : 'var(--text-secondary)', border: bookingMode === 'private' ? '1px solid var(--color-primary-600)' : '1px solid var(--color-neutral-200)', cursor: (tripDates.length > 0 && isPrivateAllowed && privatePrice > 0) ? 'pointer' : 'not-allowed', opacity: (tripDates.length > 0 && isPrivateAllowed && privatePrice > 0) ? 1 : 0.5 }}
                        onClick={() => { if (tripDates.length > 0 && isPrivateAllowed && privatePrice > 0) setBookingMode('private') }}
                        disabled={tripDates.length === 0 || !isPrivateAllowed || !(privatePrice > 0)}
                        title={privateDisabledTitle || 'Reservá el velero completo'}
                      >
                        <span style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '4px' }}>Velero privado</span>
                        <span style={{ fontSize: '11px', fontWeight: 'normal', opacity: bookingMode === 'private' ? 0.9 : 0.6, textAlign: 'center', lineHeight: '1.2' }}>Reservás el velero completo</span>
                      </button>
                    </div>
                  );
                })()}
              </div>

              {/* Dynamic Price Header */}
              <div className="booking-card__price mb-6 flex flex-col border-b border-border/40 pb-6">
                {(trip.metadata?.discount_percentage > 0 || trip.discount_percentage > 0) && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-muted-foreground line-through text-lg font-normal">
                      {formatPrice(basePriceOriginal, trip.currency)}
                    </span>
                    <span className="badge badge-primary bg-primary/10 text-primary border-none text-xs font-bold px-2 py-1">
                      -{trip.metadata?.discount_percentage || trip.discount_percentage}% dto
                    </span>
                  </div>
                )}
                <div className="flex items-baseline gap-1">
                  <span className="text-base font-medium text-muted-foreground mr-1">Desde</span>
                  {formatPrice(basePrice, trip.currency)}
                  <span className="text-sm font-normal text-muted-foreground">
                    {bookingMode === 'private' ? ' / navío' : ' / persona'}
                  </span>
                </div>
              </div>


              {/* Date Selection */}
              <div className="booking-card__section">
                <label className="booking-card__label" style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                  📅 Elegí día y horario
                </label>
                {tripDates.length > 0 ? (
                  <div className="booking-card__dates custom-scrollbar" style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '8px', WebkitOverflowScrolling: 'touch' }}>
                    {Object.entries(datesByDay).map(([dayKey, slots]) => (
                      <div key={dayKey} className="booking-card__day-group">
                        <div className="booking-card__day-label">
                          {new Date(dayKey + 'T12:00:00').toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'short' })}
                        </div>
                        <div className="booking-card__day-slots">
                          {slots
                            .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
                            .map(d => {
                              const remainingSpots = d.available_spots - (d.blocked_spots || 0);
                              const dateHasBookings = d.available_spots < capacity;
                              const isDateDisabled = bookingMode === 'private' ? (dateHasBookings || d.blocked_spots > 0) : remainingSpots <= 0;
                              const slotPrice = bookingMode === 'private'
                                ? (d.full_boat_price_override || trip.full_boat_price || trip.metadata?.full_boat_price)
                                : (d.price_per_person_override || trip.price_per_person || trip.metadata?.price_per_person);
                              
                              return (
                                <button
                                  key={d.id}
                                  disabled={isDateDisabled}
                                  className={`booking-card__date flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl border transition-all ${selectedDate === d.id ? 'booking-card__date--selected border-primary bg-primary/10' : 'border-border/60 hover:border-primary/50'} ${isDateDisabled ? 'opacity-50 cursor-not-allowed bg-neutral-100' : ''}`}
                                  onClick={() => setSelectedDate(d.id)}
                                >
                                  <span className="booking-card__date-time font-bold text-[15px]">{d.start_time?.slice(0, 5)} hs</span>
                                  <span className="booking-card__date-price text-sm text-muted-foreground">{formatPrice(slotPrice, trip.currency)}</span>
                                  <span className={`booking-card__date-spots flex items-center gap-1.5 text-xs mt-1 text-center`} style={{ color: remainingSpots <= 0 ? '#ef4444' : 'var(--color-success)' }}>
                                    {remainingSpots <= 0 ? (
                                      'Agotado'
                                    ) : ( bookingMode === 'private' && (dateHasBookings || d.blocked_spots > 0) ) ? (
                                      <span style={{ color: '#ef4444' }}>Ocupado</span>
                                    ) : (
                                      <>
                                        <div className={`w-2 h-2 rounded-full animate-pulse`} style={{ backgroundColor: 'var(--color-success)' }}></div>
                                        {`${remainingSpots} disp.`}
                                      </>
                                    )}
                                  </span>
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
              <div className="booking-card__section border-t border-border/40 pt-6 mt-6">
                <label className="booking-card__label" style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                  👥 Personas
                </label>
                <div className="booking-card__counter">
                  <button className="booking-card__counter-btn" disabled={bookingMode === 'private'} onClick={() => setGuests(Math.max(1, guests - 1))}>
                    <Minus size={16} />
                  </button>
                  <span className="booking-card__counter-value">{bookingMode === 'private' ? `Hasta ${capacity}` : guests}</span>
                  <button className="booking-card__counter-btn" disabled={bookingMode === 'private'} onClick={() => setGuests(Math.min(capacity, guests + 1))}>
                    <Plus size={16} />
                  </button>
                </div>
                {bookingMode === 'shared' && (!trip.min_passengers || trip.min_passengers <= 1) && (
                  <p className="text-sm text-muted-foreground text-center" style={{ lineHeight: '1.4', marginTop: '24px' }}>
                    ¿Venís solo? Podés reservar 1 lugar sin problema.
                  </p>
                )}
              </div>

              {/* Addons */}
              {tripAddons.length > 0 && (
                <div className="booking-card__section border-t border-border/40 pt-6 mt-6">
                  <label className="booking-card__label mb-3" style={{ fontSize: '1.05rem', fontWeight: 700 }}>Mejorá tu experiencia (opcional)</label>
                  {tripAddons.map(addon => (
                    <div
                      key={addon.id}
                      className={`booking-card__addon ${selectedAddons[addon.id] ? 'booking-card__addon--selected' : ''}`}
                      onClick={() => !selectedAddons[addon.id] && toggleAddon(addon.id)}
                      style={{ cursor: selectedAddons[addon.id] ? 'default' : 'pointer' }}
                    >
                      <div style={{ flex: 1 }}>
                        <strong>{addon.name}</strong>
                        {addon.description && <span>{addon.description}</span>}
                      </div>
                      {selectedAddons[addon.id] ? (
                        <div className="booking-card__counter" style={{ padding: '4px' }}>
                          <button 
                            className="booking-card__counter-btn" 
                            style={{ width: '28px', height: '28px' }}
                            onClick={(e) => updateAddonQuantity(e, addon.id, -1)}
                          >
                            <Minus size={14} />
                          </button>
                          <span className="booking-card__counter-value" style={{ width: '20px', fontSize: '14px' }}>
                            {selectedAddons[addon.id]}
                          </span>
                          <button 
                            className="booking-card__counter-btn" 
                            style={{ width: '28px', height: '28px' }}
                            onClick={(e) => updateAddonQuantity(e, addon.id, 1)}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      ) : (
                        <span className="booking-card__addon-price">+{formatPrice(addon.price, trip.currency)}</span>
                      )}
                    </div>
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
                <div className="booking-card__line" style={{ fontWeight: '500', color: 'var(--text-secondary)' }}>
                  <span>Total de la experiencia</span>
                  <span>{formatPrice(total, trip.currency)}</span>
                </div>
                {trip?.requires_full_payment === false && (
                  <div style={{ marginTop: '12px' }}>
                    <div className="booking-card__total" style={{ color: 'var(--color-primary)', borderTop: '2px dashed var(--border-color)' }}>
                      <span>Tu reserva</span>
                      <span>{formatPrice(total * (trip?.kailu_commission || trip?.captain?.kailu_commission || 0.20), trip.currency)}</span>
                    </div>
                    <div className="booking-card__line" style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: '500', marginTop: '8px' }}>
                      <span>Saldo a abonar al capitán</span>
                      <span>{formatPrice(total - (total * (trip?.kailu_commission || trip?.captain?.kailu_commission || 0.20)), trip.currency)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* CTA Buttons */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  if (!selectedDate) {
                    alert("Por favor, seleccioná una fecha y horario antes de continuar.");
                    return;
                  }
                  if (bookingMode === 'private' && hasBookings) {
                    alert("Esta fecha ya tiene lugares compartidos ocupados y no se puede reservar en modo privado. Por favor, selecciona el modo Compartido o elegí otra fecha.");
                    setBookingMode('shared');
                    return;
                  }
                  navigate(`/checkout/${trip.id}?date=${selectedDate}&guests=${guests}&addons=${JSON.stringify(selectedAddons)}&total=${total}&mode=${bookingMode}${qrCode ? `&qr=${qrCode}` : ''}`);
                }}
                className={`btn btn--accent btn--lg booking-card__cta ${!selectedDate ? 'booking-card__cta--disabled' : ''}`}
                style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
              >
                Reservar ahora
                <ChevronRight size={18} />
              </button>

              {/* WhatsApp Button */}
              <a
                href={buildWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--whatsapp btn--lg booking-card__cta"
              >
                <WhatsAppIcon /> Enviar consulta
              </a>

              {/* Email Inquiry Button - Commented out to prevent bypassing Kailu
              <button
                type="button"
                onClick={() => setIsInquiryModalOpen(true)}
                className="btn btn--secondary btn--lg booking-card__cta"
                style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '8px' }}
              >
                <MessageCircle size={18} style={{ marginRight: '8px' }} /> Enviar consulta por Email
              </button>
              */}

              <p className="booking-card__note">
                Sin registro obligatorio · Pago seguro con Mercado Pago
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Inquiry Modal */}
      {isInquiryModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(10, 22, 40, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div className="glass" style={{
            maxWidth: '500px',
            width: '100%',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '28px',
            position: 'relative',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
          }}>
            <button
              onClick={() => setIsInquiryModalOpen(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '20px',
                padding: '4px'
              }}
            >
              ✕
            </button>

            {inquirySuccess ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(38, 198, 198, 0.1)',
                  border: '2px solid rgba(38, 198, 198, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#26C6C6',
                  margin: '0 auto 20px'
                }}>
                  <MessageCircle size={32} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px', color: '#fff' }}>¡Consulta enviada!</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '24px' }}>
                  Recibimos tu consulta. El capitán de la travesía te responderá directamente a <strong>{inquiryForm.email}</strong> a la brevedad.
                </p>
                <button
                  onClick={() => setIsInquiryModalOpen(false)}
                  className="btn btn--accent btn--md"
                  style={{ width: '100%' }}
                >
                  Entendido
                </button>
              </div>
            ) : (
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px', color: '#fff' }}>Enviar consulta</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
                  Preguntale al capitán sobre <strong>{trip.title}</strong> por email.
                </p>

                {inquiryError && (
                  <div style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    color: '#ef4444',
                    fontSize: '0.9rem',
                    marginBottom: '16px'
                  }}>
                    {inquiryError}
                  </div>
                )}

                <form onSubmit={handleSendInquiry} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px', textAlign: 'left' }}>
                      Nombre completo
                    </label>
                    <input
                      type="text"
                      className="input"
                      style={{ width: '100%', background: 'rgba(255, 255, 255, 0.05)', color: '#fff' }}
                      value={inquiryForm.name}
                      onChange={(e) => setInquiryForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ej: Juan Pérez"
                      required
                      disabled={inquiryLoading}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px', textAlign: 'left' }}>
                      Email de contacto
                    </label>
                    <input
                      type="email"
                      className="input"
                      style={{ width: '100%', background: 'rgba(255, 255, 255, 0.05)', color: '#fff' }}
                      value={inquiryForm.email}
                      onChange={(e) => setInquiryForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="ejemplo@correo.com"
                      required
                      disabled={inquiryLoading}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px', textAlign: 'left' }}>
                      Tu mensaje o consulta
                    </label>
                    <textarea
                      className="input"
                      style={{
                        width: '100%',
                        minHeight: '100px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: '#fff',
                        fontFamily: 'inherit',
                        padding: '12px',
                        resize: 'vertical'
                      }}
                      value={inquiryForm.message}
                      onChange={(e) => setInquiryForm(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Escribí tu consulta aquí..."
                      required
                      disabled={inquiryLoading}
                    />
                  </div>

                  {selectedDateObj && (
                    <div style={{
                      fontSize: '0.85rem',
                      color: 'var(--text-tertiary)',
                      background: 'rgba(255, 255, 255, 0.02)',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      borderLeft: '2px solid var(--accent)',
                      textAlign: 'left'
                    }}>
                      Consultando para el día: <strong>{new Date(selectedDateObj.date + 'T12:00:00').toLocaleDateString('es', { day: 'numeric', month: 'long' })}</strong>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn btn--accent btn--lg"
                    style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '8px' }}
                    disabled={inquiryLoading}
                  >
                    {inquiryLoading ? (
                      <>
                        <Loader size={18} className="spin" style={{ marginRight: '8px' }} />
                        Enviando consulta...
                      </>
                    ) : (
                      'Enviar consulta'
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
