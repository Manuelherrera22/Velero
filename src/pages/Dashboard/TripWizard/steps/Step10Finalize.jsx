import React, { useState } from 'react'
import { useTripWizardStore } from '../../../../stores/useTripWizardStore'
import { CheckCircle2, Navigation } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../../lib/supabase.js'
import useAuthStore from '../../../../stores/authStore'

const Step10Finalize = () => {
  const { formData, resetWizard } = useTripWizardStore()
  const [isSaving, setIsSaving] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const navigate = useNavigate()

  const compressImage = async (blobUrl) => {
    return new Promise((resolve, reject) => {
      let isSettled = false;

      const timeoutId = setTimeout(() => {
        console.warn('[compressImage] Timeout reached, falling back to raw blob')
        fallbackToRaw();
      }, 5000);

      const fallbackToRaw = async () => {
        if (isSettled) return;
        isSettled = true;
        try {
          const controller = new AbortController();
          const fetchTimeout = setTimeout(() => controller.abort(), 5000);
          const res = await fetch(blobUrl, { signal: controller.signal });
          clearTimeout(fetchTimeout);
          const blob = await res.blob();
          resolve(blob);
        } catch (e) {
          reject(new Error("La imagen caducó o no pudo ser leída por inactividad. Por favor, vuelve al Paso 4 y súbela nuevamente."));
        }
      };

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

  // Upload a single image with retry logic for slow connections
  const uploadSingleImage = async (url, userId, attempt = 1) => {
    if (!url.startsWith('blob:')) return url
    const MAX_ATTEMPTS = 2
    const TIMEOUT_MS = 90000 // 90 seconds for slow connections

    try {
      return await Promise.race([
        new Promise(async (resolve, reject) => {
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
            
            if (uploadError) throw uploadError
            
            const { data } = supabase.storage
              .from('trip-images')
              .getPublicUrl(fileName)
              
            resolve(data.publicUrl)
          } catch (err) {
            reject(err)
          }
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Tiempo de espera agotado al subir una imagen.')), TIMEOUT_MS))
      ])
    } catch (err) {
      if (attempt < MAX_ATTEMPTS) {
        console.warn(`[uploadSingleImage] Intento ${attempt} falló, reintentando...`)
        setStatusMsg(`Reintentando subida de foto...`)
        return uploadSingleImage(url, userId, attempt + 1)
      }
      console.error('[uploadSingleImage] Failed after retries:', err)
      return null // Skip this image instead of crashing
    }
  }

  const handleCreate = async (isDraft = false) => {
    setIsSaving(true)
    setStatusMsg('Verificando sesión...')

    try {
      let activeUser = useAuthStore.getState().user;
      
      if (!activeUser) {
        // Fallback with Promise.race to avoid deadlock
        const getSessionWithTimeout = () => {
          return Promise.race([
            supabase.auth.getSession(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout de sesión al intentar recuperar usuario. Por favor, recargá la página (F5).')), 3000))
          ])
        }
        const { data: { session } } = await getSessionWithTimeout()
        activeUser = session?.user
      }

      if (!activeUser) {
        throw new Error('Debes estar autenticado para publicar. Por favor, iniciá sesión nuevamente.')
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

        // Upload blob images SEQUENTIALLY to avoid saturating slow connections
        const uploadedBlobs = []
        for (let i = 0; i < blobImages.length; i++) {
          setStatusMsg(`Subiendo foto ${i + 1} de ${blobImages.length}...`)
          const result = await uploadSingleImage(blobImages[i], activeUser.id)
          if (result) uploadedBlobs.push(result)
        }

        uploadedUrls = [...uploadedBlobs, ...regularImages]
      }

      // Validate boat_id: must be a valid UUID or null
      const isValidUUID = (val) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)
      const cleanBoatId = (formData.boat_id && formData.boat_id !== 'NEW' && isValidUUID(String(formData.boat_id))) ? formData.boat_id : null

      setStatusMsg('Guardando travesía...')

      // Clean metadata: ONLY store fields that don't have their own DB column.
      // Previously we stored the entire formData here, causing massive payloads
      // and DB timeouts. Fields like custom_dates, addons, images_meta, etc. are
      // already saved in their own tables (trip_dates, trip_addons, images column).
      const cleanMetadata = {
        role_in_activity: formData.role_in_activity || 'capitan',
        duration_days: formData.duration_days || 1,
        duration_nights: formData.duration_nights || 0,
        exact_location: formData.exact_location || '',
        location_reference: formData.location_reference || '',
        coordinates: formData.coordinates || null,
        custom_services: formData.custom_services || [],
        allow_individual_booking: formData.allow_individual_booking,
        images_meta: {
          portada: uploadedUrls[0] || '',
          camarote: (formData.images_meta.camarote || []).filter(u => !u.startsWith('blob:')),
          actividad: (formData.images_meta.actividad || []).filter(u => !u.startsWith('blob:')),
          comidas: (formData.images_meta.comidas || []).filter(u => !u.startsWith('blob:')),
          paisaje: (formData.images_meta.paisaje || []).filter(u => !u.startsWith('blob:'))
        }
      }

      // 1. Save trip (with 120s timeout for slow connections)
      const tripData = {
        captain_id: activeUser.id,
        boat_id: cleanBoatId,
        title: formData.title || 'Travesía sin título',
        description: formData.description,
        location: formData.location || 'Sin ubicación',
        capacity: formData.max_passengers || 6,
        price_per_person: formData.price_per_person || 0,
        full_boat_price: formData.full_boat_price || null,
        allow_full_boat: formData.allow_full_boat || false,
        min_passengers: formData.min_passengers || 1,
        max_passengers: formData.max_passengers || 6,
        pension_type: formData.pension_type || null,
        included_services: formData.included_services || [],
        excluded_services: formData.excluded_services || [],
        allowed_payment_methods: formData.allowed_payment_methods || ['PayPal'],
        requires_full_payment: formData.requires_full_payment !== false,
        deposit_percentage: formData.deposit_percentage ?? 100.0,
        navigation_zone_id: formData.navigation_zone_id || null,
        itinerary: formData.itinerary || [],
        status: isDraft ? 'draft' : 'published',
        images: uploadedUrls,
        tags: formData.tags || [],
        metadata: cleanMetadata
      }

      let tripInsertPromise;
      let isUpdateFallback = false;

      if (formData.id) {
        // Use maybeSingle instead of single so it doesn't throw if 0 rows are updated
        tripInsertPromise = supabase
          .from('trips')
          .update(tripData)
          .eq('id', formData.id)
          .select()
          .maybeSingle()
      } else {
        tripInsertPromise = supabase
          .from('trips')
          .insert(tripData)
          .select()
          .single()
      }

      let { data: trip, error: tripError } = await Promise.race([
        tripInsertPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('La base de datos tardó demasiado. Verificá tu conexión a internet e intentá nuevamente.')), 120000))
      ])

      if (tripError) throw tripError

      // If we tried to update but the trip was deleted from DB (returns no data, no error)
      if (!trip && formData.id) {
        console.warn('Trip not found for update, falling back to insert')
        isUpdateFallback = true
        const { data: newTrip, error: insertError } = await supabase
          .from('trips')
          .insert(tripData)
          .select()
          .single()
        
        if (insertError) throw insertError
        trip = newTrip
      }

      // 2. Save dates
      if (formData.custom_dates && formData.custom_dates.length > 0) {
        setStatusMsg('Guardando fechas...')
        
        const existingDates = []
        const newDates = []

        formData.custom_dates.forEach(d => {
          const isExisting = typeof d.id === 'string' && d.id.length > 20;
          const dateObj = {
            trip_id: trip.id,
            date: d.departure_date,
            start_time: d.departure_time ? (d.departure_time.length <= 5 ? `${d.departure_time}:00` : d.departure_time) : '08:00:00',
            end_time: d.arrival_time ? (d.arrival_time.length <= 5 ? `${d.arrival_time}:00` : d.arrival_time) : null,
            available_spots: d.available_spots !== undefined ? d.available_spots : (formData.max_passengers || 6),
            blocked_spots: d.blocked_spots || 0,
            price_per_person_override: d.price_per_person !== undefined ? d.price_per_person : null,
            full_boat_price_override: d.full_boat_price !== undefined ? d.full_boat_price : null,
            is_active: true
          }
          if (isExisting) {
            dateObj.id = d.id;
            existingDates.push(dateObj);
          } else {
            newDates.push(dateObj);
          }
        });

        // Borrar fechas eliminadas (solo si no estamos editando o si estamos editando y permitimos borrar)
        if (formData.id) {
          const keepIds = existingDates.map(d => d.id)
          if (keepIds.length > 0) {
            await supabase.from('trip_dates').delete().eq('trip_id', trip.id).not('id', 'in', `(${keepIds.join(',')})`)
          } else {
            await supabase.from('trip_dates').delete().eq('trip_id', trip.id)
          }
        }

        const datePromises = []
        if (existingDates.length > 0) {
          datePromises.push(supabase.from('trip_dates').upsert(existingDates))
        }
        if (newDates.length > 0) {
          datePromises.push(supabase.from('trip_dates').insert(newDates))
        }

        const { error: datesError } = await Promise.race([
          Promise.all(datePromises),
          new Promise((_, reject) => setTimeout(() => reject(new Error('La base de datos tardó demasiado al guardar las fechas. Verificá tu conexión.')), 60000))
        ])

        if (datesError) {
          console.error('Error guardando fechas:', datesError)
        }
      }

      // 3. Save addons
      if (formData.addons && formData.addons.length > 0) {
        setStatusMsg('Guardando adicionales...')

        // Delete all existing addons for this trip first
        if (formData.id) {
          await supabase.from('trip_addons').delete().eq('trip_id', trip.id)
        }

        // Insert all current addons
        const addonsToInsert = formData.addons.map(a => ({
          trip_id: trip.id,
          name: a.name,
          description: a.description || '',
          price: a.price,
          is_active: true
        }))

        const { error: addonsError } = await supabase
          .from('trip_addons')
          .insert(addonsToInsert)

        if (addonsError) {
          console.error('Error guardando adicionales:', addonsError)
        }
      } else if (formData.id) {
        // If editing and no addons, remove all existing ones
        await supabase.from('trip_addons').delete().eq('trip_id', trip.id)
      }

      setStatusMsg('¡Publicada con éxito!')
      resetWizard()
      navigate(`/travesia/${trip.id}`)
    } catch (err) {
      console.error('Error al publicar travesía:', err)
      
      let msg = 'Error desconocido'
      try {
        if (err?.message) msg = err.message
        else if (typeof err === 'string') msg = err
        else msg = JSON.stringify(err)
      } catch (e) {
        msg = 'No se pudo leer el detalle del error'
      }
      
      alert(`Ocurrió un problema al guardar: ${msg}\nPor favor, contacta a soporte si el problema persiste.`)
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
          onClick={() => setShowPreview(true)}
          disabled={isSaving}
        >
          Vista previa
        </button>
        <button 
          className="btn btn--outline"
          style={{ height: '56px', padding: '0 var(--space-8)', fontSize: '18px', borderRadius: 'var(--radius-xl)', borderColor: 'var(--color-primary-500)', color: 'var(--color-primary-500)' }}
          onClick={() => handleCreate(true)}
          disabled={isSaving}
        >
          {isSaving ? '...' : 'Guardar Borrador'}
        </button>
        <button 
          className="btn btn--accent"
          style={{ height: '56px', padding: '0 var(--space-12)', fontSize: '18px', borderRadius: 'var(--radius-xl)', boxShadow: '0 10px 25px rgba(0, 180, 180, 0.2)' }}
          onClick={() => handleCreate(false)}
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

      {showPreview && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: 'var(--radius-2xl)',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '32px',
            position: 'relative',
            textAlign: 'left'
          }}>
            <button 
              onClick={() => setShowPreview(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '8px' }}
            >
              Cerrar
            </button>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--color-primary-500)' }}>Vista Previa de tu Travesía</h2>
            
            {formData.images_meta?.portada ? (
              <img src={formData.images_meta.portada} alt="Portada" style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '16px', marginBottom: '24px' }} />
            ) : (
              <div style={{ width: '100%', height: '160px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <p style={{ color: 'var(--text-muted)' }}>Sin foto de portada</p>
              </div>
            )}
            
            <h3 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>{formData.title || 'Travesía sin título'}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Navigation size={18} /> {formData.location || 'Sin ubicación seleccionada'}
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              {(() => {
                const isFullBoatOnly = formData.allow_individual_booking === false || !(formData.price_per_person > 0);
                const priceToUse = isFullBoatOnly ? (formData.full_boat_price || 0) : (formData.price_per_person || 0);
                const priceLabel = isFullBoatOnly ? 'Precio por barco' : 'Precio por persona';

                return (
                  <div style={{ backgroundColor: 'rgba(0,180,180,0.1)', padding: '16px', borderRadius: '12px' }}>
                    <p style={{ fontSize: '12px', color: 'var(--color-accent-400)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>{priceLabel}</p>
                    {formData.discount_percentage > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <p style={{ fontSize: '24px', fontWeight: 'bold' }}>
                          $ {(priceToUse * (1 - formData.discount_percentage / 100)).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                          $ {Number(priceToUse).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    ) : (
                      <p style={{ fontSize: '24px', fontWeight: 'bold' }}>
                        $ {Number(priceToUse).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>
                );
              })()}
              <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>Capacidad</p>
                <p style={{ fontSize: '24px', fontWeight: 'bold' }}>Hasta {formData.max_passengers || 6} pas.</p>
              </div>
            </div>

            <h4 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Descripción</h4>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '24px' }}>{formData.description || 'Sin descripción'}</p>

            <button 
              className="btn btn--primary" 
              style={{ width: '100%', height: '56px', fontSize: '18px', borderRadius: '12px' }}
              onClick={() => setShowPreview(false)}
            >
              Continuar editando
            </button>
          </div>
        </div>
      )}
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
