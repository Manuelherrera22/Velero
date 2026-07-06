import { useState } from 'react'
import { Gift, Check, CreditCard, Send, Download, Loader } from 'lucide-react'
import './GiftCards.css'

const AMOUNTS = [
  { value: 50000, label: '$50.000', description: 'Paseo compartido' },
  { value: 100000, label: '$100.000', description: 'Experiencia privada' },
  { value: 200000, label: '$200.000', description: 'Experiencia premium' },
]

function generatePreviewCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'KGC-'
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)]
  code += '-'
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export default function GiftCards() {
  const [selectedAmount, setSelectedAmount] = useState(null)
  const [recipientName, setRecipientName] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const selectedData = AMOUNTS.find(a => a.value === selectedAmount)

  const handlePurchase = async () => {
    if (!selectedAmount) return
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
          amount: selectedAmount,
          buyerEmail: buyerEmail.trim(),
          recipientName: recipientName.trim(),
          message: message.trim(),
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
          <span className="gc-hero__badge">
            <Gift size={14} />
            Regala una experiencia
          </span>
          <h1 className="gc-hero__title">Gift Cards Kailu</h1>
          <p className="gc-hero__subtitle">
            Regala una experiencia nautica inolvidable. Elige el monto, 
            completa la compra y recibe un PDF listo para obsequiar.
          </p>
        </div>

        {/* Amount Selection */}
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
              <div className="gc-amount-card__label">{amount.description}</div>
            </div>
          ))}
        </div>

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
              Nombre del destinatario <span className="gc-form__optional">(opcional)</span>
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
              Mensaje personalizado <span className="gc-form__optional">(opcional)</span>
            </label>
            <textarea
              className="gc-form__input gc-form__textarea"
              placeholder="Ej: Feliz cumple! Disfruta del agua."
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
            disabled={!selectedAmount || loading}
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
                {selectedAmount 
                  ? `Comprar Gift Card — ${selectedData?.label}` 
                  : 'Selecciona un monto'}
              </>
            )}
          </button>
          {error && <p className="gc-cta__error">{error}</p>}
        </div>

        {/* Live Preview */}
        {selectedAmount && (
          <div className="gc-preview">
            <h3 className="gc-preview__title">Vista previa</h3>
            <div className="gc-preview__card">
              <img src="/logo-azul.png" alt="Kailu" className="gc-preview__logo" />
              <div className="gc-preview__label">Gift Card</div>
              <div className="gc-preview__value">{selectedData?.label}</div>
              {recipientName && (
                <div className="gc-preview__recipient">Para: {recipientName}</div>
              )}
              <div className="gc-preview__footer">
                <span className="gc-preview__brand">kailu.travel</span>
                <span className="gc-preview__code">{generatePreviewCode()}</span>
              </div>
            </div>
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
            <div className="gc-info__desc">Recibe un PDF listo para enviar</div>
          </div>
        </div>
      </div>
    </div>
  )
}
