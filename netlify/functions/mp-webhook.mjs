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
            .update({ status: 'confirmed' })
            .eq('id', bookingId)

          if (error) {
            console.error('Error updating booking:', error)
            return { statusCode: 500, body: 'Error updating database' }
          }
          
          console.log(`Booking ${bookingId} marked as PAID.`)
          
          // Fetch booking details to send the ticket
          const { data: bookingDetails } = await supabase
            .from('bookings')
            .select('*, trip:trips(*), trip_date:trip_dates(*)')
            .eq('id', bookingId)
            .single()

          if (bookingDetails) {
            try {
              const protocol = event.headers['x-forwarded-proto'] || 'https'
              const host = event.headers.host
              await fetch(`${protocol}://${host}/api/send-ticket`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  bookingId: bookingId,
                  trip: bookingDetails.trip?.title,
                  date: bookingDetails.trip_date ? { date: bookingDetails.trip_date.date, start_time: bookingDetails.trip_date.start_time } : null,
                  email: bookingDetails.guest_email || bookingDetails.metadata?.contact?.email,
                  name: bookingDetails.guest_name || bookingDetails.metadata?.contact?.name,
                  guests: bookingDetails.quantity,
                  total: bookingDetails.total,
                  currency: bookingDetails.metadata?.currency || 'ARS'
                })
              })
              console.log('Ticket sent automatically from webhook.')
            } catch (emailErr) {
              console.error('Error triggering send-ticket from webhook:', emailErr)
            }
          }
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
