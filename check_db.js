import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = fs.readFileSync('.env', 'utf8')
const supabaseUrl = env.match(/VITE_SUPABASE_URL=(.*)/)[1]
const supabaseKey = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1]

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  const { data, error } = await supabase.from('profiles').update({ role: 'admin' }).eq('email', 'haccorinti@yahoo.com.ar')
  console.log('UPDATE:', data, error)
  const { data: data2 } = await supabase.from('profiles').select('*').eq('email', 'haccorinti@yahoo.com.ar')
  console.log('NEW PROFILE:', data2)
}
check()
