import React from 'react'
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { CheckCircle2, ChevronRight, Compass, Loader } from 'lucide-react'
import { useTripWizardStore } from '../../../stores/useTripWizardStore'
import useBoatStore from '../../../stores/boatStore'
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
  const { currentStep, totalSteps, nextStep, prevStep } = useTripWizardStore()
  const [errorMsg, setErrorMsg] = React.useState('')
  
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const copyFromId = location.state?.copyFromId
  const initialStep = parseInt(searchParams.get('step')) || location.state?.initialStep || null
  const isEditing = id && id !== 'nueva'
  const isCopying = !!copyFromId
  const [isLoadingTrip, setIsLoadingTrip] = React.useState(isEditing || isCopying)

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

  // Scroll to top when changing steps
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentStep])

  const progressPercentage = (currentStep / totalSteps) * 100

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
      </div>

      {/* RIGHT PANEL - FORM CONTENT */}
      <div className="wizard-content">
        
        {/* Step Content Area */}
        <div className="wizard-content__scroll">
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
