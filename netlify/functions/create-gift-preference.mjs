import { MercadoPagoConfig, Preference } from 'mercadopago'
import { createClient } from '@supabase/supabase-js'

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const { amount, buyerEmail, recipientName, senderName, message } = JSON.parse(event.body)

    if (!amount || !buyerEmail) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing amount or email' }) }
    }

    // Validate amount
    const validAmounts = [50000, 100000, 200000]
    if (!validAmounts.includes(Number(amount))) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid amount' }) }
    }

    // Generate unique gift card code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = 'KGC-'
    for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)]
    code += '-'
    for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)]

    // Create gift card in Supabase
    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: giftCard, error: insertError } = await supabase
      .from('gift_cards')
      .insert({
        code,
        amount: Number(amount),
        status: 'pending',
        buyer_email: buyerEmail,
        recipient_name: recipientName || null,
        sender_name: senderName || null,
        message: message || null,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating gift card:', insertError)
      return { statusCode: 500, body: JSON.stringify({ error: 'Error creating gift card' }) }
    }

    const origin = event.headers.origin || 'https://kailu.travel'

    // Bypass for testing WhatsApp and Confirmation Page flow without real money
    if (buyerEmail.toLowerCase() === 'test@kailu.travel') {
      await supabase
        .from('gift_cards')
        .update({ status: 'confirmed' })
        .eq('id', giftCard.id)
        
      return {
        statusCode: 200,
        body: JSON.stringify({ init_point: `${origin}/gift-cards/confirmacion?id=${giftCard.id}` })
      }
    }

    // Create Mercado Pago preference
    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN
    })

    const preference = new Preference(client)

    const formatPrice = (p) => `$${Number(p).toLocaleString('es-AR')}`

    const body = {
      items: [
        {
          id: giftCard.id,
          title: `Gift Card Kailu — ${formatPrice(amount)}`,
          quantity: 1,
          unit_price: Number(amount),
          currency_id: 'ARS',
        }
      ],
      payer: {
        email: buyerEmail,
      },
      back_urls: {
        success: `${origin}/gift-cards/confirmacion?id=${giftCard.id}&status=approved`,
        pending: `${origin}/gift-cards/confirmacion?id=${giftCard.id}&status=pending`,
        failure: `${origin}/gift-cards?error=payment_failed`,
      },
      auto_return: 'approved',
      external_reference: `gc_${giftCard.id}`,
      metadata: {
        type: 'gift_card',
        gift_card_id: giftCard.id,
      },
      ...(origin.includes('localhost') ? {} : { notification_url: `${origin}/api/mp-webhook` })
    }

    const result = await preference.create({ body })

    return {
      statusCode: 200,
      body: JSON.stringify({ init_point: result.init_point, id: result.id, giftCardId: giftCard.id })
    }
  } catch (error) {
    console.error('Error creating gift preference:', error)
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) }
  }
}

export const config = {
  path: '/api/create-gift-preference',
}
