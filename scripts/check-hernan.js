import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wocubdteitbvvsprhuxm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvY3ViZHRlaXRidnZzcHJodXhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMDE4MjAsImV4cCI6MjA5MTc3NzgyMH0.s_gomCwK5OJAnKjZaw86W5Y11EVzzkBEKDshPJ5XAWA'

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  const { data } = await supabase.from('profiles').select('*').ilike('email', '%hernan%')
  console.log(data)
}

check()
