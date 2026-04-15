import React from 'react'
import { useTripWizardStore } from '../../../../stores/useTripWizardStore'
import { MapPin, Navigation } from 'lucide-react'

// Note: React Leaflet would go here, we are using a mockup representation 
// of the map for now until coordinates are fully managed.

const Step2Map = () => {
  const { formData, updateFormData } = useTripWizardStore()

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="space-y-2">
        <h2 className="text-3xl font-bold bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
          Marquemos el rumbo
        </h2>
        <p className="text-muted-foreground text-lg">
          Muestra en el mapa interactivo desde dónde zarparán los pasajeros y la zona de navegación.
        </p>
      </div>

      <div className="space-y-6">
        
        {/* Ubicación Genérica */}
        <div className="space-y-3">
          <label className="text-sm font-bold tracking-tight text-foreground/80 uppercase">
            Ciudad o Región *
          </label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              className="input input-bordered w-full h-14 pl-12 text-lg"
              placeholder="Ej: Buenos Aires, Río de la Plata"
              value={formData.location}
              onChange={(e) => updateFormData({ location: e.target.value })}
            />
          </div>
          <p className="text-xs text-muted-foreground">Esta será la información pública general antes de reservar.</p>
        </div>

        {/* Mapa interactivo (Mockup) */}
        <div className="space-y-3 pt-6 border-t border-border/50">
          <label className="text-sm font-bold tracking-tight text-foreground/80 uppercase">
            Ubicación exacta de embarque (Privado)
          </label>
          <p className="text-sm text-muted-foreground mb-4">Haz clic en el mapa para marcar el muelle o puerto. Esta ubicación exacta solo se compartirá con quienes realicen la reserva.</p>
          
          <div className="w-full h-[350px] bg-secondary/30 rounded-2xl border-2 border-border/50 relative overflow-hidden flex items-center justify-center group cursor-pointer hover:border-accent/40 transition-colors">
            
            {/* Visual placeholder for Map */}
            <div className="absolute inset-0 opacity-20 bg-[url('https://maps.wikimedia.org/osm-intl/12/1392/2483.png')] bg-cover bg-center"></div>
            
            <div className="z-10 flex flex-col items-center gap-3">
              <div className="p-4 bg-background/80 backdrop-blur rounded-full shadow-lg text-primary group-hover:text-accent transition-colors group-hover:scale-110 duration-300">
                <Navigation className="w-8 h-8" />
              </div>
              <span className="font-semibold text-foreground/80 bg-background/50 px-3 py-1 rounded backdrop-blur">
                Hacer clic para marcar el PIN
              </span>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}

export default Step2Map
