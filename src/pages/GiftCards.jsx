import { useState, useEffect } from 'react'
import { Gift, Check, CreditCard, Send, Download, Loader } from 'lucide-react'
import { supabase } from '../lib/supabase'
import './GiftCards.css'

const AMOUNTS = [
  { value: 50000, label: '$50.000' },
  { value: 100000, label: '$100.000' },
  { value: 200000, label: '$200.000' },
]

function generatePreviewCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'KGC-'
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)]
  code += '-'
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export default function GiftCards({ defaultMode = 'amount', disableToggle = false }) {
  const [selectedAmount, setSelectedAmount] = useState(null)
  const [recipientName, setRecipientName] = useState('')
  const [senderName, setSenderName] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [mode, setMode] = useState(defaultMode) // 'amount' | 'experience'
  const [trips, setTrips] = useState([])
  const [selectedTripId, setSelectedTripId] = useState('')
  const [guests, setGuests] = useState(2)

  useEffect(() => {
    supabase.from('trips').select('id, title, price_per_person').eq('status', 'published')
      .then(({data}) => { if (data) setTrips(data) })
  }, [])

  const selectedData = AMOUNTS.find(a => a.value === selectedAmount)

  const handlePurchase = async () => {
    const isExperienceMode = mode === 'experience'
    const finalAmount = isExperienceMode 
      ? (trips.find(t => t.id === selectedTripId)?.price_per_person * guests)
      : selectedAmount

    if (!finalAmount) {
      setError('Por favor seleccioná un monto o una experiencia válida.')
      return
    }

    if (!buyerEmail.trim()) {
      setError('Ingresa tu email para recibir la gift card.')
      return
    }

    setError('')
    setLoading(true)

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000)

      const response = await fetch('/api/create-gift-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalAmount,
          buyerEmail: buyerEmail.trim(),
          recipientName: recipientName.trim(),
          senderName: senderName.trim(),
          message: message.trim(),
          is_experience_based: isExperienceMode,
          trip_id: isExperienceMode ? selectedTripId : null,
          guests: isExperienceMode ? guests : null
        }),
        signal: controller.signal,
      })
      clearTimeout(timeout)

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(`Error ${response.status}: ${errText}`)
      }

      const data = await response.json()

      if (data.init_point) {
        window.location.href = data.init_point
        return
      } else {
        throw new Error('No se recibio el enlace de pago')
      }
    } catch (err) {
      console.error('Gift card purchase error:', err)
      setError(`No pudimos procesar tu compra: ${err.message}. Intenta nuevamente.`)
      setLoading(false)
    }
  }

  return (
    <div className="gift-cards">
      <div className="container">
        {/* Hero */}
        <div className="gc-hero">
          <div className="gc-hero__image-container">
            <img src="/foto-gift.jpeg" alt="Gift Cards Kailu" className="gc-hero__image" />
            <h1 className="gc-hero__title">Gift Cards Kailu</h1>
          </div>
          <p className="gc-hero__subtitle">
            Hay regalos que se guardan. Otros se viven. Regalá un momento. Lo demás, llega solo.
          </p>
        </div>

        {/* Mode Toggle */}
        {!disableToggle && (
          <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', justifyContent: 'center' }}>
            <button className={`btn ${mode === 'amount' ? 'btn--primary' : 'btn--outline'}`} onClick={() => setMode('amount')}>Regalar Monto Fijo</button>
            <button className={`btn ${mode === 'experience' ? 'btn--primary' : 'btn--outline'}`} onClick={() => setMode('experience')}>Regalar Experiencia</button>
          </div>
        )}

        {/* Selection */}
        {mode === 'amount' ? (
          <div className="gc-amounts">
            {AMOUNTS.map(amount => (
              <div
                key={amount.value}
                className={`gc-amount-card ${selectedAmount === amount.value ? 'gc-amount-card--selected' : ''}`}
                onClick={() => { setSelectedAmount(amount.value); setError('') }}
              >
                <div className="gc-amount-card__check">
                  <Check size={14} />
                </div>
                <div className="gc-amount-card__value">{amount.label}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="gc-experience" style={{ maxWidth: '600px', margin: '0 auto 40px auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="gc-form__group">
              <label className="gc-form__label">Seleccioná una Travesía</label>
              <select className="gc-form__input" value={selectedTripId} onChange={e => setSelectedTripId(e.target.value)}>
                <option value="">-- Elegí la experiencia a regalar --</option>
                {trips.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>
            {selectedTripId && (
              <div className="gc-form__group">
                <label className="gc-form__label">Cantidad de Personas (Pasajeros a invitar)</label>
                <input type="number" min="1" className="gc-form__input" value={guests} onChange={e => setGuests(parseInt(e.target.value) || 1)} />
              </div>
            )}
          </div>
        )}

        {/* Form */}
        <div className="gc-form">
          <div className="gc-form__group">
            <label className="gc-form__label">
              Tu email <span className="gc-form__optional">(obligatorio, para enviarte la gift card)</span>
            </label>
            <input
              type="email"
              className="gc-form__input"
              placeholder="tu@email.com"
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
            />
          </div>

          <div className="gc-form__group">
            <label className="gc-form__label">
              Nombre del destinatario (Para) <span className="gc-form__optional">(opcional)</span>
            </label>
            <input
              type="text"
              className="gc-form__input"
              placeholder="Ej: Maria"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
            />
          </div>

          <div className="gc-form__group">
            <label className="gc-form__label">
              Tu nombre o seudónimo (De) <span className="gc-form__optional">(opcional)</span>
            </label>
            <input
              type="text"
              className="gc-form__input"
              placeholder="Ej: Juan"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
            />
          </div>

          <div className="gc-form__group">
            <label className="gc-form__label">
              Tu dedicatoria <span className="gc-form__optional">(opcional)</span>
            </label>
            <textarea
              className="gc-form__input gc-form__textarea"
              placeholder="Esta dedicatoria acompañará la Gift Card cuando la compartas por WhatsApp, PDF o enlace."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={150}
            />
          </div>
        </div>

        {/* CTA */}
        <div className="gc-cta">
          <button
            className="gc-cta__button"
            disabled={(mode === 'amount' ? !selectedAmount : !selectedTripId) || loading}
            onClick={handlePurchase}
          >
            {loading ? (
              <>
                <Loader size={20} className="spin" />
                Procesando...
              </>
            ) : (
              <>
                <CreditCard size={20} />
                {(mode === 'amount' ? selectedAmount : selectedTripId) 
                  ? `Quiero regalar` 
                  : 'Seleccioná una opción'}
              </>
            )}
          </button>
          {error && <p className="gc-cta__error">{error}</p>}
        </div>

        {/* Live Preview */}
        {(mode === 'amount' ? selectedAmount : selectedTripId) && (
          <div className="gc-preview">
            <h3 className="gc-preview__title">Vista previa</h3>
            <div className="gc-preview__card">
              <img src="/logo-azul.png" alt="Kailu" className="gc-preview__logo" />
              <div className="gc-preview__label">Gift Card</div>
              <div className="gc-preview__names">
                {recipientName && (
                  <div className="gc-preview__recipient">Para: {recipientName}</div>
                )}
                {senderName && (
                  <div className="gc-preview__sender">De: {senderName}</div>
                )}
              </div>
              <div className="gc-preview-card__amount" style={{ fontSize: mode === 'experience' ? '20px' : '36px', textAlign: mode === 'experience' ? 'left' : 'right' }}>
                {mode === 'experience' 
                  ? `Válido para: ${trips.find(t => t.id === selectedTripId)?.title} (${guests} persona${guests > 1 ? 's' : ''})` 
                  : (selectedData ? selectedData.label : '$0')}
              </div>
              <div className="gc-preview__footer">
                <span className="gc-preview__brand">kailu.travel</span>
                <span className="gc-preview__code">{generatePreviewCode()}</span>
              </div>
            </div>
            <p className="gc-preview__disclaimer">
              *Válida por 6 meses, aplicable a cualquiera de las experiencias publicadas.
            </p>
          </div>
        )}

        {/* Info */}
        <div className="gc-info">
          <div className="gc-info__item">
            <div className="gc-info__icon"><Gift size={22} /></div>
            <div className="gc-info__title">Elige el monto</div>
            <div className="gc-info__desc">Selecciona entre tres valores para regalar</div>
          </div>
          <div className="gc-info__item">
            <div className="gc-info__icon"><CreditCard size={22} /></div>
            <div className="gc-info__title">Paga con Mercado Pago</div>
            <div className="gc-info__desc">Pago seguro con tarjeta o transferencia</div>
          </div>
          <div className="gc-info__item">
            <div className="gc-info__icon"><Send size={22} /></div>
            <div className="gc-info__title">Descarga y comparte</div>
            <div className="gc-info__desc">Recibe un PDF listo para enviar (incluso por WhatsApp)</div>
          </div>
        </div>
      </div>
    </div>
  )
}
