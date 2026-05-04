import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wocubdteitbvvsprhuxm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvY3ViZHRlaXRidnZzcHJodXhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMDE4MjAsImV4cCI6MjA5MTc3NzgyMH0.s_gomCwK5OJAnKjZaw86W5Y11EVzzkBEKDshPJ5XAWA'

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixCapitan() {
  // Login
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'capitan@kailu.travel',
    password: 'Kailu2026!'
  })

  if (authError) {
    console.error('Login failed:', authError.message)
    return
  }

  console.log('Logged in successfully.')

  // Update profile
  const { data, error } = await supabase
    .from('profiles')
    .update({ role: 'publisher', full_name: 'Hernan Capitan' })
    .eq('id', authData.user.id)
    .select()

  if (error) {
    console.error('Update failed:', error.message)
  } else {
    console.log('Profile updated successfully to publisher:', data)
  }
}

fixCapitan()
