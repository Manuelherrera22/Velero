/**
 * Generate a boarding-pass style PDF ticket with QR code
 * All heavy dependencies (jsPDF, qrcode) are loaded dynamically
 */
export async function generateTicketPDF({ trip, date, guests, total, currency, bookingId, name, email, phone }) {
  // Dynamic imports to avoid bundle issues
  const { default: jsPDF } = await import('jspdf')
  
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

  // Generate QR code
  let qrDataUrl = null
  try {
    const { default: QRCode } = await import('qrcode')
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

  // ── Left panel ──
  doc.setFillColor(20, 35, 60)
  doc.roundedRect(8, 8, 145, 84, 4, 4, 'F')

  // Header accent bar (Thick cyan top)
  doc.setFillColor(38, 198, 198)
  doc.roundedRect(8, 8, 145, 16, 4, 4, 'F')
  // Square off bottom part of the header so it blends seamlessly
  doc.rect(8, 20, 145, 4, 'F')

  // Header Text (Dark inside Cyan)
  doc.setTextColor(10, 22, 40) 
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('VELERO', 16, 18)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('RESERVA CONFIRMADA', 105, 17)

  // Trip Title (White inside dark blue panel)
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text((trip || 'Travesía').substring(0, 40), 16, 36)

  // Passenger
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

  // Date
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

  // Embarque
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(148, 163, 184)
  doc.text('PUNTO DE EMBARQUE', 16, 78)
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  const loc = (trip?.location || 'A coordinar con el capitán').substring(0, 40)
  doc.text(loc, 16, 83)
  
  if (trip?.location) {
    doc.setTextColor(38, 198, 198) // Cyan link
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    try {
      doc.textWithLink('Abrir en Google Maps ->', 16, 88, { url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trip.location)}` })
    } catch(e) {
      doc.text('Ver en mapa', 16, 88)
    }
  }

  // Total
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(148, 163, 184)
  doc.text('TOTAL', 110, 78)
  doc.setTextColor(38, 198, 198)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(formatPrice(total), 110, 85)

  // ── Right panel ──
  doc.setDrawColor(100, 116, 139)
  doc.setLineDashPattern([2, 2], 0)
  doc.line(158, 12, 158, 88)
  doc.setLineDashPattern([], 0)

  doc.setFillColor(20, 35, 60)
  doc.roundedRect(162, 8, 40, 84, 4, 4, 'F')

  if (qrDataUrl) {
    doc.addImage(qrDataUrl, 'PNG', 166, 14, 32, 32)
  }

  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(148, 163, 184)
  doc.text('CODIGO', 174, 54)
  doc.setTextColor(38, 198, 198)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(shortId, 170, 61)

  doc.setFontSize(6)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  doc.text('Presenta este QR', 167, 72)
  doc.text('al abordar', 173, 76)

  doc.setFontSize(6)
  doc.setTextColor(37, 211, 102)
  doc.text('WhatsApp:', 168, 84)
  doc.setTextColor(148, 163, 184)
  doc.text('+54 9 11 3669-6696', 164, 88)

  doc.save(`velero-ticket-${shortId}.pdf`)
}
