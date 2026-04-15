import { useState, useEffect } from 'react'
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, Phone, User, CreditCard, Shield, CheckCircle, Loader, Tag, AlertCircle } from 'lucide-react'
import useAuthStore from '../stores/authStore'
import useBookingStore from '../stores/bookingStore'
import useTripStore from '../stores/tripStore'
import './Checkout.css'

export default function Checkout() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { createBooking, validateCoupon } = useBookingStore()
  const { currentTrip, tripDates, tripAddons, fetchTrip } = useTripStore()

  const [step, setStep] = useState(1) // 1: contact, 2: payment, 3: confirmation
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [booking, setBooking] = useState(null)

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  })

  // Coupon
  const [couponCode, setCouponCode] = useState('')
  const [coupon, setCoupon] = useState(null)
  const [couponError, setCouponError] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)

  // Parse booking params from URL
  const dateId = searchParams.get('date')
  const guests = parseInt(searchParams.get('guests')) || 2
  const selectedAddonsParam = searchParams.get('addons')
  let selectedAddons = {}
  try { selectedAddons = JSON.parse(selectedAddonsParam || '{}') } catch {}

  useEffect(() => {
    if (!currentTrip || currentTrip.id !== id) {
      fetchTrip(id)
    }
    // Pre-fill if user is logged in
    if (user) {
      setFormData(prev => ({
        ...prev,
        email: user.email || prev.email,
      }))
    }
  }, [id, user])

  const trip = currentTrip
  const selectedDate = tripDates.find(d => d.id === dateId)

  // Calculate totals
  const pricePerPerson = trip?.price_per_person || 0
  const subtotal = pricePerPerson * guests
  const addonsTotal = tripAddons.reduce((sum, a) => sum + (selectedAddons[a.id] || 0) * a.price, 0)
  const grossTotal = subtotal + addonsTotal

  const discount = coupon
    ? coupon.type === 'percentage'
      ? grossTotal * (coupon.value / 100)
      : Math.min(coupon.value, grossTotal)
    : 0

  const total = grossTotal - discount

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
    if (!formData.name || !formData.email) {
      setError('Nombre y email son obligatorios.')
      return
    }
    setStep(2)
  }

  const handleCreateBooking = async () => {
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

      const bookingData = {
        trip_id: id,
        trip_date_id: dateId || null,
        user_id: user?.id || null,
        guest_name: !user ? formData.name : null,
        guest_email: !user ? formData.email : null,
        guest_phone: !user ? formData.phone : null,
        quantity: guests,
        subtotal,
        addons_total: addonsTotal,
        discount,
        total,
        coupon_id: coupon?.id || null,
        status: 'pending',
        metadata: {
          selected_addons: addonsList,
          currency: trip?.currency || 'ARS',
          contact: { name: formData.name, email: formData.email, phone: formData.phone },
        },
        addons: addonsList,
      }

      const result = await createBooking(bookingData)

      if (result.success) {
        setBooking(result.data)
        // In production, here we'd redirect to Mercado Pago
        // For now, simulate payment success
        setStep(3)
      } else {
        setError(result.error || 'Error al crear la reserva. Intenta de nuevo.')
      }
    } catch (err) {
      setError('Error inesperado. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (!trip) {
    return (
      <div className="protected-loading">
        <Loader size={32} className="spin" />
        <p>Cargando...</p>
      </div>
    )
  }

  // ══════════ STEP 3: Confirmation ══════════
  if (step === 3) {
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
              <Link to="/" className="btn btn--accent btn--lg">
                Volver al Inicio
              </Link>
            </div>
            <p className="checkout-success__note">
              ID de reserva: {booking?.id?.slice(0, 8)}... · ¿No recibiste el email? Revisa spam o contactanos a soporte@bluhar.com
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ══════════ STEPS 1 & 2 ══════════
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
            <span>Datos de contacto</span>
          </div>
          <div className="checkout-progress__line" />
          <div className={`checkout-progress__step ${step >= 2 ? 'checkout-progress__step--active' : ''}`}>
            <span className="checkout-progress__num">2</span>
            <span>Pago</span>
          </div>
          <div className="checkout-progress__line" />
          <div className={`checkout-progress__step ${step >= 3 ? 'checkout-progress__step--active' : ''}`}>
            <span className="checkout-progress__num">3</span>
            <span>Confirmación</span>
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
                    : 'No necesitas crear una cuenta. Solo necesitamos tus datos para enviarte la confirmación.'}
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
                  <label htmlFor="checkout-phone"><Phone size={14} /> Teléfono (opcional)</label>
                  <input
                    id="checkout-phone"
                    type="tel"
                    className="input"
                    placeholder="+54 11 1234 5678"
                    value={formData.phone}
                    onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                  />
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

                <button type="submit" className="btn btn--accent btn--lg checkout-form__submit">
                  Continuar al pago
                </button>
              </form>
            )}

            {/* ── Step 2: Payment ── */}
            {step === 2 && (
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
                    `Pagar ${formatPrice(total)} con Mercado Pago`
                  )}
                </button>

                <button onClick={() => setStep(1)} className="btn btn--ghost checkout-form__back-btn">
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
                <span>{formatPrice(pricePerPerson)} × {guests} persona{guests > 1 ? 's' : ''}</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {tripAddons.filter(a => selectedAddons[a.id] > 0).map(a => (
                <div key={a.id} className="checkout-summary__line">
                  <span>{a.name} × {selectedAddons[a.id]}</span>
                  <span>{formatPrice(a.price * selectedAddons[a.id])}</span>
                </div>
              ))}
              {discount > 0 && (
                <div className="checkout-summary__line" style={{ color: 'var(--color-success)' }}>
                  <span>Descuento ({coupon?.code})</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
            </div>
            <div className="checkout-summary__total">
              <span>Total</span>
              <strong>{formatPrice(total)}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
