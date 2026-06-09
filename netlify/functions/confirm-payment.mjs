import { createClient } from '@supabase/supabase-js'

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const { bookingId, paymentId } = JSON.parse(event.body)

    if (!bookingId || !paymentId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing bookingId or paymentId' }) }
    }

    const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN
    if (!MP_ACCESS_TOKEN) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Payment gateway not configured' }) }
    }

    // 1. Verify payment status directly with Mercado Pago API
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`
      }
    })

    if (!mpResponse.ok) {
      const errData = await mpResponse.json()
      console.error('Mercado Pago verification failed:', errData)
      return { statusCode: 400, body: JSON.stringify({ error: 'Failed to verify payment with Mercado Pago', details: errData }) }
    }

    const paymentData = await mpResponse.json()

    // Ensure it is approved and belongs to this booking
    if (paymentData.status !== 'approved' || String(paymentData.external_reference) !== String(bookingId)) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ 
          error: 'Payment not approved or external reference mismatch', 
          status: paymentData.status, 
          ref: paymentData.external_reference 
        }) 
      }
    }

    // 2. Update booking status in Supabase
    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check current status to avoid duplicate emails
    const { data: currentBooking, error: checkErr } = await supabase
      .from('bookings')
      .select('status')
      .eq('id', bookingId)
      .single()

    if (checkErr) {
      console.error('Error checking booking status:', checkErr)
      return { statusCode: 500, body: 'Error checking database' }
    }

    if (currentBooking.status === 'confirmed' || currentBooking.status === 'completed') {
      return { statusCode: 200, body: JSON.stringify({ success: true, message: 'Already confirmed' }) }
    }

    const { error: updateErr } = await supabase
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('id', bookingId)

    if (updateErr) {
      console.error('Error updating booking status:', updateErr)
      return { statusCode: 500, body: 'Error updating database' }
    }

    console.log(`Booking ${bookingId} verified and marked as PAID via frontend fallback.`)

    // 3. Trigger ticket sending
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
        console.log('Ticket sent automatically from fallback.')
      } catch (emailErr) {
        console.error('Error triggering send-ticket from fallback:', emailErr)
      }
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) }
  } catch (error) {
    console.error('Confirm payment error:', error)
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) }
  }
}

export const config = {
  path: '/api/confirm-payment',
}
