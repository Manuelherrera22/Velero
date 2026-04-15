import React, { useState } from 'react'
import { useTripWizardStore } from '../../../../stores/useTripWizardStore'
import { Calendar, Clock, Info, Trash2 } from 'lucide-react'

const Step9Dates = () => {
  const { formData, updateFormData } = useTripWizardStore()
  
  // Local state for the "New Date Form" before pushing it to the global array
  const [newDate, setNewDate] = useState({
    departure_date: '',
    departure_time: '',
    arrival_date: '',
    arrival_time: '',
    price_per_person: formData.price_per_person || 0,
    full_boat_price: formData.full_boat_price || 0
  })

  const handleAddDate = () => {
    // Validate minimal fields
    if (!newDate.departure_date || !newDate.arrival_date) return

    updateFormData({
      custom_dates: [...formData.custom_dates, { ...newDate, id: Date.now() }]
    })

    // Reset local to base
    setNewDate({
      departure_date: '',
      departure_time: '',
      arrival_date: '',
      arrival_time: '',
      price_per_person: formData.price_per_person || 0,
      full_boat_price: formData.full_boat_price || 0
    })
  }

  const handleRemoveDate = (id) => {
    updateFormData({
      custom_dates: formData.custom_dates.filter(d => d.id !== id)
    })
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="space-y-2">
        <h2 className="text-3xl font-bold bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
          Agregar fechas a la travesía
        </h2>
        <p className="text-muted-foreground text-lg">
          Planifica en el calendario cuándo saldrás y, si lo deseas, ajusta precios especiales por fecha.
        </p>
      </div>

      <div className="space-y-6">
        
        {/* Date Ingestion Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Salida */}
          <div className="space-y-3 bg-secondary/20 p-4 rounded-xl border border-border/50">
            <label className="flex items-center gap-2 text-sm font-bold tracking-tight text-foreground/80 uppercase">
              Fecha y hora de salida
              <Info className="w-4 h-4 text-muted-foreground" />
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="date"
                  className="input input-bordered w-full pl-10"
                  value={newDate.departure_date}
                  onChange={(e) => setNewDate({ ...newDate, departure_date: e.target.value })}
                />
              </div>
              <div className="relative w-32">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="time"
                  className="input input-bordered w-full pl-10"
                  value={newDate.departure_time}
                  onChange={(e) => setNewDate({ ...newDate, departure_time: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Llegada */}
          <div className="space-y-3 bg-secondary/20 p-4 rounded-xl border border-border/50">
            <label className="flex items-center gap-2 text-sm font-bold tracking-tight text-foreground/80 uppercase">
              Fecha y hora de llegada
              <Info className="w-4 h-4 text-muted-foreground" />
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="date"
                  className="input input-bordered w-full pl-10"
                  value={newDate.arrival_date}
                  onChange={(e) => setNewDate({ ...newDate, arrival_date: e.target.value })}
                />
              </div>
              <div className="relative w-32">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="time"
                  className="input input-bordered w-full pl-10"
                  value={newDate.arrival_time}
                  onChange={(e) => setNewDate({ ...newDate, arrival_time: e.target.value })}
                />
              </div>
            </div>
          </div>

        </div>

        {/* Dynamic Pricing and Submit for Date */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-2">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase">Precio por Pasajero (Opcional)</label>
            <input 
              type="number"
              className="input input-bordered w-full font-bold text-lg"
              value={newDate.price_per_person}
              onChange={(e) => setNewDate({ ...newDate, price_per_person: parseFloat(e.target.value) || 0 })}
            />
          </div>
          
          <div className="space-y-2">
            <label className={`text-xs font-bold text-muted-foreground uppercase ${!formData.allow_full_boat && 'opacity-50'}`}>Precio Barco Entero</label>
            <input 
              type="number"
              disabled={!formData.allow_full_boat}
              className="input input-bordered w-full font-bold text-lg disabled:opacity-50"
              value={newDate.full_boat_price}
              onChange={(e) => setNewDate({ ...newDate, full_boat_price: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <button 
            className="btn btn-primary h-12"
            onClick={handleAddDate}
            disabled={!newDate.departure_date || !newDate.arrival_date}
          >
            Añadir esta fecha
          </button>
        </div>

        {/* Table of added dates */}
        <div className="bg-secondary/10 border border-border/50 rounded-2xl p-6 mt-8">
          <h3 className="font-bold text-lg mb-4 text-foreground/80 border-b border-border/50 pb-2">Fechas añadidas</h3>
          
          {formData.custom_dates.length === 0 ? (
            <p className="text-center text-muted-foreground/60 py-8">
              Aún no creaste fechas para esta travesía.
            </p>
          ) : (
            <div className="space-y-3">
              {formData.custom_dates.map(date => (
                <div key={date.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-background border border-border/50 rounded-xl group hover:border-accent/40 transition-colors">
                  <div className="space-y-1 md:w-2/3">
                    <p className="font-bold text-foreground">
                      Del {date.departure_date} al {date.arrival_date}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Salida: {date.departure_time || '--:--'} | Llegada: {date.arrival_time || '--:--'}
                    </p>
                  </div>
                  <div className="flex items-center gap-6 mt-4 md:mt-0">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground font-bold uppercase">Pasajero</p>
                      <p className="font-bold text-primary">€ {date.price_per_person}</p>
                    </div>
                    {formData.allow_full_boat && (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground font-bold uppercase">Barco</p>
                        <p className="font-bold text-accent">€ {date.full_boat_price}</p>
                      </div>
                    )}
                    <button 
                      onClick={() => handleRemoveDate(date.id)}
                      className="btn btn-ghost btn-circle text-error/60 hover:text-error hover:bg-error/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-5 h-5"/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default Step9Dates
