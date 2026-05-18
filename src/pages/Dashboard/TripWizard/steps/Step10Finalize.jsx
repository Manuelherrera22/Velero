import React, { useState } from 'react'
import { useTripWizardStore } from '../../../../stores/useTripWizardStore'
import { CheckCircle2, Navigation } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../../lib/supabase.js'

const Step10Finalize = () => {
  const { formData, resetWizard } = useTripWizardStore()
  const [isSaving, setIsSaving] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const navigate = useNavigate()

  const compressImage = async (blobUrl) => {
    return new Promise((resolve, reject) => {
      let isSettled = false;

      const fallbackToRaw = async () => {
        if (isSettled) return;
        isSettled = true;
        try {
          const res = await fetch(blobUrl);
          const blob = await res.blob();
          resolve(blob);
        } catch (e) {
          reject(e);
        }
      };

      const timeoutId = setTimeout(() => {
        console.warn('[compressImage] Timeout reached, falling back to raw blob')
        fallbackToRaw();
      }, 5000);

      const img = new Image()
      img.onload = () => {
        if (isSettled) return;
        clearTimeout(timeoutId);
        try {
          const MAX_WIDTH = 1200
          const MAX_HEIGHT = 1200
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width
              width = MAX_WIDTH
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height
              height = MAX_HEIGHT
            }
          }

          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)
          
          canvas.toBlob((blob) => {
            if (isSettled) return;
            isSettled = true;
            if (blob) resolve(blob)
            else fallbackToRaw()
          }, 'image/jpeg', 0.8)
        } catch (e) {
          fallbackToRaw()
        }
      }
      img.onerror = () => {
        clearTimeout(timeoutId);
        fallbackToRaw();
      }
      img.src = blobUrl
    })
  }

  // Upload a single image with a 15-second timeout
  const uploadSingleImage = async (url, userId) => {
    if (!url.startsWith('blob:')) return url

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    try {
      const blob = await compressImage(url)
      const ext = blob.type === 'image/png' ? 'png' : 'jpg'
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
      
      const { error: uploadError } = await supabase.storage
        .from('trip-images')
        .upload(fileName, blob, {
          contentType: blob.type || 'image/jpeg',
          upsert: true
        })
      
      clearTimeout(timeout)
      if (uploadError) throw uploadError
      
      const { data: { publicUrl } } = supabase.storage.from('trip-images').getPublicUrl(fileName)
      return publicUrl
    } catch (e) {
      clearTimeout(timeout)
      console.error('[uploadSingleImage] Failed:', e)
      return null // skip this image instead of crashing everything
    }
  }

  const handleCreate = async () => {
    setIsSaving(true)
    setStatusMsg('Verificando sesión...')

    // Global 60-second timeout
    const globalTimeout = setTimeout(() => {
      setIsSaving(false)
      setStatusMsg('')
      alert('El proceso tardó demasiado. Revisá tu conexión a internet e intentá de nuevo. Si el problema persiste, contacta soporte.')
    }, 60000)

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        throw new Error('Debes estar autenticado para publicar.')
      }

      setStatusMsg('Preparando imágenes...')

      // Collect all images
      const allImages = [
        formData.images_meta.portada,
        ...(formData.images_meta.camarote || []),
        ...(formData.images_meta.actividad || []),
        ...(formData.images_meta.comidas || []),
        ...(formData.images_meta.paisaje || [])
      ].filter(Boolean)

      let uploadedUrls = []

      if (allImages.length > 0) {
        const blobImages = allImages.filter(u => u.startsWith('blob:'))
        const regularImages = allImages.filter(u => !u.startsWith('blob:'))

        if (blobImages.length > 0) {
          setStatusMsg(`Subiendo ${blobImages.length} foto(s)...`)
        }

        // Upload blob images one by one with status updates
        const uploadedBlobs = []
        for (let i = 0; i < blobImages.length; i++) {
          setStatusMsg(`Subiendo foto ${i + 1} de ${blobImages.length}...`)
          const result = await uploadSingleImage(blobImages[i], user.id)
          if (result) uploadedBlobs.push(result)
        }

        uploadedUrls = [...uploadedBlobs, ...regularImages]
      }

      setStatusMsg('Guardando travesía...')

      // 1. Save trip
      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .insert({
          captain_id: user.id,
          boat_id: formData.boat_id || null,
          title: formData.title || 'Travesía sin título',
          description: formData.description,
          location: formData.location || 'Sin ubicación',
          capacity: formData.max_passengers || 6,
          price_per_person: formData.price_per_person || 0,
          status: 'published',
          images: uploadedUrls,
          tags: formData.tags || [],
          metadata: formData
        })
        .select()
        .single()

      if (tripError) throw tripError

      // 2. Save dates
      if (formData.custom_dates && formData.custom_dates.length > 0) {
        setStatusMsg('Guardando fechas...')
        const datesToInsert = formData.custom_dates.map(d => ({
          trip_id: trip.id,
          date: d.departure_date,
          start_time: d.departure_time ? `${d.departure_time}:00` : '08:00:00',
          end_time: d.arrival_time ? `${d.arrival_time}:00` : null,
          available_spots: formData.max_passengers || 6
        }))

        const { error: datesError } = await supabase
          .from('trip_dates')
          .insert(datesToInsert)

        if (datesError) {
          console.error('Error guardando fechas:', datesError)
        }
      }

      clearTimeout(globalTimeout)
      setStatusMsg('¡Publicada con éxito!')
      resetWizard()
      navigate('/dashboard/travesias')
    } catch (err) {
      clearTimeout(globalTimeout)
      console.error('Error al publicar travesía:', err)
      const msg = err?.message || JSON.stringify(err) || 'Error desconocido'
      alert(`Error al publicar: ${msg}`)
    } finally {
      setIsSaving(false)
      setStatusMsg('')
    }
  }

  return (
    <div className="step-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '500px', textAlign: 'center' }}>
      
      <div style={{ width: '128px', height: '128px', backgroundColor: 'rgba(0, 180, 180, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-4)', position: 'relative' }}>
        <div style={{ width: '96px', height: '96px', backgroundColor: 'var(--color-primary-500)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 25px rgba(0, 180, 180, 0.2)' }} className={isSaving ? 'pulse-animation' : ''}>
          <Navigation size={48} />
        </div>
        <div style={{ position: 'absolute', bottom: '8px', right: '8px', backgroundColor: 'var(--bg-primary)', borderRadius: '50%', padding: '4px', border: '2px solid var(--color-primary-500)' }}>
          <CheckCircle2 size={32} color="var(--color-accent-500)" />
        </div>
      </div>

      <div style={{ maxWidth: '32rem', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <h2 className="step-title" style={{ fontSize: '36px', fontWeight: 900, textAlign: 'center' }}>
          {isSaving ? 'Publicando Travesía...' : '¡Travesía completada!'}
        </h2>
        <p className="step-subtitle" style={{ fontWeight: 500 }}>
          {isSaving 
            ? (statusMsg || 'Procesando...') 
            : 'Revisamos que toda la información principal está lista. Puedes editar los detalles más tarde o crear una vista previa para ver cómo lucirá para tus futuros huéspedes.'}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', paddingTop: 'var(--space-8)' }}>
        <button 
          className="btn btn--outline" 
          style={{ height: '56px', padding: '0 var(--space-8)', fontSize: '18px', borderRadius: 'var(--radius-xl)' }}
          onClick={() => alert("La vista previa estará disponible en la próxima actualización.")}
          disabled={isSaving}
        >
          Vista previa
        </button>
        <button 
          className="btn btn--accent"
          style={{ height: '56px', padding: '0 var(--space-12)', fontSize: '18px', borderRadius: 'var(--radius-xl)', boxShadow: '0 10px 25px rgba(0, 180, 180, 0.2)' }}
          onClick={handleCreate}
          disabled={isSaving}
        >
          {isSaving ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="loading-spinner" style={{ width: '20px', height: '20px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block' }}></span> 
              {statusMsg || 'Procesando...'}
            </span>
          ) : 'Publicar Travesía'}
        </button>
      </div>
      <style>{`
        @keyframes pulse-custom {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: .8; transform: scale(0.95); }
        }
        .pulse-animation {
          animation: pulse-custom 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .loading-spinner {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  )
}

export default Step10Finalize
