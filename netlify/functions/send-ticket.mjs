// Netlify serverless function to send booking confirmation email via Resend
export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { booking, trip, date, email, name, guests, total, currency, bookingId } = await req.json()

    if (!email || !trip) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: 'Email service not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const formatPrice = (p) => {
      if (currency === 'EUR') return `€${p}`
      if (currency === 'USD') return `US$${p}`
      return `$${Number(p).toLocaleString('es-AR')}`
    }

    const dateText = date
      ? `${new Date(date.date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} a las ${date.start_time?.slice(0, 5)}hs`
      : 'Fecha por confirmar'

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0A1628;font-family:'Helvetica Neue',Arial,sans-serif;color:#fff;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    
    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="font-size:28px;margin:0;color:#26C6C6;">⛵ Velero</h1>
      <p style="font-size:14px;color:#94A3B8;margin-top:4px;">Experiencias náuticas en Argentina</p>
    </div>

    <!-- Main Card -->
    <div style="background:rgba(30,41,59,0.8);border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">
      
      <!-- Ticket Header -->
      <div style="background:linear-gradient(135deg,#00B4B4,#008080);padding:24px;text-align:center;">
        <p style="font-size:14px;margin:0;opacity:0.9;">✅ RESERVA CONFIRMADA</p>
        <h2 style="font-size:24px;margin:8px 0 0;font-weight:700;">${trip}</h2>
      </div>

      <!-- Ticket Body -->
      <div style="padding:24px;">
        
        <!-- Boarding Pass Style -->
        <div style="display:flex;border-bottom:1px dashed rgba(255,255,255,0.1);padding-bottom:20px;margin-bottom:20px;">
          <div style="flex:1;">
            <p style="font-size:11px;color:#94A3B8;margin:0;">PASAJERO</p>
            <p style="font-size:16px;font-weight:600;margin:4px 0 0;">${name}</p>
          </div>
          <div style="flex:1;text-align:right;">
            <p style="font-size:11px;color:#94A3B8;margin:0;">PERSONAS</p>
            <p style="font-size:16px;font-weight:600;margin:4px 0 0;">${guests}</p>
          </div>
        </div>

        <div style="border-bottom:1px dashed rgba(255,255,255,0.1);padding-bottom:20px;margin-bottom:20px;">
          <p style="font-size:11px;color:#94A3B8;margin:0;">FECHA Y HORA</p>
          <p style="font-size:16px;font-weight:600;margin:4px 0 0;">${dateText}</p>
        </div>

        <div style="border-bottom:1px dashed rgba(255,255,255,0.1);padding-bottom:20px;margin-bottom:20px;">
          <p style="font-size:11px;color:#94A3B8;margin:0;">PUNTO DE ENCUENTRO</p>
          <p style="font-size:16px;font-weight:600;margin:4px 0 0;">${booking?.location || 'Se confirmará por email/WhatsApp'}</p>
        </div>

        <!-- Total -->
        <div style="background:rgba(0,180,180,0.1);border-radius:12px;padding:16px;text-align:center;">
          <p style="font-size:11px;color:#94A3B8;margin:0;">TOTAL PAGADO</p>
          <p style="font-size:28px;font-weight:800;color:#26C6C6;margin:4px 0 0;">${formatPrice(total)}</p>
        </div>

        <!-- Booking ID -->
        <div style="text-align:center;margin-top:20px;">
          <p style="font-size:11px;color:#94A3B8;margin:0;">ID DE RESERVA</p>
          <p style="font-size:14px;font-weight:600;font-family:monospace;color:#26C6C6;margin:4px 0 0;">${bookingId}</p>
        </div>
      </div>
    </div>

    <!-- WhatsApp CTA -->
    <div style="text-align:center;margin-top:24px;">
      <a href="https://wa.me/5491136696696?text=${encodeURIComponent(`Hola! Mi código de reserva es: ${bookingId}`)}" 
         style="display:inline-block;background:#25D366;color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:600;font-size:14px;">
        💬 ¿Consultas? Escribinos por WhatsApp
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:32px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.06);">
      <p style="font-size:12px;color:#64748B;margin:0;">
        © ${new Date().getFullYear()} Velero — Experiencias náuticas en Argentina
      </p>
      <p style="font-size:11px;color:#475569;margin:4px 0 0;">
        Este email fue enviado a ${email} por tu reserva en velero-ar.netlify.app
      </p>
    </div>
  </div>
</body>
</html>`

    // Send email via Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Velero <onboarding@resend.dev>',
        to: [email],
        subject: `🎫 Tu reserva está confirmada — ${trip}`,
        html: htmlContent,
      }),
    })

    const resendData = await resendResponse.json()

    if (!resendResponse.ok) {
      console.error('Resend error:', resendData)
      return new Response(JSON.stringify({ error: 'Failed to send email', details: resendData }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true, id: resendData.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export const config = {
  path: '/api/send-ticket',
}
