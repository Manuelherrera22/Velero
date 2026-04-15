import jsPDF from 'jspdf'

/**
 * Generate a boarding-pass style PDF ticket with QR code
 */
export async function generateTicketPDF({ trip, date, guests, total, currency, bookingId, name, email, phone }) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [210, 100] })

  const formatPrice = (p) => {
    if (currency === 'EUR') return `€${p}`
    if (currency === 'USD') return `US$${p}`
    return `$${Number(p).toLocaleString('es-AR')}`
  }

  const dateText = date
    ? new Date(date.date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : 'Por confirmar'
  const timeText = date?.start_time?.slice(0, 5) || '--:--'
  const shortId = bookingId?.slice(0, 8).toUpperCase() || 'XXXXXXXX'

  // Generate QR code as data URL (dynamic import to avoid bundle issues)
  let qrDataUrl = null
  try {
    const QRCode = (await import('qrcode')).default
    qrDataUrl = await QRCode.toDataURL(
      `https://velero-ar.netlify.app/checkin/${bookingId}`,
      { width: 200, margin: 1, color: { dark: '#26C6C6', light: '#0A1628' } }
    )
  } catch (e) {
    console.warn('QR generation failed:', e)
  }

  // ── Background ──
  doc.setFillColor(10, 22, 40)
  doc.rect(0, 0, 210, 100, 'F')

  // ── Left panel (main ticket) ──
  doc.setFillColor(20, 35, 60)
  doc.roundedRect(8, 8, 145, 84, 4, 4, 'F')

  // Header accent bar
  doc.setFillColor(0, 180, 180)
  doc.roundedRect(8, 8, 145, 18, 4, 4, 'F')
  doc.setFillColor(20, 35, 60)
  doc.rect(8, 18, 145, 8, 'F')

  // Brand
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('VELERO', 16, 20)

  // Confirmed badge
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('RESERVA CONFIRMADA', 105, 20)

  // Trip title
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  const titleLines = doc.splitTextToSize(trip || 'Travesía', 90)
  doc.text(titleLines[0], 16, 36)

  // Passenger info
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(148, 163, 184)

  doc.text('PASAJERO', 16, 46)
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(name || 'Invitado', 16, 51)

  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(148, 163, 184)
  doc.text('PERSONAS', 80, 46)
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(String(guests), 80, 51)

  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(148, 163, 184)
  doc.text('EMAIL', 110, 46)
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(email || '', 110, 51)

  // Date & time
  doc.setFontSize(7)
  doc.setTextColor(148, 163, 184)
  doc.text('FECHA', 16, 62)
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(dateText, 16, 67)

  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(148, 163, 184)
  doc.text('HORA', 110, 62)
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(`${timeText}hs`, 110, 67)

  // Total
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(148, 163, 184)
  doc.text('TOTAL', 16, 78)
  doc.setTextColor(38, 198, 198)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(formatPrice(total), 16, 85)

  // ── Right panel (tear-off stub with QR) ──
  doc.setDrawColor(100, 116, 139)
  doc.setLineDashPattern([2, 2], 0)
  doc.line(158, 12, 158, 88)
  doc.setLineDashPattern([], 0)

  doc.setFillColor(20, 35, 60)
  doc.roundedRect(162, 8, 40, 84, 4, 4, 'F')

  // QR Code
  if (qrDataUrl) {
    doc.addImage(qrDataUrl, 'PNG', 166, 14, 32, 32)
  }

  // Booking code
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(148, 163, 184)
  doc.text('CODIGO', 174, 54)

  doc.setTextColor(38, 198, 198)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(shortId, 170, 61)

  // Scan text
  doc.setFontSize(6)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  doc.text('Presenta este QR', 167, 72)
  doc.text('al abordar', 173, 76)

  // WhatsApp
  doc.setFontSize(6)
  doc.setTextColor(37, 211, 102)
  doc.text('WhatsApp:', 168, 84)
  doc.setTextColor(148, 163, 184)
  doc.text('+54 9 11 3669-6696', 164, 88)

  doc.save(`velero-ticket-${shortId}.pdf`)
}
