import React, { useState } from 'react'
import { useTripWizardStore } from '../../../../stores/useTripWizardStore'
import { CheckCircle2, Navigation } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const Step10Finalize = () => {
  const { formData, resetWizard } = useTripWizardStore()
  const [isSaving, setIsSaving] = useState(false)
  const navigate = useNavigate()

  const handleCreate = async () => {
    setIsSaving(true)
    try {
      const { supabase } = await import('../../../../lib/supabase.js')
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        throw new Error('Debes estar autenticado para publicar.')
      }

      // Collect all images in one array for the `images` column
      const allImages = [
        formData.images_meta.portada,
        ...(formData.images_meta.camarote || []),
        ...(formData.images_meta.actividad || []),
        ...(formData.images_meta.comidas || []),
        ...(formData.images_meta.paisaje || [])
      ].filter(Boolean)

      const uploadedUrls = []
      
      for (const url of allImages) {
        if (url.startsWith('blob:')) {
           const response = await fetch(url)
           const blob = await response.blob()
           const ext = blob.type.split('/')[1] || 'jpg'
           const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
           
           const { error: uploadError } = await supabase.storage.from('trip-images').upload(fileName, blob)
           if (uploadError) throw uploadError
           
           const { data: { publicUrl } } = supabase.storage.from('trip-images').getPublicUrl(fileName)
           uploadedUrls.push(publicUrl)
        } else {
           uploadedUrls.push(url)
        }
      }

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
          // We don't abort, the trip is created, but dates failed
        }
      }

      resetWizard()
      navigate('/dashboard/travesias')
    } catch (err) {
      console.error('Error al publicar travesía:', err)
      alert(err.message || 'Ocurrió un error al intentar publicar. Revisa la consola.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="step-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '500px', textAlign: 'center' }}>
      
      <div style={{ width: '128px', height: '128px', backgroundColor: 'rgba(0, 180, 180, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-4)', position: 'relative' }}>
        <div style={{ width: '96px', height: '96px', backgroundColor: 'var(--color-primary-500)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 25px rgba(0, 180, 180, 0.2)' }} className="pulse-animation">
          <Navigation size={48} />
        </div>
        <div style={{ position: 'absolute', bottom: '8px', right: '8px', backgroundColor: 'var(--bg-primary)', borderRadius: '50%', padding: '4px', border: '2px solid var(--color-primary-500)' }}>
          <CheckCircle2 size={32} color="var(--color-accent-500)" />
        </div>
      </div>

      <div style={{ maxWidth: '32rem', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <h2 className="step-title" style={{ fontSize: '36px', fontWeight: 900, textAlign: 'center' }}>
          ¡Travesía completada!
        </h2>
        <p className="step-subtitle" style={{ fontWeight: 500 }}>
          Revisamos que toda la información principal está lista. Puedes editar los detalles más tarde o crear una vista previa para ver cómo lucirá para tus futuros huéspedes.
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', paddingTop: 'var(--space-8)' }}>
        <button className="btn btn--outline" style={{ height: '56px', padding: '0 var(--space-8)', fontSize: '18px', borderRadius: 'var(--radius-xl)' }}>
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
              Subiendo fotos...
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
