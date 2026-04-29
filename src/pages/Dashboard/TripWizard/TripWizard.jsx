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
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-background">
      
      {/* LEFT PANEL - PROGRES INDICATOR */}
      <div className="w-1/3 min-w-[320px] max-w-[400px] border-r border-border/50 bg-secondary/30 flex flex-col items-center justify-center p-8 relative">
        <div className="w-40 h-40 bg-accent text-accent-content rounded-full flex items-center justify-center shadow-lg shadow-accent/20 mb-8 transition-transform duration-500">
          <Compass className="w-20 h-20" />
        </div>
        
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-6 text-center">
          {isEditing ? 'Editar travesía' : 'Crear una travesía'}
        </h2>
        
        <div className="w-full max-w-[280px]">
          <div className="h-3 w-full bg-border rounded-full overflow-hidden mb-3 shadow-inner">
            <div 
              className="h-full bg-accent transition-all duration-700 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-center font-semibold text-primary">{currentStep}/{totalSteps}</p>
        </div>

        {/* Optional: Step dots */}
        <div className="absolute left-8 top-1/2 -translate-y-1/2 flex flex-col gap-4 hidden lg:flex">
          {STEPS_CONFIG.map((step) => (
            <div key={step.id} className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full transition-colors ${currentStep === step.id ? 'bg-accent scale-125' : currentStep > step.id ? 'bg-primary' : 'bg-border'}`} />
              <span className={`text-sm ${currentStep === step.id ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL - FORM CONTENT */}
      <div className="flex-1 flex flex-col bg-background relative h-full">
        
        {/* Step Content Area */}
        <div className="flex-1 overflow-y-auto px-10 py-12 scroll-smooth">
          <div className="max-w-2xl mx-auto w-full animate-in fade-in slide-in-from-right-4 duration-500">
            {renderStep()}
          </div>
        </div>

        {/* Global Navigation Footer */}
        <div className="w-full border-t border-border/50 px-10 py-6 bg-background/80 backdrop-blur-md flex items-center justify-between">
          <button
            onClick={currentStep === 1 ? () => navigate('/dashboard/travesias') : prevStep}
            className="btn btn-outline"
          >
            Atrás
          </button>
          
          <button
            onClick={nextStep}
            className="btn btn-primary"
          >
            Siguiente <ChevronRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>

    </div>
  )
}

export default TripWizard
