import React from 'react'
import { useTripWizardStore } from '../../../../stores/useTripWizardStore'
import { Plus, Trash2 } from 'lucide-react'

const PENSION_TYPES = [
  'Sin pensión',
  'Pensión completa',
  'Media pensión',
  'Todo incluido',
  'Desayuno',
  'Sólo comida/cena'
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="space-y-2">
        <h2 className="text-3xl font-bold bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
          Itinerario y Pensión
        </h2>
        <p className="text-muted-foreground text-lg">
          Detalla qué harán los pasajeros y si tendrán comidas a bordo.
        </p>
      </div>

      <div className="space-y-8">
        
        {/* Duración (Días y Noches) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="text-sm font-bold tracking-tight text-foreground/80 uppercase">
              Días de navegación
            </label>
            <input
              type="number"
              min="1"
              className="input input-bordered w-full text-lg font-bold"
              value={formData.duration_days}
              onChange={(e) => updateFormData({ duration_days: parseInt(e.target.value) || 1 })}
            />
          </div>
          <div className="space-y-3">
            <label className="text-sm font-bold tracking-tight text-foreground/80 uppercase">
              Noches a bordo
            </label>
            <input
              type="number"
              min="0"
              className="input input-bordered w-full text-lg font-bold"
              value={formData.duration_nights}
              onChange={(e) => updateFormData({ duration_nights: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>

        {/* Tipo de Pensión */}
        <div className="space-y-3 pt-6 border-t border-border/50">
          <label className="text-sm font-bold tracking-tight text-foreground/80 uppercase">
            Tipo de Pensión (Comidas)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {PENSION_TYPES.map((type) => (
              <label 
                key={type}
                className={`flex items-center justify-center p-3 rounded-xl border text-sm font-semibold cursor-pointer transition-all ${
                  formData.pension_type === type 
                  ? 'bg-accent/10 border-accent text-accent' 
                  : 'bg-secondary/20 border-border hover:border-accent/40'
                }`}
              >
                <input 
                  type="radio" 
                  name="pension" 
                  className="sr-only"
                  checked={formData.pension_type === type}
                  onChange={() => updateFormData({ pension_type: type })}
                />
                {type}
              </label>
            ))}
          </div>
        </div>

        {/* Itinerario Diario */}
        <div className="space-y-4 pt-6 border-t border-border/50">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold tracking-tight text-foreground/80 uppercase">
              Desglose día a día
            </label>
            <button 
              onClick={addDay}
              className="btn btn-sm btn-outline text-xs"
            >
              <Plus className="w-4 h-4 mr-1" /> Agregar Día
            </button>
          </div>

          <div className="space-y-4">
            {formData.itinerary.length === 0 && (
              <div className="text-center p-6 border-2 border-dashed border-border/60 rounded-2xl">
                <p className="text-muted-foreground mb-4">No has agregado descripciones por día.</p>
                <button onClick={addDay} className="btn btn-primary btn-sm">Empezar itinerario</button>
              </div>
            )}

            {formData.itinerary.map((item, index) => (
              <div key={index} className="flex gap-4 items-start group">
                <div className="min-w-[60px] h-12 bg-accent/10 rounded-xl flex items-center justify-center font-bold text-accent">
                  Día {item.day}
                </div>
                <div className="flex-1">
                  <textarea
                    className="textarea textarea-bordered w-full min-h-[80px]"
                    placeholder={`Describe las actividades, paradas o paisajes del día ${item.day}...`}
                    value={item.description}
                    onChange={(e) => handleItineraryChange(index, e.target.value)}
                  />
                </div>
                <button 
                  onClick={() => removeDay(index)}
                  className="btn btn-ghost btn-circle text-error/60 hover:text-error hover:bg-error/10 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Eliminar día"
                >
                  <Trash2 className="w-5 h-5" />
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
