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
    // 1. TODO: API call to Supabase to save `formData` into `trips`
    // 2. TODO: Loop over `formData.custom_dates` and insert them into `trip_dates`
    
    // Simulating API lag
    setTimeout(() => {
      setIsSaving(false)
      resetWizard()
      navigate('/dashboard/travesias')
    }, 1500)
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-center justify-center min-h-[500px]">
      
      <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center mb-4 relative">
        <div className="w-24 h-24 bg-primary text-primary-content rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-primary/20">
          <Navigation className="w-12 h-12" />
        </div>
        <div className="absolute bottom-2 right-2 bg-background rounded-full p-1 border-2 border-primary">
          <CheckCircle2 className="w-8 h-8 text-accent" />
        </div>
      </div>

      <div className="text-center space-y-4 max-w-lg">
        <h2 className="text-4xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          ¡Travesía completada!
        </h2>
        <p className="text-lg text-muted-foreground font-medium">
          Revisamos que toda la información principal está lista. Puedes editar los detalles más tarde o crear una vista previa para ver cómo lucirá para tus futuros huéspedes.
        </p>
      </div>

      <div className="flex items-center gap-4 pt-8">
        <button className="btn btn-outline h-14 px-8 text-lg rounded-xl">
          Vista previa
        </button>
        <button 
          className="btn btn-primary h-14 px-12 text-lg rounded-xl shadow-xl shadow-primary/20 hover:-translate-y-1 transition-transform"
          onClick={handleCreate}
          disabled={isSaving}
        >
          {isSaving ? <span className="loading loading-spinner"></span> : 'Publicar Travesía'}
        </button>
      </div>

    </div>
  )
}

export default Step10Finalize
