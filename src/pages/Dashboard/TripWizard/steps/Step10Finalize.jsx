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
          {isSaving ? <span className="loading-spinner" style={{ width: '24px', height: '24px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block' }}></span> : 'Publicar Travesía'}
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
