import { MercadoPagoConfig, Preference } from 'mercadopago'

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const { bookingId, title, price, email, name } = JSON.parse(event.body)
    
    const unitPrice = Number(price)

    const client = new MercadoPagoConfig({ 
      accessToken: process.env.MP_ACCESS_TOKEN 
    })
    
    const preference = new Preference(client)
    
    const origin = event.headers.origin || 'https://kailu.com.ar'

    const body = {
      items: [
        {
          id: bookingId,
          title: `Travesía Kailu: ${title}`,
          quantity: 1,
          unit_price: unitPrice,
          currency_id: 'ARS',
        }
      ],
      payer: {
        email: email,
        name: name,
      },
      back_urls: {
        // Redirige a una página de éxito (usaremos la página principal o el dashboard por ahora)
        success: `${origin}/mis-viajes?payment=success`,
        pending: `${origin}/mis-viajes?payment=pending`,
        failure: `${origin}/checkout/${bookingId.split('-')[0]}?error=payment_failed`, // Simplified failure route
      },
      auto_return: 'approved',
      external_reference: bookingId,
      // notification_url: `${origin}/api/mp-webhook`, // Descomentar al tener el dominio definitivo
    }

    const result = await preference.create({ body })

    return {
      statusCode: 200,
      body: JSON.stringify({ init_point: result.init_point, id: result.id })
    }
  } catch (error) {
    console.error('Error creating preference:', error)
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) }
  }
}
