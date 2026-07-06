import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle, Download, Copy, Loader, Gift, AlertCircle } from 'lucide-react'
import { jsPDF } from 'jspdf'
import supabase from '../lib/supabase'
import './GiftCards.css'

export default function GiftCardConfirmation() {
  const [searchParams] = useSearchParams()
  const [giftCard, setGiftCard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const giftCardId = searchParams.get('id')
  const paymentStatus = searchParams.get('status') || searchParams.get('collection_status')

  useEffect(() => {
    if (giftCardId) {
      fetchGiftCard()
    } else {
      setError('No se encontro la gift card.')
      setLoading(false)
    }
  }, [giftCardId])

  const fetchGiftCard = async () => {
    try {
      // Poll a few times in case the webhook hasn't confirmed yet
      let attempts = 0
      let data = null
      while (attempts < 5) {
        const { data: gc, error: fetchErr } = await supabase
          .from('gift_cards')
          .select('*')
          .eq('id', giftCardId)
          .single()
          .abortSignal(AbortSignal.timeout(6000))

        if (fetchErr) throw fetchErr
        data = gc

        if (data.status === 'confirmed') break
        // Wait 2s before retrying
        await new Promise(r => setTimeout(r, 2000))
        attempts++
      }

      if (!data) {
        setError('Gift card no encontrada.')
      } else {
        setGiftCard(data)
      }
    } catch (err) {
      console.error('Error fetching gift card:', err)
      setError('Error al cargar la gift card.')
    }
    setLoading(false)
  }

  const formatPrice = (amount) => {
    return `$${Number(amount).toLocaleString('es-AR')}`
  }

  const generatePDF = useCallback(() => {
    if (!giftCard) return

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [200, 120] })

    // Background gradient (dark blue)
    doc.setFillColor(10, 22, 40)
    doc.rect(0, 0, 200, 120, 'F')

    // Decorative circle top-right
    doc.setFillColor(11, 171, 195)
    doc.setGState(doc.GState({ opacity: 0.08 }))
    doc.circle(170, 20, 50, 'F')
    doc.setGState(doc.GState({ opacity: 0.05 }))
    doc.circle(30, 100, 40, 'F')
    doc.setGState(doc.GState({ opacity: 1 }))

    // "GIFT CARD" label
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text('GIFT CARD', 20, 25)

    // Kailu brand
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(11, 171, 195)
    doc.text('kailu', 20, 35)
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Experiencias Nauticas', 48, 35)

    // Value
    doc.setFontSize(36)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.text(formatPrice(giftCard.amount), 20, 60)

    // Recipient
    if (giftCard.recipient_name) {
      doc.setFontSize(11)
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(180, 220, 230)
      doc.text(`Para: ${giftCard.recipient_name}`, 20, 72)
    }

    // Message
    if (giftCard.message) {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(150, 190, 200)
      const msgLines = doc.splitTextToSize(`"${giftCard.message}"`, 120)
      doc.text(msgLines, 20, giftCard.recipient_name ? 80 : 72)
    }

    // Divider line
    doc.setDrawColor(255, 255, 255)
    doc.setGState(doc.GState({ opacity: 0.15 }))
    doc.line(20, 95, 180, 95)
    doc.setGState(doc.GState({ opacity: 1 }))

    // Footer
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(140, 160, 180)
    doc.text('kailu.travel', 20, 103)

    // Code
    doc.setFontSize(10)
    doc.setFont('courier', 'bold')
    doc.setTextColor(11, 171, 195)
    doc.text(giftCard.code, 200 - 20, 103, { align: 'right' })

    // Instructions
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 120, 140)
    doc.text('Presenta este codigo al momento de reservar en kailu.travel', 20, 112)

    // Save
    doc.save(`GiftCard-Kailu-${giftCard.code}.pdf`)
  }, [giftCard])

  const copyLink = () => {
    const url = `${window.location.origin}/gift-cards/confirmacion?id=${giftCardId}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    })
  }

  if (loading) {
    return (
      <div className="gc-confirm">
        <div className="container">
          <div className="gc-confirm__icon">
            <Loader size={32} className="spin" />
          </div>
          <h1 className="gc-confirm__title">Procesando tu gift card...</h1>
          <p className="gc-confirm__subtitle">Estamos confirmando tu pago. Esto puede tardar unos segundos.</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="gc-confirm">
        <div className="container">
          <div className="gc-confirm__icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-error)' }}>
            <AlertCircle size={32} />
          </div>
          <h1 className="gc-confirm__title">Hubo un problema</h1>
          <p className="gc-confirm__subtitle">{error}</p>
          <div className="gc-confirm__actions">
            <Link to="/gift-cards" className="gc-confirm__btn gc-confirm__btn--primary">
              <Gift size={18} /> Volver a Gift Cards
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="gc-confirm">
      <div className="container">
        <div className="gc-confirm__icon">
          <CheckCircle size={36} />
        </div>
        <h1 className="gc-confirm__title">Tu Gift Card esta lista</h1>
        <p className="gc-confirm__subtitle">
          {giftCard.recipient_name 
            ? `Gift card de ${formatPrice(giftCard.amount)} para ${giftCard.recipient_name}`
            : `Gift card de ${formatPrice(giftCard.amount)}`
          }
        </p>

        {/* Preview */}
        <div className="gc-preview" style={{ marginTop: 0 }}>
          <div className="gc-preview__card">
            <img src="/logo-azul.png" alt="Kailu" className="gc-preview__logo" />
            <div className="gc-preview__label">Gift Card</div>
            <div className="gc-preview__value">{formatPrice(giftCard.amount)}</div>
            {giftCard.recipient_name && (
              <div className="gc-preview__recipient">Para: {giftCard.recipient_name}</div>
            )}
            <div className="gc-preview__footer">
              <span className="gc-preview__brand">kailu.travel</span>
              <span className="gc-preview__code">{giftCard.code}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="gc-confirm__actions">
          <button onClick={generatePDF} className="gc-confirm__btn gc-confirm__btn--primary">
            <Download size={18} /> Descargar PDF
          </button>
          <button onClick={copyLink} className="gc-confirm__btn gc-confirm__btn--secondary">
            <Copy size={18} /> {copied ? 'Enlace copiado' : 'Copiar enlace'}
          </button>
        </div>
        {copied && <p className="gc-confirm__copied">Enlace copiado al portapapeles</p>}
      </div>
    </div>
  )
}
