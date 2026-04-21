import React from 'react'
import { useTripWizardStore } from '../../../../stores/useTripWizardStore'
import { Info } from 'lucide-react'

const Step8Pricing = () => {
  const { formData, updateFormData } = useTripWizardStore()

  const handleTogglePaymentMethod = (method) => {
    const isPresent = formData.allowed_payment_methods.includes(method)
    updateFormData({
      allowed_payment_methods: isPresent 
        ? formData.allowed_payment_methods.filter(m => m !== method)
        : [...formData.allowed_payment_methods, method]
    })
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="space-y-2">
        <h2 className="text-3xl font-bold bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
          Precio y tripulantes
        </h2>
        <p className="text-muted-foreground text-lg">
          Configura tus tarifas base, límites de capacidad y métodos de cobro.
        </p>
      </div>

      <div className="space-y-8">
        
        {/* Precios */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-bold tracking-tight text-foreground/80 uppercase">
              Precio por pasajero
              <div className="tooltip" data-tip="El costo individual base al reservar lugares compartidos.">
                <Info className="w-4 h-4 text-muted-foreground" />
              </div>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">€</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input input-bordered w-full h-14 pl-10 text-lg font-bold"
                value={formData.price_per_person || ''}
                onChange={(e) => updateFormData({ price_per_person: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="space-y-3 relative">
            <div className="absolute -top-3 right-0">
              <label className="flex items-center cursor-pointer gap-2 bg-secondary/30 px-3 py-1 rounded-full border border-border/50">
                <span className="text-xs font-bold text-muted-foreground">Habilitar chárter</span>
                <input 
                  type="checkbox" 
                  className="toggle toggle-primary toggle-sm"
                  checked={formData.allow_full_boat}
                  onChange={(e) => updateFormData({ allow_full_boat: e.target.checked })}
                />
              </label>
            </div>

            <label className={`flex items-center gap-2 text-sm font-bold tracking-tight uppercase transition-colors ${formData.allow_full_boat ? 'text-foreground/80' : 'text-muted-foreground/50'}`}>
              Precio por barco completo
              <div className="tooltip" data-tip="El precio total si alguien reserva la exclusividad de todo el barco.">
                <Info className="w-4 h-4 text-muted-foreground" />
              </div>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">€</span>
              <input
                type="number"
                min="0"
                step="0.01"
                disabled={!formData.allow_full_boat}
                className="input input-bordered w-full h-14 pl-10 text-lg font-bold disabled:opacity-50"
                value={formData.full_boat_price || ''}
                onChange={(e) => updateFormData({ full_boat_price: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
        </div>

        {/* Descuentos Promocionales */}
        <div className="space-y-4 pt-6 border-t border-border/50">
          <label className="text-sm font-bold tracking-tight text-foreground/80 uppercase block">
            Descuento Promocional
          </label>
          <p className="text-sm text-muted-foreground mb-4">¿Querés ofrecer un porcentaje de descuento? La tarifa base aparecerá tachada para resaltar la oportunidad.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 relative">
              <label className="flex items-center gap-2 text-sm font-bold tracking-tight text-foreground/80 uppercase">
                Porcentaje de descuento
                <div className="tooltip" data-tip="Se aplicará este descuento sobre el precio base.">
                  <Info className="w-4 h-4 text-muted-foreground" />
                </div>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">%</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="input input-bordered w-full h-14 pl-10 text-lg font-bold"
                  value={formData.discount_percentage || ''}
                  onChange={(e) => updateFormData({ discount_percentage: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Límites de Pasajeros */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-border/50">
          <div className="space-y-3">
            <label className="text-sm font-bold tracking-tight text-foreground/80 uppercase">
              Mínimo de pasajeros por travesía *
            </label>
            <input
              type="number"
              min="1"
              className="input input-bordered w-full h-14 text-lg font-bold"
              value={formData.min_passengers || 1}
              onChange={(e) => updateFormData({ min_passengers: parseInt(e.target.value) || 1 })}
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold tracking-tight text-foreground/80 uppercase">
              Máximo de pasajeros por travesía *
            </label>
            <input
              type="number"
              min="1"
              className="input input-bordered w-full h-14 text-lg font-bold"
              value={formData.max_passengers || 6}
              onChange={(e) => updateFormData({ max_passengers: parseInt(e.target.value) || 6 })}
            />
          </div>
        </div>

        {/* Pagos y Cancelaciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-border/50">
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-bold tracking-tight text-foreground/80 uppercase">
              Métodos de pago permitidos
              <div className="tooltip" data-tip="Vías por las cuales podés recibir el dinero">
                <Info className="w-4 h-4 text-muted-foreground" />
              </div>
            </label>
            <div className="flex gap-4 items-center">
              <label className="flex items-center gap-2 cursor-pointer bg-secondary/20 px-4 py-3 border border-border/60 rounded-xl hover:border-primary/50 transition-colors">
                <input 
                  type="checkbox" 
                  className="checkbox checkbox-primary"
                  checked={formData.allowed_payment_methods.includes('PayPal')}
                  onChange={() => handleTogglePaymentMethod('PayPal')}
                />
                <span className="font-semibold">PayPal</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-secondary/20 px-4 py-3 border border-border/60 rounded-xl hover:border-primary/50 transition-colors">
                <input 
                  type="checkbox" 
                  className="checkbox checkbox-primary"
                  checked={formData.allowed_payment_methods.includes('Mercado Pago')}
                  onChange={() => handleTogglePaymentMethod('Mercado Pago')}
                />
                <span className="font-semibold">Mercado Pago</span>
              </label>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-bold tracking-tight text-foreground/80 uppercase">
              Política de cancelación
              <div className="tooltip" data-tip="Qué pasa si el pasajero cancela a último momento">
                <Info className="w-4 h-4 text-muted-foreground" />
              </div>
            </label>
            <select
              className="select select-bordered w-full h-14"
              value={formData.cancellation_policy || ''}
              onChange={(e) => updateFormData({ cancellation_policy: e.target.value })}
            >
              <option value="" disabled>Seleccione una política</option>
              <option value="flexible">Flexible (100% reembolso hasta 24hs antes)</option>
              <option value="moderada">Moderada (50% reembolso hasta 5 días antes)</option>
              <option value="estricta">Estricta (Sin reembolso)</option>
            </select>
          </div>
        </div>

        {/* Modalidad de cobro */}
        <div className="space-y-4 pt-6 border-t border-border/50">
          <label className="text-sm font-bold tracking-tight text-foreground/80 uppercase block mb-4">
            ¿Cómo quieres cobrar tu travesía?
          </label>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/20 cursor-pointer transition-colors w-fit pr-8">
              <input 
                type="radio" 
                name="payment_mode"
                className="radio radio-primary"
                checked={formData.requires_full_payment === true}
                onChange={() => updateFormData({ requires_full_payment: true })}
              />
              <span className="font-semibold select-none flex items-center gap-2">
                Pago Total Online
                <div className="tooltip" data-tip="Se le cobrará la totalidad del monto al momento de reservar.">
                  <Info className="w-4 h-4 text-muted-foreground/60" />
                </div>
              </span>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/20 cursor-pointer transition-colors w-fit pr-8">
              <input 
                type="radio" 
                name="payment_mode"
                className="radio radio-primary"
                checked={formData.requires_full_payment === false}
                onChange={() => updateFormData({ requires_full_payment: false })}
              />
              <span className="font-semibold select-none flex items-center gap-2">
                Reserva con Anticipo (Seña)
                <div className="tooltip" data-tip="El cliente paga online el anticipo (comisión Kailu + 3% servicio), y el saldo lo cubre a bordo.">
                  <Info className="w-4 h-4 text-muted-foreground/60" />
                </div>
              </span>
            </label>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Nota: Todos los cobros online incluyen una tasa de servicio del 3% procesada por la plataforma.
          </p>
        </div>

      </div>
    </div>
  )
}

export default Step8Pricing
