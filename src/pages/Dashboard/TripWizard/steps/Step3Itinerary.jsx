import React from 'react'
import { useTripWizardStore } from '../../../../stores/useTripWizardStore'
import { Plus, Trash2 } from 'lucide-react'

const PENSION_TYPES = [
  'Sin pensión',
  'Pensión completa',
  'Media pensión',
  'Todo incluido',
  'Desayuno',
  'Sólo comida/cena',
  'Snack y bebida'
]

const Step3Itinerary = () => {
  const { formData, updateFormData } = useTripWizardStore()

  const handleItineraryChange = (index, value) => {
    const newItinerary = [...formData.itinerary]
    newItinerary[index].description = value
    updateFormData({ itinerary: newItinerary })
  }

  const addDay = () => {
    updateFormData({ 
      itinerary: [...formData.itinerary, { day: formData.itinerary.length + 1, description: '' }],
      duration_days: formData.itinerary.length + 1
    })
  }

  const removeDay = (indexToRemove) => {
    const newItinerary = formData.itinerary.filter((_, idx) => idx !== indexToRemove)
    // Reindex remaining days
    const reindexed = newItinerary.map((item, idx) => ({ ...item, day: idx + 1 }))
    updateFormData({ 
      itinerary: reindexed,
      duration_days: reindexed.length
    })
  }

  return (
    <div className="step-container">
      
      <div className="step-header">
        <h2 className="step-title">
          Itinerario y Pensión
        </h2>
        <p className="step-subtitle">
          Detalla qué harán los pasajeros y si tendrán comidas a bordo.
        </p>
      </div>

      <div className="step-form">
        
        {/* Duración (Días y Noches) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <div className="form-group" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <label className="form-group__label" style={{ marginBottom: '16px', display: 'block' }}>
              Cantidad de días
            </label>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <button 
                type="button"
                className="btn btn--outline" 
                style={{ width: '40px', height: '40px', padding: 0, borderRadius: '50%' }}
                onClick={() => updateFormData({ duration_days: Math.max(1, formData.duration_days - 1) })}
              >
                -
              </button>
              <input
                type="number"
                min="1"
                className="input-control"
                style={{ fontWeight: 'bold', textAlign: 'center', width: '80px', fontSize: '18px' }}
                value={formData.duration_days}
                onChange={(e) => updateFormData({ duration_days: parseInt(e.target.value) || 1 })}
              />
              <button 
                type="button"
                className="btn btn--outline" 
                style={{ width: '40px', height: '40px', padding: 0, borderRadius: '50%' }}
                onClick={() => updateFormData({ duration_days: formData.duration_days + 1 })}
              >
                +
              </button>
            </div>
          </div>
          <div className="form-group" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <label className="form-group__label" style={{ marginBottom: '16px', display: 'block' }}>
              Cantidad de noches
            </label>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <button 
                type="button"
                className="btn btn--outline" 
                style={{ width: '40px', height: '40px', padding: 0, borderRadius: '50%' }}
                onClick={() => updateFormData({ duration_nights: Math.max(0, formData.duration_nights - 1) })}
              >
                -
              </button>
              <input
                type="number"
                min="0"
                className="input-control"
                style={{ fontWeight: 'bold', textAlign: 'center', width: '80px', fontSize: '18px' }}
                value={formData.duration_nights}
                onChange={(e) => updateFormData({ duration_nights: parseInt(e.target.value) || 0 })}
              />
              <button 
                type="button"
                className="btn btn--outline" 
                style={{ width: '40px', height: '40px', padding: 0, borderRadius: '50%' }}
                onClick={() => updateFormData({ duration_nights: formData.duration_nights + 1 })}
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Tipo de Pensión */}
        <div className="step-section">
          <label className="form-group__label">
            Tipo de Pensión (Comidas)
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-3)' }}>
            {PENSION_TYPES.map((type) => (
              <label 
                key={type}
                className={`tag-btn ${formData.pension_type === type ? 'tag-btn--active' : ''}`}
                style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px' }}
              >
                <input 
                  type="radio" 
                  name="pension" 
                  style={{ display: 'none' }}
                  checked={formData.pension_type === type}
                  onChange={() => updateFormData({ pension_type: type })}
                />
                {type}
              </label>
            ))}
          </div>
        </div>

        {/* Itinerario Diario */}
        <div className="step-section">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
            <label className="form-group__label" style={{ marginBottom: 0 }}>
              Desglose día a día
            </label>
            <button 
              onClick={addDay}
              className="btn btn--outline"
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              <Plus size={16} style={{ marginRight: '4px' }} /> Agregar Día
            </button>
          </div>
          <p className="step-subtitle" style={{ fontSize: '14px', marginBottom: 'var(--space-4)', padding: '8px 12px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', borderLeft: '4px solid var(--color-primary-500)' }}>
            <strong>💡 Opcional:</strong> Puedes agregar descripciones detalladas por día si lo deseas para dar más contexto a tus pasajeros.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {formData.itinerary.length === 0 && (
              <div style={{ textAlign: 'center', padding: 'var(--space-6)', border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-xl)' }}>
                <p className="step-subtitle" style={{ marginBottom: 'var(--space-4)' }}>No has agregado descripciones por día.</p>
                <button onClick={addDay} className="btn btn--accent">Empezar itinerario</button>
              </div>
            )}

            {formData.itinerary.map((item, index) => (
              <div key={index} style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
                <div style={{ 
                  minWidth: '60px', 
                  height: '48px', 
                  backgroundColor: 'rgba(0, 180, 180, 0.1)', 
                  borderRadius: 'var(--radius-lg)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontWeight: 'bold', 
                  color: 'var(--color-accent-500)' 
                }}>
                  Día {item.day}
                </div>
                <div style={{ flex: 1 }}>
                  <textarea
                    className="input-control"
                    style={{ minHeight: '80px', resize: 'vertical' }}
                    placeholder={`Describe las actividades, paradas o paisajes del día ${item.day}...`}
                    value={item.description}
                    onChange={(e) => handleItineraryChange(index, e.target.value)}
                  />
                </div>
                <button 
                  onClick={() => removeDay(index)}
                  className="btn btn--ghost"
                  style={{ color: 'var(--color-error-500)', padding: '8px' }}
                  title="Eliminar día"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

export default Step3Itinerary
