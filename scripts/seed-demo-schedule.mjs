import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://wocubdteitbvvsprhuxm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvY3ViZHRlaXRidnZzcHJodXhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMDE4MjAsImV4cCI6MjA5MTc3NzgyMH0.s_gomCwK5OJAnKjZaw86W5Y11EVzzkBEKDshPJ5XAWA'
)

async function seedDemoSchedule() {
  // 1. Find the "Atardecer Dorado en el Delta" trip
  const { data: trips, error: tripErr } = await supabase
    .from('trips')
    .select('id, title')
    .ilike('title', '%Atardecer%Delta%')
    .limit(1)

  if (tripErr || !trips?.length) {
    // Fallback: get the first trip
    const { data: fallback } = await supabase.from('trips').select('id, title').limit(1)
    if (!fallback?.length) { console.error('No trips found!'); return }
    trips.push(fallback[0])
  }

  const tripId = trips[0].id
  console.log(`Using trip: ${trips[0].title} (${tripId})`)

  // 2. Define demo schedule: 3 days × 3 time slots with varying prices
  const today = new Date()
  const dates = []

  for (let dayOffset = 1; dayOffset <= 3; dayOffset++) {
    const d = new Date(today)
    d.setDate(d.getDate() + dayOffset + (dayOffset === 1 ? 0 : dayOffset)) // spread out a bit
    const dateStr = d.toISOString().split('T')[0]

    // Morning - standard price (no override)
    dates.push({
      trip_id: tripId,
      date: dateStr,
      start_time: '10:00:00',
      end_time: '12:30:00',
      available_spots: 8,
      is_active: true,
      price_per_person_override: null, // Uses trip base price
      full_boat_price_override: null,
    })

    // Afternoon - slightly higher (popular in winter)
    dates.push({
      trip_id: tripId,
      date: dateStr,
      start_time: '14:00:00',
      end_time: '16:30:00',
      available_spots: 6,
      is_active: true,
      price_per_person_override: 32000,
      full_boat_price_override: 180000,
    })

    // Sunset - premium (high demand, atardecer)
    dates.push({
      trip_id: tripId,
      date: dateStr,
      start_time: '17:30:00',
      end_time: '20:00:00',
      available_spots: 4,
      is_active: true,
      price_per_person_override: 38000,
      full_boat_price_override: 220000,
    })
  }

  // 3. Insert into trip_dates
  const { data: inserted, error: insertErr } = await supabase
    .from('trip_dates')
    .insert(dates)
    .select()

  if (insertErr) {
    console.error('Insert error:', insertErr.message)
  } else {
    console.log(`✅ Inserted ${inserted.length} demo time slots!`)
    inserted.forEach(d => {
      const price = d.price_per_person_override ? ` → $${d.price_per_person_override.toLocaleString()}` : ' (base)'
      console.log(`   ${d.date} ${d.start_time.slice(0,5)}hs${price} (${d.available_spots} spots)`)
    })
  }
}

seedDemoSchedule()
