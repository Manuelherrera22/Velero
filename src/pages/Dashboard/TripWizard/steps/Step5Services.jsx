import React from 'react'
import { useTripWizardStore } from '../../../../stores/useTripWizardStore'
import { Anchor, HelpCircle, Plus } from 'lucide-react'

const AVAILABLE_SERVICES = [
  'Seguro',
  'Capitán',
  'Embarcación auxiliar',
  'Gastos de Amarre y Fondeo',
  'Combustible',
  'Comidas a Bordo',
  'Bebidas a Bordo',
  'Ropa de Cama',
  'Toallas',
  'Limpieza Final',
  'Equipo de snorkel'
]

const MOCK_BOATS = [
  { id: 1, name: 'Duende (Velero 34 pies)' }
]

const Step5Services = () => {
  const { formData, toggleService, updateFormData } = useTripWizardStore()

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="space-y-2">
        <h2 className="text-3xl font-bold bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
          Servicios y la Embarcación
        </h2>
        <p className="text-muted-foreground text-lg">
          Detalla exactamente qué incluye el precio y vincula el transporte.
        </p>
      </div>

      <div className="bg-secondary/10 border border-border/50 rounded-2xl p-6">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 pb-4 border-b border-border/50 font-bold text-xs uppercase tracking-tight text-foreground/70">
          <div className="col-span-8">Servicios</div>
          <div className="col-span-2 text-center text-primary">Incluidos</div>
          <div className="col-span-2 text-center text-error">Excluidos</div>
        </div>

        {/* Matrix rows */}
        <div className="max-h-[300px] overflow-y-auto pt-4 space-y-4 pr-2 custom-scrollbar">
          {AVAILABLE_SERVICES.map((service) => {
            const isIncluded = formData.included_services.includes(service)
            const isExcluded = formData.excluded_services.includes(service)

            return (
              <div key={service} className="grid grid-cols-12 gap-4 items-center group">
                <div className="col-span-8 font-medium text-foreground/90 group-hover:text-foreground transition-colors">
                  {service}
                </div>
                <div className="col-span-2 flex justify-center">
                  <input 
                    type="checkbox" 
                    className="checkbox checkbox-primary checkbox-sm rounded-md"
                    checked={isIncluded}
                    onChange={() => toggleService('included_services', service)}
                  />
                </div>
                <div className="col-span-2 flex justify-center">
                  <input 
                    type="checkbox" 
                    className="checkbox checkbox-error checkbox-sm rounded-md"
                    checked={isExcluded}
                    onChange={() => toggleService('excluded_services', service)}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Boat Selection */}
      <div className="space-y-4 pt-6 border-t border-border/50">
        <div className="flex items-center gap-2">
          <label className="text-sm font-bold tracking-tight text-foreground/80 uppercase">
            Embarcación *
          </label>
          <div className="tooltip" data-tip="El barco físico donde se realizará esta travesía">
            <HelpCircle className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>

        <select 
          className="select select-bordered w-full h-14 text-lg font-medium"
          value={formData.boat_id || ''}
          onChange={(e) => updateFormData({ boat_id: e.target.value })}
        >
          <option value="" disabled>Seleccione...</option>
          {MOCK_BOATS.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
          <option value="NEW" className="font-bold text-accent">
            ✨ Agregar nueva embarcación
          </option>
        </select>

        {formData.boat_id === 'NEW' && (
          <div className="animate-in slide-in-from-top-2 p-6 bg-accent/5 border border-accent/20 rounded-2xl mt-4">
            <h4 className="font-bold text-accent mb-2 flex items-center gap-2"><Anchor className="w-5 h-5"/> Crear Embarcación</h4>
            <p className="text-sm text-muted-foreground mb-4">Guarda la travesía temporalmente para agregar el barco nuevo en una pestaña externa, o completa el mini-formulario aquí (Coming Soon).</p>
            <button className="btn btn-sm btn-accent w-full">Configurar barco ahora</button>
          </div>
        )}

      </div>
    </div>
  )
}

export default Step5Services
