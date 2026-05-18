import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing credentials")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function run() {
  console.log('Testing connection...')
  // Fake blob equivalent in node
  const blob = new Blob(["Hello, world!"], { type: "text/plain" })
  console.log('Uploading test file...')
  const { data, error } = await supabase.storage.from('trip-images').upload('test.txt', blob, { contentType: 'text/plain', upsert: true })
  
  if (error) {
    console.error('Upload Error:', error)
  } else {
    console.log('Upload Success:', data)
  }
}
run()
