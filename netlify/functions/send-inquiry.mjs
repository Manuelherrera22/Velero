import { createClient } from '@supabase/supabase-js'

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { tripId, tripTitle, captainId, name, email, message, dateText, guests } = await req.json()

    if (!email || !name || !message || !tripTitle || !captainId) {
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

    // 1. Fetch Captain's email from Supabase
    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: captainProfile, error: profileErr } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', captainId)
      .single()

    if (profileErr || !captainProfile?.email) {
      console.error('Error fetching captain email:', profileErr)
    }

    const captainEmail = captainProfile?.email || 'soporte@kailu.travel'
    const captainName = captainProfile?.full_name || 'Capitán Kailu'

    // 2. Format emails
    const fromEmail = process.env.RESEND_INQUIRY_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || 'Kailu <no-reply@kailu.travel>'

    // Email to Captain
    const captainHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0A1628;font-family:'Helvetica Neue',Arial,sans-serif;color:#fff;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    
    <!-- Logo -->
    <div style="text-align:center;margin-bottom:32px;">
      <img src="https://kailu.travel/logo-kailu.jpg" alt="Kailu" width="160" height="160" style="border-radius:16px;" />
    </div>

    <!-- Main Card -->
    <div style="background:#0d1b2e;border:1px solid rgba(11,171,195,0.15);border-radius:16px;overflow:hidden;padding:32px;">
      <h2 style="font-size:20px;margin:0 0 20px 0;font-weight:700;color:#0babc3;">¡Hola, ${captainName}!</h2>
      <p style="font-size:15px;color:#E2E8F0;margin:0 0 20px 0;line-height:1.6;">
        Recibiste una nueva consulta sobre tu experiencia: <strong>${tripTitle}</strong>.
      </p>

      <!-- Details Card -->
      <div style="background:rgba(0,180,180,0.05);border:1px solid rgba(0,180,180,0.15);border-radius:12px;padding:20px;margin-bottom:24px;line-height:1.6;">
        <p style="margin:0 0 8px 0;font-size:14px;color:#94A3B8;"><strong>Interesado:</strong> ${name} (<a href="mailto:${email}" style="color:#0babc3;text-decoration:none;">${email}</a>)</p>
        <p style="margin:0 0 8px 0;font-size:14px;color:#94A3B8;"><strong>Fecha consultada:</strong> ${dateText || 'Fecha por confirmar'}</p>
        <p style="margin:0 0 8px 0;font-size:14px;color:#94A3B8;"><strong>Personas:</strong> ${guests || 1}</p>
        <p style="margin:16px 0 0 0;font-size:14px;color:#fff;border-top:1px solid rgba(255,255,255,0.06);padding-top:12px;">
          <strong>Mensaje de la consulta:</strong><br/>
          <span style="font-style:italic;color:#E2E8F0;">"${message}"</span>
        </p>
      </div>

      <p style="font-size:14px;color:#E2E8F0;margin:0;line-height:1.6;text-align:center;">
        Para responderle al usuario, podés escribirle directamente a su correo haciendo clic en <a href="mailto:${email}" style="color:#0babc3;font-weight:600;text-decoration:none;">responder email</a>.
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:32px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.06);">
      <p style="font-size:13px;color:#0babc3;margin:0;font-weight:600;">kailu.travel</p>
      <p style="font-size:12px;color:#64748B;margin:6px 0 0;">Experiencias náuticas en Argentina</p>
    </div>
  </div>
</body>
</html>`

    // Email to Passenger (receipt confirmation)
    const passengerHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0A1628;font-family:'Helvetica Neue',Arial,sans-serif;color:#fff;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    
    <!-- Logo -->
    <div style="text-align:center;margin-bottom:32px;">
      <img src="https://kailu.travel/logo-kailu.jpg" alt="Kailu" width="160" height="160" style="border-radius:16px;" />
    </div>

    <!-- Main Card -->
    <div style="background:#0d1b2e;border:1px solid rgba(11,171,195,0.15);border-radius:16px;overflow:hidden;padding:32px;">
      <h2 style="font-size:20px;margin:0 0 20px 0;font-weight:700;color:#0babc3;">¡Hola, ${name}!</h2>
      <p style="font-size:15px;color:#E2E8F0;margin:0 0 20px 0;line-height:1.6;">
        Recibimos tu consulta sobre la experiencia <strong>${tripTitle}</strong>. 
      </p>
      <p style="font-size:15px;color:#E2E8F0;margin:0 0 24px 0;line-height:1.6;">
        El capitán ha sido notificado y te responderá directamente a tu casilla de correo electrónico a la brevedad.
      </p>

      <!-- Details Card -->
      <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:20px;margin-bottom:24px;line-height:1.6;">
        <p style="margin:0 0 8px 0;font-size:14px;color:#94A3B8;"><strong>Experiencia:</strong> ${tripTitle}</p>
        <p style="margin:0 0 8px 0;font-size:14px;color:#94A3B8;"><strong>Tu consulta:</strong></p>
        <p style="margin:0;font-size:14px;color:#E2E8F0;font-style:italic;">
          "${message}"
        </p>
      </div>

      <p style="font-size:14px;color:#E2E8F0;margin:0;line-height:1.6;text-align:center;">
        ¡Gracias por elegir Kailu para vivir momentos inolvidables!
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:32px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.06);">
      <p style="font-size:13px;color:#0babc3;margin:0;font-weight:600;">kailu.travel</p>
      <p style="font-size:12px;color:#64748B;margin:6px 0 0;">Experiencias náuticas en Argentina</p>
    </div>
  </div>
</body>
</html>`

    // 3. Send both emails concurrently
    const [capRes, passRes] = await Promise.all([
      // Send to captain
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [captainEmail],
          subject: `✉️ Nueva consulta sobre tu experiencia: ${tripTitle}`,
          html: captainHtml,
        }),
      }),
      // Send receipt to user
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [email],
          subject: `⛵ Recibimos tu consulta en Kailu`,
          html: passengerHtml,
        }),
      })
    ])

    const capData = await capRes.json()
    const passData = await passRes.json()

    if (!capRes.ok || !passRes.ok) {
      console.error('Error sending emails. Captain:', capData, 'Passenger:', passData)
      return new Response(JSON.stringify({ error: 'Failed to send one or more emails', details: { capData, passData } }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
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
  path: '/api/send-inquiry',
}
