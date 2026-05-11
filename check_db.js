import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = fs.readFileSync('.env', 'utf8')
const supabaseUrl = env.match(/VITE_SUPABASE_URL=(.*)/)[1]
const supabaseKey = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1]

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  const { data, error } = await supabase.from('profiles').select('*').in('email', ['haccorinti@yahoo.com.ar', 'hernanacco@gmail.com', 'haccorinti@naturgy.com.ar'])
  console.log('PROFILES:', data, error)
}
check()
