import React from 'react'
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { CheckCircle2, ChevronRight, Compass, Loader, Upload } from 'lucide-react'
import { useTripWizardStore } from '../../../stores/useTripWizardStore'
import useBoatStore from '../../../stores/boatStore'
import useAuthStore from '../../../stores/authStore'
import supabase from '../../../lib/supabase'

// Form Steps
import Step1Details from './steps/Step1Details'
import Step2Map from './steps/Step2Map'
import Step3Itinerary from './steps/Step3Itinerary'
import Step4Photos from './steps/Step4Photos'
import Step5Services from './steps/Step5Services'
import Step6Addons from './steps/Step6Addons'
import Step8Pricing from './steps/Step8Pricing'
import Step9Dates from './steps/Step9Dates'
import Step10Finalize from './steps/Step10Finalize'

import './TripWizard.css'

const STEPS_CONFIG = [
  { id: 1, label: 'Detalles' },
  { id: 2, label: 'Ubicación' },
  { id: 3, label: 'Itinerario' },
  { id: 4, label: 'Fotos' },
  { id: 5, label: 'Servicios' },
  { id: 6, label: 'Adicionales' },
  { id: 7, label: 'Precios' },
  { id: 8, label: 'Fechas' },
  { id: 9, label: 'Finalizar' }
]

const TripWizard = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentStep, totalSteps, nextStep, prevStep, pendingUploads } = useTripWizardStore()
  const hasPendingPhotos = useTripWizardStore(s => s.hasPendingPhotos)
  const [errorMsg, setErrorMsg] = React.useState('')
  const [draftSaveStatus, setDraftSaveStatus] = React.useState('') // '', 'saving', 'saved', 'error'
  
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const copyFromId = location.state?.copyFromId
  const initialStep = parseInt(searchParams.get('step')) || location.state?.initialStep || null
  const isEditing = id && id !== 'nueva'
  const isCopying = !!copyFromId
  const [isLoadingTrip, setIsLoadingTrip] = React.useState(isEditing || isCopying)

  // Auto-save draft to Supabase when step changes (so progress is NEVER lost)
  const saveDraftToServer = React.useCallback(async () => {
    try {
      const user = useAuthStore.getState().user
      if (!user) return

      const formData = useTripWizardStore.getState().formData
      
      // Only save if there's meaningful data (title or photos)
      if (!formData.title && !formData.images_meta?.portada) return

      setDraftSaveStatus('saving')

      // Collect only real (non-blob) image URLs
      const images = formData.images_meta || {}
      const stripBlobs = (arr) => (arr || []).filter(u => typeof u === 'string' && !u.startsWith('blob:'))
      const realImages = [
        (typeof images.portada === 'string' && !images.portada.startsWith('blob:')) ? images.portada : null,
        ...stripBlobs(images.camarote),
        ...stripBlobs(images.actividad),
        ...stripBlobs(images.comidas),
        ...stripBlobs(images.paisaje)
      ].filter(Boolean)

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
          portada: realImages[0] || '',
          camarote: stripBlobs(images.camarote),
          actividad: stripBlobs(images.actividad),
          comidas: stripBlobs(images.comidas),
          paisaje: stripBlobs(images.paisaje)
        }
      }

      const isValidUUID = (val) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)
      const cleanBoatId = (formData.boat_id && formData.boat_id !== 'NEW' && isValidUUID(String(formData.boat_id))) ? formData.boat_id : null

      const draftData = {
        captain_id: user.id,
        boat_id: cleanBoatId,
        title: formData.title || 'Borrador sin título',
        description: formData.description || '',
        location: formData.location || '',
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
        status: 'draft',
        images: realImages,
        tags: formData.tags || [],
        metadata: cleanMetadata
      }

      const existingId = formData.id
      if (existingId) {
        await supabase.from('trips').update(draftData).eq('id', existingId)
      } else {
        const { data } = await supabase.from('trips').insert(draftData).select('id').single()
        if (data?.id) {
          // Store the draft ID so future saves update instead of insert
          useTripWizardStore.getState().updateFormData({ id: data.id })
        }
      }
      setDraftSaveStatus('saved')
      setTimeout(() => setDraftSaveStatus(''), 2000)
    } catch (err) {
      console.warn('[AutoSave] Draft save failed:', err)
      setDraftSaveStatus('error')
      setTimeout(() => setDraftSaveStatus(''), 3000)
    }
  }, [])

  React.useEffect(() => {
    if (isEditing || isCopying) {
      const loadTripForEdit = async () => {
        try {
          setIsLoadingTrip(true)
          const targetId = isEditing ? id : copyFromId
          
          // Fetch trip
          const { data: trip, error: tripError } = await supabase
            .from('trips')
            .select('*')
            .eq('id', targetId)
            .single()
            
          if (tripError) throw tripError

          // Fetch dates
          const { data: dates } = await supabase
            .from('trip_dates')
            .select('*')
            .eq('trip_id', targetId)

          // Fetch addons
          const { data: addons } = await supabase
            .from('trip_addons')
            .select('*')
            .eq('trip_id', targetId)
            .eq('is_active', true)
            
          if (isEditing) {
            // Check for active bookings
            const { count } = await supabase
              .from('bookings')
              .select('*', { count: 'exact', head: true })
              .eq('trip_id', targetId)
              .in('status', ['pending', 'confirmed', 'completed'])

            useTripWizardStore.getState().initForEdit(trip, dates, count > 0, addons)
          } else {
            useTripWizardStore.getState().copyFromTrip(trip, dates, addons)
          }
        } catch (error) {
          console.error("Error loading trip data:", error)
          setErrorMsg("Error cargando los datos de la travesía. Por favor, intenta de nuevo.")
        } finally {
          setIsLoadingTrip(false)
          // Jump to requested step if specified via ?step=N or state.initialStep
          if (initialStep && initialStep >= 1 && initialStep <= totalSteps) {
            setTimeout(() => useTripWizardStore.getState().setStep(initialStep), 50)
          }
        }
      }
      loadTripForEdit()
    } else {
      useTripWizardStore.getState().resetWizard()
    }

    // Prefetch boats so they are ready by Step 5
    useBoatStore.getState().fetchMyBoats()
  }, [id, isEditing, isCopying, copyFromId])

  const scrollRef = React.useRef(null)

  // Scroll to top when changing steps
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentStep])

  // Auto-save draft when changing steps (after step 2 to have meaningful data)
  const prevStepRef = React.useRef(currentStep)
  React.useEffect(() => {
    if (prevStepRef.current !== currentStep && currentStep > 2) {
      saveDraftToServer()
    }
    prevStepRef.current = currentStep
  }, [currentStep, saveDraftToServer])

  const progressPercentage = (currentStep / totalSteps) * 100
  const photosStillUploading = pendingUploads > 0 || (typeof hasPendingPhotos === 'function' && hasPendingPhotos())

  if (isLoadingTrip) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '1rem', color: 'var(--text-secondary)' }}>
        <Loader size={32} className="spin" />
        <p>Cargando travesía...</p>
      </div>
    )
  }

  const renderStep = () => {
    switch(currentStep) {
      case 1: return <Step1Details />
      case 2: return <Step2Map />
      case 3: return <Step3Itinerary />
      case 4: return <Step4Photos />
      case 5: return <Step5Services />
      case 6: return <Step6Addons />
      case 7: return <Step8Pricing />
      case 8: return <Step9Dates />
      case 9: return <Step10Finalize />
      default:
        return <div>Paso {currentStep} en construcción...</div>
    }
  }

  return (
    <div className="wizard-layout">
      
      {/* LEFT PANEL - PROGRES INDICATOR */}
      <div className="wizard-sidebar">
        <div className="wizard-sidebar__icon">
          <Compass size={36} />
        </div>
        
        <h2 className="wizard-sidebar__title">
          {isEditing ? 'Editar travesía' : 'Crear una travesía'}
        </h2>
        
        <div className="wizard-sidebar__progress-wrapper">
          <div className="wizard-sidebar__progress-bar">
            <div 
              className="wizard-sidebar__progress-fill"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="wizard-sidebar__progress-text">{currentStep}/{totalSteps}</p>
        </div>

        {/* Step dots */}
        <div className="wizard-sidebar__steps">
          {STEPS_CONFIG.map((step) => (
            <div key={step.id} className="wizard-sidebar__step-item">
              <div className={`wizard-sidebar__step-dot ${
                currentStep === step.id ? 'wizard-sidebar__step-dot--active' : 
                currentStep > step.id ? 'wizard-sidebar__step-dot--completed' : ''
              }`} />
              <span className={`wizard-sidebar__step-label ${
                currentStep === step.id ? 'wizard-sidebar__step-label--active' : ''
              }`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {/* Auto-save status indicator */}
        {draftSaveStatus && (
          <div style={{ marginTop: 'var(--space-4)', fontSize: '12px', textAlign: 'center', padding: '6px 12px', borderRadius: '8px',
            backgroundColor: draftSaveStatus === 'saved' ? 'rgba(34,197,94,0.1)' : draftSaveStatus === 'saving' ? 'rgba(0,180,180,0.1)' : 'rgba(239,68,68,0.1)',
            color: draftSaveStatus === 'saved' ? '#22c55e' : draftSaveStatus === 'saving' ? 'var(--color-primary-500)' : '#ef4444'
          }}>
            {draftSaveStatus === 'saving' && '💾 Guardando borrador...'}
            {draftSaveStatus === 'saved' && '✅ Borrador guardado'}
            {draftSaveStatus === 'error' && '⚠️ No se pudo guardar borrador'}
          </div>
        )}
      </div>

      {/* RIGHT PANEL - FORM CONTENT */}
      <div className="wizard-content">
        
        {/* Step Content Area */}
        <div className="wizard-content__scroll" ref={scrollRef}>
          <div className="wizard-content__inner">
            {renderStep()}
          </div>
        </div>

        {/* Global Navigation Footer */}
        <div className="wizard-footer" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {errorMsg && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, textAlign: 'center', width: '100%' }}>
              {errorMsg}
            </div>
          )}

          {/* Photo upload blocking banner */}
          {currentStep === 4 && photosStillUploading && (
            <div style={{ backgroundColor: 'rgba(0, 180, 180, 0.1)', border: '1px solid rgba(0, 180, 180, 0.3)', color: 'var(--color-primary-600)', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, textAlign: 'center', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Upload size={16} className="spin" />
              Esperá a que terminen de subir las fotos antes de continuar... ({pendingUploads} pendiente{pendingUploads !== 1 ? 's' : ''})
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <button
              onClick={() => {
                setErrorMsg('')
                currentStep === 1 ? navigate('/dashboard/travesias') : prevStep()
              }}
              className="btn btn--outline"
            >
              Atrás
            </button>
            
            {currentStep < totalSteps && (
              <button
                onClick={() => {
                  setErrorMsg('')
                  
                  // Block navigation if photos are still uploading
                  if (currentStep === 4 && photosStillUploading) {
                    setErrorMsg('Las fotos aún se están subiendo. Esperá a que terminen antes de continuar.')
                    return
                  }

                  if (currentStep === 4) {
                    const currentCount = useTripWizardStore.getState().getTotalPhotos();
                    if (currentCount < 5) {
                      setErrorMsg(`Debes subir al menos 5 fotos para continuar. Tienes ${currentCount}.`)
                      return
                    }
                  }
                  if (currentStep === 7) {
                    const currentData = useTripWizardStore.getState().formData;
                    const hasPassengerPrice = currentData.price_per_person > 0;
                    const hasFullBoatPrice = currentData.allow_full_boat && currentData.full_boat_price > 0;

                    if (!hasPassengerPrice && !hasFullBoatPrice) {
                      setErrorMsg('Debes ingresar al menos un precio por pasajero o un precio por barco completo mayor a 0.')
                      return
                    }
                  }
                  
                  nextStep()
                }}
                className="btn btn--accent"
                disabled={currentStep === 4 && photosStillUploading}
                style={currentStep === 4 && photosStillUploading ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
              >
                Siguiente <ChevronRight size={16} style={{ marginLeft: '8px' }} />
              </button>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}

export default TripWizard

