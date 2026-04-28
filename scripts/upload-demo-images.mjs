import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const supabase = createClient(
  'https://wocubdteitbvvsprhuxm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvY3ViZHRlaXRidnZzcHJodXhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMDE4MjAsImV4cCI6MjA5MTc3NzgyMH0.s_gomCwK5OJAnKjZaw86W5Y11EVzzkBEKDshPJ5XAWA'
)

const tripId = 'c4ef7c89-e389-47fa-9931-3054c716b2bb'

async function uploadImages() {
  const files = ['demo-1.png', 'demo-2.png', 'demo-3.png']
  const urls = []

  for (const file of files) {
    const filePath = join('public', file)
    const fileBuffer = readFileSync(filePath)
    const storagePath = `trips/${tripId}/${file}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('trip-images')
      .upload(storagePath, fileBuffer, {
        contentType: 'image/png',
        upsert: true
      })

    if (error) {
      console.error(`Upload error for ${file}:`, error.message)
      // Try public bucket
      const { data: publicUrl } = supabase.storage
        .from('trip-images')
        .getPublicUrl(storagePath)
      console.log(`Public URL (may exist): ${publicUrl.publicUrl}`)
      urls.push(publicUrl.publicUrl)
    } else {
      const { data: publicUrl } = supabase.storage
        .from('trip-images')
        .getPublicUrl(storagePath)
      urls.push(publicUrl.publicUrl)
      console.log(`✅ Uploaded ${file} → ${publicUrl.publicUrl}`)
    }
  }

  if (urls.length > 0) {
    // Check current images
    const { data: trip } = await supabase.from('trips').select('images').eq('id', tripId).single()
    console.log('Current images:', trip?.images)
    console.log('New URLs:', urls)
    console.log('\nPaste this SQL in Supabase SQL Editor to update:')
    console.log(`UPDATE trips SET images = ARRAY[${urls.map(u => `'${u}'`).join(', ')}] WHERE id = '${tripId}';`)
  }
}

uploadImages()
