import { createClient } from '@supabase/supabase-js'

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const body = JSON.parse(event.body)
    
    // Mercado Pago sends different types of notifications. We care about 'payment'
    if (body.type === 'payment' || body.topic === 'payment') {
      const paymentId = body.data?.id
      if (!paymentId) return { statusCode: 200, body: 'No payment ID' }

      // 1. Fetch payment details from MP to verify status
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`
        }
      })
      const paymentData = await mpResponse.json()

      if (paymentData.status === 'approved') {
        const bookingId = paymentData.external_reference

        if (bookingId) {
          // 2. Update booking status in Supabase
          const supabaseUrl = process.env.VITE_SUPABASE_URL
          // Idealmente usar SERVICE_ROLE_KEY para evadir RLS en el backend
          const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
          const supabase = createClient(supabaseUrl, supabaseKey)

          const { error } = await supabase
            .from('bookings')
            .update({ status: 'paid' })
            .eq('id', bookingId)

          if (error) {
            console.error('Error updating booking:', error)
            return { statusCode: 500, body: 'Error updating database' }
          }
          
          console.log(`Booking ${bookingId} marked as PAID.`)
          // Acá podríamos disparar la lógica de send-ticket internamente
        }
      }
    }

    return { statusCode: 200, body: 'OK' }
  } catch (error) {
    console.error('Webhook error:', error)
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) }
  }
}

export const config = {
  path: '/api/mp-webhook',
}
