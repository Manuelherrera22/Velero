import { useState, useEffect } from 'react'
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, Phone, User, CreditCard, Shield, CheckCircle, Loader, Tag, AlertCircle, Download, Globe, FileText, Plus, Trash2 } from 'lucide-react'
import useAuthStore from '../stores/authStore'
import useBookingStore from '../stores/bookingStore'
import useTripStore from '../stores/tripStore'
import supabase from '../lib/supabase'
import './Checkout.css'

const WhatsAppIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

const WHATSAPP_NUMBER = '5491161789818'

export default function Checkout() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()
  const { createBooking, validateCoupon } = useBookingStore()
  const { currentTrip, tripDates, tripAddons, fetchTrip, loading: tripLoading, error: tripError } = useTripStore()

  const [step, setStep] = useState(1) // 1: contact, 2: confirm email, 3: payment, 4: confirmation
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [booking, setBooking] = useState(null)

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    emailConfirm: '',
    phone: '',
    nationality: 'AR',
    idType: 'dni',
    idNumber: '',
    termsAccepted: false,
  })

  // Parse booking params from URL
  const dateId = searchParams.get('date')
  const guests = parseInt(searchParams.get('guests')) || 2
  const selectedAddonsParam = searchParams.get('addons')
  const mode = searchParams.get('mode') || 'shared'
  const qrCode = searchParams.get('qr')
  let selectedAddons = {}
  try { selectedAddons = JSON.parse(selectedAddonsParam || '{}') } catch {}

  // Passengers list
  const [passengers, setPassengers] = useState([
    { name: '', nationality: 'AR', idType: 'dni', idNumber: '' }
  ])

  // Optional popup warning before payment
  const [showPassengerWarning, setShowPassengerWarning] = useState(false)
  const [hasSeenPassengerWarning, setHasSeenPassengerWarning] = useState(false)

  const updatePassenger = (idx, field, value) => {
    setPassengers(prev => prev.map((p, i) => {
      if (i !== idx) return p
      const updated = { ...p, [field]: value }
      // Auto-switch ID type based on nationality
      if (field === 'nationality') {
        updated.idType = value === 'AR' ? 'dni' : 'passport'
      }
      return updated
    }))
  }

  // Coupon
  const [couponCode, setCouponCode] = useState('')
  const [coupon, setCoupon] = useState(null)
  const [couponError, setCouponError] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)



  useEffect(() => {
    if (!currentTrip || currentTrip.id !== id) {
      fetchTrip(id)
    }
    // Pre-fill if user is logged in (Google, magic link, etc)
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: profile?.full_name || user.user_metadata?.full_name || prev.name,
        email: user.email || prev.email,
        emailConfirm: user.email || prev.emailConfirm,
        phone: profile?.phone || user.phone || prev.phone,
      }))
    }
  }, [id, user])

  const trip = currentTrip
  const selectedDate = tripDates.find(d => d.id === dateId)

  // Calculate totals (Base prices without discount, respecting per-slot overrides)
  const basePriceOriginal = mode === 'private'
    ? (selectedDate?.full_boat_price_override || trip?.full_boat_price)
    : (selectedDate?.price_per_person_override || trip?.price_per_person)
  const subtotalOriginal = mode === 'private' ? basePriceOriginal : basePriceOriginal * guests
  const addonsTotal = tripAddons.reduce((sum, a) => sum + (selectedAddons[a.id] || 0) * a.price, 0)
  
  // Gross total before any discount
  const grossTotal = subtotalOriginal + addonsTotal

  // Trip Promotional Discount (%)
  const tripDiscountAmount = trip?.discount_percentage ? (grossTotal * (trip.discount_percentage / 100)) : 0

  // Coupon Discount
  const couponDiscountAmount = coupon
    ? coupon.type === 'percentage'
      ? (grossTotal - tripDiscountAmount) * (coupon.value / 100)
      : Math.min(coupon.value, grossTotal - tripDiscountAmount)
    : 0

  const totalDiscount = tripDiscountAmount + couponDiscountAmount
  
  // Net subtotal (Subtotal - Discounts)
  const total = grossTotal - totalDiscount

  // Service Fee (3% over Net subtotal)
  const serviceFeePercent = 0.03;
  const serviceFeeAmount = total * serviceFeePercent;

  // Advance Payment calculations (Anticipo)
  const isAdvancePayment = trip?.requires_full_payment === false;
  
  // Kailu Commission (20% default, can be overridden per trip/captain in DB)
  const kailuCommission = trip?.kailu_commission || trip?.captain?.kailu_commission || 0.20;
  
  const advanceAmount = isAdvancePayment 
    ? Math.round(((total * kailuCommission) + serviceFeeAmount) * 100) / 100 
    : Math.round((total + serviceFeeAmount) * 100) / 100;
    
  const remainingAmount = isAdvancePayment 
    ? Math.round((total - (total * kailuCommission)) * 100) / 100 
    : 0;

  const formatPrice = (p) => {
    if (!trip) return '$0'
    if (trip.currency === 'EUR') return `€${p?.toLocaleString('es-ES', { minimumFractionDigits: 0 })}`
    if (trip.currency === 'USD') return `US$${p?.toLocaleString('en-US', { minimumFractionDigits: 0 })}`
    return `$${p?.toLocaleString('es-AR')}`
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    setCouponError('')

    const result = await validateCoupon(couponCode)
    if (result.valid) {
      setCoupon(result.coupon)
      setCouponError('')
    } else {
      setCoupon(null)
      setCouponError(result.error)
    }
    setCouponLoading(false)
  }

  const handleSubmitContact = (e) => {
    e.preventDefault()
    setError(null)
    if (!formData.name || !formData.email || !formData.emailConfirm || !formData.phone) {
      setError('Todos los campos de contacto son obligatorios.')
      return
    }
    if (formData.email.trim().toLowerCase() !== formData.emailConfirm.trim().toLowerCase()) {
      setError('Los correos electrónicos no coinciden.')
      return
    }
    if (!formData.termsAccepted) {
      setError('Debes aceptar los Términos y Condiciones para continuar.')
      return
    }
    // Validate passengers
    let validPassengers = [...passengers]
    
    // Auto-fill first passenger with contact data if empty
    if (!validPassengers[0].name.trim()) {
      validPassengers[0] = { ...validPassengers[0], name: formData.name }
    }
    setPassengers(validPassengers) // Update state just in case

    for (let i = 0; i < validPassengers.length; i++) {
      const p = validPassengers[i]
      if (!p.name.trim()) {
        setError(`Completá el nombre del pasajero ${i + 1}.`)
        return
      }
      if (!p.idNumber.trim()) {
        setError(`Completá el ${p.idType === 'dni' ? 'DNI' : 'Pasaporte'} del pasajero ${i + 1} (${p.name || 'sin nombre'}).`)
        return
      }
    }

    // Go to email confirmation step
    setStep(2)
  }

  const handleConfirmEmail = () => {
    if (formData.email !== formData.emailConfirm) {
      setError('Los emails no coinciden. Por favor verificá.')
      return
    }
    setError(null)
    setStep(3)
  }

  const handleCreateBooking = async () => {
    // If they haven't seen the warning and they have fewer passengers than they could bring
    const maxPax = mode === 'private' ? (trip?.max_capacity || 6) : guests
    if (!hasSeenPassengerWarning && passengers.length < maxPax) {
      setShowPassengerWarning(true)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Build addon list
      const addonsList = tripAddons
        .filter(a => selectedAddons[a.id] > 0)
        .map(a => ({
          id: a.id,
          name: a.name,
          price: a.price,
          quantity: selectedAddons[a.id] || 1,
        }))

      // Calculate affiliate commission if QR code exists
      let affiliateCommission = 0
      if (qrCode) {
        try {
          const { data: qrData } = await supabase
            .from('qr_codes')
            .select('*, hotel:hotels!hotel_id(commission_percent)')
            .eq('code', qrCode)
            .single()
            
          if (qrData?.hotel?.commission_percent) {
            affiliateCommission = total * (qrData.hotel.commission_percent / 100)
          }
        } catch (err) {
          console.error("Error fetching QR commission", err)
        }
      }

      const bookingData = {
        trip_id: id,
        trip_date_id: dateId || null,
        user_id: user?.id || null,
        guest_name: !user ? formData.name : null,
        guest_email: !user ? formData.email : null,
        guest_phone: !user ? formData.phone : null,
        quantity: guests,
        subtotal: grossTotal,
        addons_total: addonsTotal,
        discount: totalDiscount,
        total: advanceAmount,
        coupon_id: coupon?.id || null,
        status: 'pending',
        qr_code: qrCode || null,
        affiliate_commission: affiliateCommission,
        metadata: {
          selected_addons: addonsList,
          currency: trip?.currency || 'ARS',
          contact: { name: formData.name, email: formData.email, phone: formData.phone },
          passengers: passengers.map(p => ({
            name: p.name,
            nationality: p.nationality,
            id_type: p.idType,
            id_number: p.idNumber,
          })),
        },
        addons: addonsList,
      }

      const result = await createBooking(bookingData)

      if (result.success) {
        setBooking(result.data)

        // 1. Send magic link so user can access their dashboard
        if (!user) {
          try {
            await supabase.auth.signInWithOtp({
              email: formData.email,
              options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
                data: { full_name: formData.name },
              },
            })
          } catch (magicErr) {
            console.warn('Magic link failed (non-blocking):', magicErr)
          }
        }

        // 2. Create Mercado Pago Preference
        try {
          const mpResponse = await fetch('/api/create-preference', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bookingId: result.data.id,
              title: trip.title,
              price: advanceAmount, // Monto exacto a cobrar online (Anticipo + Tasa)
              email: formData.email,
              name: formData.name
            })
          })
          
          if (!mpResponse.ok) throw new Error('Error creating MP preference')
          const mpData = await mpResponse.json()
          
          // Redirect to Mercado Pago!
          if (mpData.init_point) {
            window.location.href = mpData.init_point
            return // Detener ejecución porque el usuario sale de la página
          } else {
            throw new Error('No init_point received')
          }
        } catch (mpError) {
          console.error('MP Error:', mpError)
          setError('Error al conectar con Mercado Pago. Verifica tus credenciales.')
          setLoading(false)
          return
        }
      } else {
        setError(result.error || 'Error al crear la reserva. Intenta de nuevo.')
      }
    } catch (err) {
      console.error('Booking flow error:', err)
      setError(`Error inesperado: ${err.message || err}`)
    } finally {
      setLoading(false)
    }
  }

  const buildWhatsAppUrl = () => {
    const dateText = selectedDate
      ? `\nFecha: ${new Date(selectedDate.date + 'T12:00:00').toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })} a las ${selectedDate.start_time?.slice(0, 5)}hs`
      : ''
    const msg = `¡Hola! 👋 Quiero reservar la travesía *${trip?.title}* en ${trip?.location}.${dateText}\nSomos ${guests} persona${guests > 1 ? 's' : ''}.\nTotal: ${formatPrice(total)}\n\n¿Cómo sigo?`
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`
  }

  const isWrongTrip = trip && trip.id !== id;

  if (tripLoading && (!trip || isWrongTrip)) {
    return (
      <div className="protected-loading">
        <Loader size={32} className="spin" />
        <p>Cargando información de reserva...</p>
      </div>
    )
  }

  if (!tripLoading && (!trip || isWrongTrip)) {
    return (
      <div className="protected-loading">
        <Loader size={32} style={{ opacity: 0 }} />
        <p>No se pudo cargar la travesía. Por favor, refresca la página.</p>
        <Link to="/explorar" className="btn btn--accent mt-4">Explorar travesías</Link>
      </div>
    )
  }

  // ══════════ STEP 4: Confirmation ══════════
  if (step === 4) {
    return (
      <div className="checkout">
        <div className="container container--narrow">
          <div className="checkout-success animate-fade-in">
            <div className="checkout-success__icon">
              <CheckCircle size={64} />
            </div>
            <h1 className="checkout-success__title">¡Reserva Confirmada!</h1>
            <p className="checkout-success__text">
              Te enviamos un email de confirmación a <strong>{formData.email}</strong> con todos los detalles de tu travesía.
            </p>
            <div className="checkout-success__details glass">
              <div className="checkout-success__line">
                <span>Travesía</span>
                <strong>{trip.title}</strong>
              </div>
              {selectedDate && (
                <div className="checkout-success__line">
                  <span>Fecha</span>
                  <strong>
                    {new Date(selectedDate.date + 'T12:00:00').toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })} · {selectedDate.start_time?.slice(0, 5)}hs
                  </strong>
                </div>
              )}
              <div className="checkout-success__line">
                <span>Personas</span>
                <strong>{guests}</strong>
              </div>
              {discount > 0 && (
                <div className="checkout-success__line">
                  <span>Descuento</span>
                  <strong style={{ color: 'var(--color-success)' }}>-{formatPrice(discount)}</strong>
                </div>
              )}
              <div className="checkout-success__line checkout-success__total">
                <span>Total</span>
                <strong>{formatPrice(total)}</strong>
              </div>
            </div>
            <div className="checkout-success__actions">
              <button
                onClick={async () => {
                  const { generateTicketPDF } = await import('../utils/generateTicket')
                  generateTicketPDF({
                    trip: trip.title,
                    date: selectedDate ? { date: selectedDate.date, start_time: selectedDate.start_time } : null,
                    guests,
                    total,
                    currency: trip.currency || 'ARS',
                    bookingId: booking?.id,
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                  })
                }}
                className="btn btn--accent btn--lg"
              >
                <Download size={18} /> Descargar Boleto PDF
              </button>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`¡Hola! 🎫 Mi código de reserva es: *${booking?.id?.slice(0, 8).toUpperCase()}*\n\nTravesía: ${trip.title}\nLugar de Salida: ${trip.location}\nFecha: ${selectedDate ? new Date(selectedDate.date + 'T12:00:00').toLocaleDateString('es') : 'A coordinar'}\nHora: ${selectedDate ? selectedDate.start_time?.slice(0, 5) + 'hs' : '-'}\nPersonas: ${guests}\n\n¿Podrían confirmar los detalles?`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--whatsapp btn--lg"
              >
                <WhatsAppIcon /> Enviar código por WhatsApp
              </a>
            </div>

            <div className="checkout-success__magic-link">
              <Mail size={16} />
              <p>
                Enviamos un <strong>link mágico</strong> a <strong>{formData.email}</strong>. 
                Hacé click en el link del email para acceder a tu perfil y ver tus reservas.
              </p>
            </div>

            <p className="checkout-success__note">
              Código de reserva: <strong>{booking?.id?.slice(0, 8).toUpperCase()}</strong>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ══════════ STEPS 1, 2 & 3 ══════════
  return (
    <div className="checkout">
      <div className="container container--narrow">
        <Link to={`/travesia/${id}`} className="trip-detail__back">
          <ArrowLeft size={18} /> Volver a la travesía
        </Link>

        {/* Progress */}
        <div className="checkout-progress">
          <div className={`checkout-progress__step ${step >= 1 ? 'checkout-progress__step--active' : ''}`}>
            <span className="checkout-progress__num">1</span>
            <span>Datos</span>
          </div>
          <div className="checkout-progress__line" />
          <div className={`checkout-progress__step ${step >= 2 ? 'checkout-progress__step--active' : ''}`}>
            <span className="checkout-progress__num">2</span>
            <span>Verificar</span>
          </div>
          <div className="checkout-progress__line" />
          <div className={`checkout-progress__step ${step >= 3 ? 'checkout-progress__step--active' : ''}`}>
            <span className="checkout-progress__num">3</span>
            <span>Pago</span>
          </div>
          <div className="checkout-progress__line" />
          <div className={`checkout-progress__step ${step >= 4 ? 'checkout-progress__step--active' : ''}`}>
            <span className="checkout-progress__num">4</span>
            <span>Listo</span>
          </div>
        </div>

        {error && (
          <div className="login-error" style={{ marginBottom: 'var(--space-4)' }}>
            <AlertCircle size={16} style={{ verticalAlign: '-3px' }} /> {error}
          </div>
        )}

        <div className="checkout-layout">
          <div className="checkout-form">
            {/* ── Step 1: Contact Info ── */}
            {step === 1 && (
              <form onSubmit={handleSubmitContact} className="animate-fade-in">
                <h2>Datos de Contacto</h2>
                <p className="checkout-form__subtitle">
                  {user 
                    ? 'Confirma tus datos para esta reserva.'
                    : 'No necesitás crear una cuenta. Solo necesitamos tus datos para enviarte la confirmación.'}
                </p>

                <div className="input-group">
                  <label htmlFor="checkout-name"><User size={14} /> Nombre completo *</label>
                  <input
                    id="checkout-name"
                    type="text"
                    className="input"
                    placeholder="Tu nombre"
                    value={formData.name}
                    onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="checkout-email"><Mail size={14} /> Email *</label>
                  <input
                    id="checkout-email"
                    type="email"
                    className="input"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="checkout-email-confirm"><Mail size={14} /> Confirmar Email *</label>
                  <input
                    id="checkout-email-confirm"
                    type="email"
                    className="input"
                    placeholder="tu@email.com"
                    value={formData.emailConfirm}
                    onChange={(e) => setFormData(p => ({ ...p, emailConfirm: e.target.value }))}
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="checkout-phone"><Phone size={14} /> Teléfono *</label>
                  <div className="phone-input-wrapper" style={{ display: 'flex', gap: '8px' }}>
                    <select 
                      className="input" 
                      style={{ width: '100px', padding: '0.75rem 0.5rem' }}
                      defaultValue="+54"
                    >
                      <option value="+54">🇦🇷 +54</option>
                      <option value="+55">🇧🇷 +55</option>
                      <option value="+56">🇨🇱 +56</option>
                      <option value="+598">🇺🇾 +598</option>
                      <option value="+595">🇵🇾 +595</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+34">🇪🇸 +34</option>
                    </select>
                    <input
                      id="checkout-phone"
                      type="tel"
                      className="input"
                      placeholder="11 1234 5678"
                      value={formData.phone}
                      onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                      required
                      style={{ flex: 1, backgroundColor: formData.phone ? 'var(--bg-primary)' : '#f9fafa', border: formData.phone ? '1px solid var(--border-color)' : '1px solid #d1d5db' }}
                    />
                  </div>
                  <p className="checkout-form__subtitle" style={{ marginTop: '8px', marginBottom: 0 }}>
                    Necesario para contactarte ante cambios climáticos o de fuerza mayor.
                  </p>
                </div>

                {/* ── Passengers ID Section ── */}
                <div className="checkout-passengers">
                  <h3><FileText size={16} /> Identificación de pasajeros</h3>
                  <p className="checkout-passengers__hint">
                    Ingresa los datos de todas las personas que te van a acompañar. Esto es necesario para el acceso al club náutico.
                  </p>

                  {passengers.map((pax, idx) => (
                    <div key={idx} className="checkout-passenger-card glass">
                      <div className="checkout-passenger-card__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Pasajero {idx + 1} {idx === 0 ? '(titular)' : ''}</span>
                        {idx > 0 && (
                          <button 
                            className="btn btn--ghost btn--sm" 
                            onClick={(e) => { e.preventDefault(); setPassengers(prev => prev.filter((_, i) => i !== idx)) }}
                            style={{ color: 'var(--color-error)' }}
                          >
                            <Trash2 size={14} /> Eliminar
                          </button>
                        )}
                      </div>

                      <div className="checkout-passenger-card__fields">
                        <div className="input-group">
                          <label><User size={14} /> Nombre completo *</label>
                          <input
                            type="text"
                            className="input"
                            placeholder={idx === 0 ? formData.name || 'Nombre del pasajero' : 'Nombre del pasajero'}
                            value={pax.name}
                            onChange={(e) => updatePassenger(idx, 'name', e.target.value)}
                            required
                          />
                        </div>

                        <div className="checkout-passenger-card__row">
                          <div className="input-group" style={{ flex: 1 }}>
                            <label><Globe size={14} /> Nacionalidad *</label>
                            <select
                              className="input"
                              value={pax.nationality}
                              onChange={(e) => updatePassenger(idx, 'nationality', e.target.value)}
                            >
                              <option value="AR">🇦🇷 Argentina</option>
                              <option value="BR">🇧🇷 Brasil</option>
                              <option value="CL">🇨🇱 Chile</option>
                              <option value="UY">🇺🇾 Uruguay</option>
                              <option value="PY">🇵🇾 Paraguay</option>
                              <option value="BO">🇧🇴 Bolivia</option>
                              <option value="PE">🇵🇪 Perú</option>
                              <option value="CO">🇨🇴 Colombia</option>
                              <option value="EC">🇪🇨 Ecuador</option>
                              <option value="VE">🇻🇪 Venezuela</option>
                              <option value="MX">🇲🇽 México</option>
                              <option value="US">🇺🇸 Estados Unidos</option>
                              <option value="ES">🇪🇸 España</option>
                              <option value="IT">🇮🇹 Italia</option>
                              <option value="FR">🇫🇷 Francia</option>
                              <option value="DE">🇩🇪 Alemania</option>
                              <option value="GB">🇬🇧 Reino Unido</option>
                              <option value="OTHER">🌍 Otro</option>
                            </select>
                          </div>

                          <div className="input-group" style={{ flex: 1 }}>
                            <label><FileText size={14} /> {pax.idType === 'dni' ? 'DNI *' : 'N° Pasaporte *'}</label>
                            <input
                              type="text"
                              className="input"
                              placeholder={pax.idType === 'dni' ? 'Ej: 35.123.456' : 'Ej: AB1234567'}
                              value={pax.idNumber}
                              onChange={(e) => updatePassenger(idx, 'idNumber', e.target.value)}
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {passengers.length < (mode === 'private' ? (trip?.max_capacity || 6) : guests) && (
                    <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                      <button 
                        className="btn btn--ghost" 
                        onClick={(e) => { e.preventDefault(); setPassengers(prev => [...prev, { name: '', nationality: 'AR', idType: 'dni', idNumber: '' }]) }}
                      >
                        <Plus size={16} /> Agregar pasajeros
                      </button>
                      <p className="checkout-form__subtitle" style={{ marginTop: '8px' }}>
                        Agrega un pasajero por cada persona que te acompañe
                      </p>
                    </div>
                  )}
                </div>

                {/* Coupon */}
                <div className="checkout-coupon">
                  <label><Tag size={14} /> ¿Tenés un cupón?</label>
                  <div className="checkout-coupon__row">
                    <input
                      type="text"
                      className="input"
                      placeholder="Código"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      style={{ flex: 1 }}
                    />
                    <button type="button" className="btn btn--outline btn--sm" onClick={handleApplyCoupon} disabled={couponLoading}>
                      {couponLoading ? <Loader size={14} className="spin" /> : 'Aplicar'}
                    </button>
                  </div>
                  {couponError && <p className="checkout-coupon__error">{couponError}</p>}
                  {coupon && (
                    <p className="checkout-coupon__success">
                      ✓ Cupón aplicado: {coupon.type === 'percentage' ? `${coupon.value}% de descuento` : `${formatPrice(coupon.value)} de descuento`}
                    </p>
                  )}
                </div>

                <div className="input-group" style={{ flexDirection: 'row', alignItems: 'flex-start', gap: '12px', marginTop: '16px', marginBottom: '24px' }}>
                  <input
                    type="checkbox"
                    id="terms-checkbox"
                    checked={formData.termsAccepted}
                    onChange={(e) => setFormData(p => ({ ...p, termsAccepted: e.target.checked }))}
                    style={{ marginTop: '4px', cursor: 'pointer', width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
                    required
                  />
                  <label htmlFor="terms-checkbox" style={{ fontSize: '0.9rem', lineHeight: '1.4', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    He leído y acepto los <a href="/terminos" target="_blank" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>Términos y Condiciones</a> y las Políticas de Cancelación.
                  </label>
                </div>

                <button type="submit" className="btn btn--accent btn--lg checkout-form__submit">
                  Continuar
                </button>


              </form>
            )}

            {/* ── Step 2: Email Confirmation ── */}
            {step === 2 && (
              <div className="animate-fade-in">
                <h2>Verificá tu Email</h2>
                <p className="checkout-form__subtitle">
                  Asegurate de que tu correo sea correcto. Ahí te enviaremos los boletos de tu travesía después de confirmar el pago.
                </p>

                <div className="checkout-email-verify glass">
                  <div className="checkout-email-verify__icon">
                    <Mail size={32} />
                  </div>
                  <p className="checkout-email-verify__current">
                    {formData.email}
                  </p>
                  <p className="checkout-email-verify__hint">
                    ¿Es correcto? Confirma escribiéndolo nuevamente:
                  </p>
                  <div className="input-group" style={{ marginTop: 'var(--space-3)' }}>
                    <input
                      type="email"
                      className="input"
                      placeholder="Repetí tu email"
                      value={formData.emailConfirm}
                      onChange={(e) => setFormData(p => ({ ...p, emailConfirm: e.target.value }))}
                      autoFocus
                    />
                  </div>
                  {formData.emailConfirm && formData.email === formData.emailConfirm && (
                    <p className="checkout-coupon__success" style={{ marginTop: 'var(--space-2)' }}>
                      <CheckCircle size={14} style={{ verticalAlign: '-2px' }} /> ¡Perfecto, los emails coinciden!
                    </p>
                  )}
                  {formData.emailConfirm && formData.email !== formData.emailConfirm && (
                    <p className="checkout-coupon__error" style={{ marginTop: 'var(--space-2)' }}>
                      Los emails no coinciden
                    </p>
                  )}
                </div>

                <button
                  onClick={handleConfirmEmail}
                  className="btn btn--accent btn--lg checkout-form__submit"
                  disabled={!formData.emailConfirm || formData.email !== formData.emailConfirm}
                >
                  Confirmar y continuar al pago
                </button>

                <button onClick={() => setStep(1)} className="btn btn--ghost checkout-form__back-btn">
                  Volver a editar datos
                </button>
              </div>
            )}

            {/* ── Step 3: Payment ── */}
            {step === 3 && (
              <div className="animate-fade-in">
                <h2>Pago Seguro</h2>
                <p className="checkout-form__subtitle">
                  Confirma tu reserva. Serás redirigido a Mercado Pago para completar el pago.
                </p>

                <div className="checkout-contact-summary glass">
                  <p><User size={14} style={{ verticalAlign: '-2px' }} /> {formData.name}</p>
                  <p><Mail size={14} style={{ verticalAlign: '-2px' }} /> {formData.email}</p>
                  {formData.phone && <p><Phone size={14} style={{ verticalAlign: '-2px' }} /> {formData.phone}</p>}
                  <button className="checkout-contact-summary__edit" onClick={() => setStep(1)}>Editar</button>
                </div>

                <div className="checkout-mp glass">
                  <div className="checkout-mp__header">
                    <CreditCard size={24} />
                    <span>Mercado Pago</span>
                  </div>
                  <p className="checkout-mp__text">
                    Acepta tarjetas de crédito, débito, efectivo y más. Tu información está protegida.
                  </p>
                  <div className="checkout-mp__badges">
                    <span className="badge badge--success"><Shield size={12} /> Pago Seguro</span>
                    <span className="badge badge--info"><CheckCircle size={12} /> Garantizado</span>
                  </div>
                </div>

                <button
                  onClick={handleCreateBooking}
                  className="btn btn--accent btn--lg checkout-form__submit"
                  disabled={loading}
                >
                  {loading ? (
                    <><Loader size={18} className="spin" /> Procesando...</>
                  ) : (
                    `Pagar ${formatPrice(advanceAmount)} con Mercado Pago`
                  )}
                </button>

                <button onClick={() => setStep(2)} className="btn btn--ghost checkout-form__back-btn" style={{ marginTop: 'var(--space-4)' }}>
                  Volver
                </button>
              </div>
            )}
          </div>

          {/* ── Order Summary ── */}
          <div className="checkout-summary glass">
            <h3>Resumen de reserva</h3>
            <div className="checkout-summary__trip">
              <strong>{trip.title}</strong>
              <span>
                {trip.location}
                {selectedDate && ` · ${new Date(selectedDate.date + 'T12:00:00').toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })} · ${selectedDate.start_time?.slice(0, 5)}hs`}
              </span>
            </div>
            <div className="checkout-summary__lines">
              <div className="checkout-summary__line">
                <span>{formatPrice(basePriceOriginal)} × {mode === 'private' ? '1 navío' : `${guests} persona${guests > 1 ? 's' : ''}`}</span>
                <span>{formatPrice(subtotalOriginal)}</span>
              </div>
              {tripAddons.filter(a => selectedAddons[a.id] > 0).map(a => (
                <div key={a.id} className="checkout-summary__line">
                  <span>{a.name} × {selectedAddons[a.id]}</span>
                  <span>{formatPrice(a.price * selectedAddons[a.id])}</span>
                </div>
              ))}
            </div>
            <div className="checkout-summary__total" style={{ flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: 'var(--text-md)', color: 'var(--text-secondary)' }}>
                <span>Subtotal de la experiencia</span>
                <span>{formatPrice(grossTotal)}</span>
              </div>
              
              {totalDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: 'var(--text-md)', color: 'var(--color-success)', marginTop: '4px' }}>
                  <span>Descuento {trip?.discount_percentage ? `${trip.discount_percentage}%` : ''} {coupon ? `(${coupon.code})` : ''}</span>
                  <span>- {formatPrice(totalDiscount)}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: 'var(--text-md)', color: 'var(--text-secondary)', marginTop: '4px' }}>
                <span>Tasa de servicio (3%)</span>
                <span>{formatPrice(serviceFeeAmount)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                <span style={{ fontSize: 'var(--text-lg)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                  {isAdvancePayment ? 'Total a pagar (Cobro online)' : 'Total a pagar'}
                </span>
                <strong style={{ fontSize: 'var(--text-xl)', color: 'var(--accent-color, var(--color-primary))' }}>
                  {formatPrice(advanceAmount)}
                </strong>
              </div>
              
              {isAdvancePayment && (
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '8px', fontSize: 'var(--text-md)', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-secondary)', padding: '8px', borderRadius: '8px' }}>
                  <span>Saldo a abonar en puerto</span>
                  <strong>{formatPrice(remainingAmount)}</strong>
                </div>
              )}
            </div>
          </div>
          {/* Passenger Warning Modal */}
          {showPassengerWarning && (
            <div className="modal-backdrop">
              <div className="modal-content animate-fade-in" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                <AlertCircle size={48} color="var(--color-warning)" style={{ margin: '0 auto var(--space-4)' }} />
                <h3 style={{ marginBottom: 'var(--space-2)' }}>Faltan pasajeros</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
                  ⚠️ Asegúrate de haber cargado a todos los pasajeros antes de continuar.
                </p>
                <button 
                  className="btn btn--primary" 
                  onClick={() => {
                    setShowPassengerWarning(false);
                    setHasSeenPassengerWarning(true);
                  }}
                  style={{ width: '100%' }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
