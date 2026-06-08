// Netlify serverless function to send welcome email via Resend
export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { email, name, role } = await req.json()

    if (!email) {
      return new Response(JSON.stringify({ error: 'Missing email' }), {
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

    // Default configuration based on role
    let greeting = `¡Bienvenido a Kailu!`
    let bodyText = ''
    let buttonText = 'Entrar a Kailu'
    let ctaLink = 'https://kailu.travel/explorar'

    if (role === 'publisher') {
      greeting = `¡Bienvenido a Kailu!`
      bodyText = `
        <p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;color:#E2E8F0;font-weight:600;">
          Gracias por sumarte como capitán.
        </p>
        <p style="margin:0;font-size:16px;line-height:1.6;color:#E2E8F0;">
          Ya podés comenzar a completar tu perfil y publicar tus experiencias para que otros puedan descubrirlas, reservarlas y vivirlas.
        </p>
      `
      buttonText = 'Publicá tu primera experiencia'
      ctaLink = 'https://kailu.travel/dashboard'
    } else if (role === 'affiliate') {
      greeting = `¡Bienvenido a Kailu!`
      bodyText = `
        <p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;color:#E2E8F0;font-weight:600;">
          Ya podés comenzar a generar tus códigos QR y compartir experiencias con tu comunidad, clientes o huéspedes.
        </p>
        <p style="margin:0;font-size:16px;line-height:1.6;color:#E2E8F0;">
          Cada reserva realizada a través de tus recomendaciones quedará asociada a tu cuenta para que puedas realizar el seguimiento correspondiente.
        </p>
      `
      buttonText = 'Creá tu primer código QR'
      ctaLink = 'https://kailu.travel/afiliado'
    } else {
      // Passenger / general user
      greeting = `¡Bienvenido a Kailu!`
      bodyText = `
        <p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;color:#E2E8F0;font-weight:600;">
          Tu cuenta ya está activa.
        </p>
        <p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;color:#E2E8F0;">
          Creamos Kailu para acercarte experiencias que invitan a conectar con la naturaleza, descubrir nuevos lugares y compartir momentos memorables con otras personas.
        </p>
        <p style="margin:0;font-size:16px;line-height:1.6;color:#E2E8F0;">
          A partir de ahora podés explorar propuestas en distintos destinos y encontrar experiencias pensadas para disfrutar el entorno de una manera auténtica.
        </p>
      `
      buttonText = 'Entrá al momento'
      ctaLink = 'https://kailu.travel/explorar'
    }

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
      <h1 style="font-size:28px;margin:0;color:#26C6C6;font-weight:800;letter-spacing:-0.5px;">⛵ KAILU</h1>
      <p style="font-size:14px;color:#94A3B8;margin-top:4px;">Experiencias náuticas en Argentina</p>
    </div>

    <!-- Main Card -->
    <div style="background:rgba(30,41,59,0.8);border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;padding:32px;">
      <h2 style="font-size:24px;margin:0 0 20px 0;font-weight:700;color:#fff;">${greeting}</h2>
      
      <div style="margin-bottom:32px;line-height:1.6;">
        ${bodyText}
      </div>

      <!-- CTA Button -->
      <div style="text-align:center;">
        <a href="${ctaLink}" 
           style="display:inline-block;background:#26C6C6;color:#0A1628;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;box-shadow:0 4px 12px rgba(38,198,198,0.2);">
          ${buttonText}
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:32px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.06);">
      <p style="font-size:12px;color:#64748B;margin:0;">
        © ${new Date().getFullYear()} Kailu — Experiencias náuticas en Argentina
      </p>
      <p style="font-size:11px;color:#475569;margin:4px 0 0;">
        Este email fue enviado a ${email} porque te registraste en kailu.travel
      </p>
    </div>
  </div>
</body>
</html>`

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Kailu <onboarding@resend.dev>'
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject: `⛵ ¡Te damos la bienvenida a Kailu!`,
        html: htmlContent,
      }),
    })

    const resendData = await resendResponse.json()

    if (!resendResponse.ok) {
      console.error('Resend welcome error:', resendData)
      return new Response(JSON.stringify({ error: 'Failed to send welcome email', details: resendData }), {
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
  path: '/api/send-welcome',
}
