import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle2, ChevronRight, Compass } from 'lucide-react'
import { useTripWizardStore } from '../../../stores/useTripWizardStore'

// Form Steps
import Step1Details from './steps/Step1Details'
import Step2Map from './steps/Step2Map'
import Step3Itinerary from './steps/Step3Itinerary'
import Step4Photos from './steps/Step4Photos'
import Step5Services from './steps/Step5Services'
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
  { id: 6, label: 'Precios' },
  { id: 7, label: 'Fechas' },
  { id: 8, label: 'Finalizar' }
]

const TripWizard = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentStep, totalSteps, nextStep, prevStep } = useTripWizardStore()
  const [errorMsg, setErrorMsg] = React.useState('')
  
  const isEditing = id && id !== 'nueva'

  const progressPercentage = (currentStep / totalSteps) * 100

  const renderStep = () => {
    switch(currentStep) {
      case 1: return <Step1Details />
      case 2: return <Step2Map />
      case 3: return <Step3Itinerary />
      case 4: return <Step4Photos />
      case 5: return <Step5Services />
      case 6: return <Step8Pricing />
      case 7: return <Step9Dates />
      case 8: return <Step10Finalize />
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
            
            <button
              onClick={() => {
                setErrorMsg('')
                
                if (currentStep === 4) {
                  const currentData = useTripWizardStore.getState().formData;
                  // Must have at least 5 photos
                  let count = currentData.images_meta.portada ? 1 : 0
                  ['camarote', 'actividad', 'comidas', 'paisaje'].forEach(cat => {
                    count += (currentData.images_meta[cat] || []).length
                  })
                  if (count < 5) {
                    setErrorMsg(`Debes subir al menos 5 fotos para continuar. Tienes ${count}.`)
                    return
                  }
                }
                if (currentStep === 6) {
                  const currentData = useTripWizardStore.getState().formData;
                  if (!currentData.price_per_person || currentData.price_per_person <= 0) {
                    setErrorMsg('Debes ingresar un precio por pasajero mayor a 0 para continuar.')
                    return
                  }
                }
                
                nextStep()
              }}
              className="btn btn--accent"
            >
              Siguiente <ChevronRight size={16} style={{ marginLeft: '8px' }} />
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}

export default TripWizard
