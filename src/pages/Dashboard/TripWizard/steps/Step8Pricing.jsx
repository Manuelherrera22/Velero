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
    <div className="step-container">
      
      <div className="step-header">
        <h2 className="step-title">
          Precio y tripulantes
        </h2>
        <p className="step-subtitle">
          Configura tus tarifas base, límites de capacidad y métodos de cobro.
        </p>
      </div>

      <div className="step-form">
        
        {/* Precios */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
          <div className="form-group">
            <label className="form-group__label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              Precio por pasajero
              <div title="El costo individual base al reservar lugares compartidos." style={{ cursor: 'help' }}>
                <Info size={16} color="var(--text-muted)" />
              </div>
            </label>
            <div className="input-with-icon">
              <span className="input-icon" style={{ fontWeight: 'bold' }}>$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input-control"
                style={{ paddingLeft: '40px', fontWeight: 'bold' }}
                value={formData.price_per_person || ''}
                onChange={(e) => updateFormData({ price_per_person: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="form-group" style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-12px', right: 0, zIndex: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '4px 12px', borderRadius: '9999px', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)' }}>Habilitar chárter</span>
                <input 
                  type="checkbox" 
                  style={{ width: '32px', height: '16px', accentColor: 'var(--color-primary-500)' }}
                  checked={formData.allow_full_boat}
                  onChange={(e) => updateFormData({ allow_full_boat: e.target.checked })}
                />
              </label>
            </div>

            <label className="form-group__label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: formData.allow_full_boat ? 'var(--text-primary)' : 'var(--text-muted)', transition: 'color 0.3s ease' }}>
              Precio por barco completo
              <div title="El precio total si alguien reserva la exclusividad de todo el barco." style={{ cursor: 'help' }}>
                <Info size={16} color="var(--text-muted)" />
              </div>
            </label>
            <div className="input-with-icon">
              <span className="input-icon" style={{ fontWeight: 'bold' }}>$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                disabled={!formData.allow_full_boat}
                className="input-control"
                style={{ paddingLeft: '40px', fontWeight: 'bold', opacity: formData.allow_full_boat ? 1 : 0.5 }}
                value={formData.full_boat_price || ''}
                onChange={(e) => updateFormData({ full_boat_price: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
        </div>

        {/* Descuentos Promocionales */}
        <div className="step-section">
          <label className="form-group__label">
            Descuento Promocional
          </label>
          <p className="step-subtitle" style={{ fontSize: '14px', marginBottom: '16px' }}>¿Querés ofrecer un porcentaje de descuento? La tarifa base aparecerá tachada para resaltar la oportunidad.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
            <div className="form-group">
              <label className="form-group__label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                Porcentaje de descuento
                <div title="Se aplicará este descuento sobre el precio base." style={{ cursor: 'help' }}>
                  <Info size={16} color="var(--text-muted)" />
                </div>
              </label>
              <div className="input-with-icon">
                <span className="input-icon" style={{ fontWeight: 'bold' }}>%</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="input-control"
                  style={{ paddingLeft: '40px', fontWeight: 'bold' }}
                  value={formData.discount_percentage || ''}
                  onChange={(e) => updateFormData({ discount_percentage: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Límites de Pasajeros */}
        <div className="step-section" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
          <div className="form-group">
            <label className="form-group__label">
              Mínimo de pasajeros por travesía *
            </label>
            <input
              type="number"
              min="1"
              className="input-control"
              style={{ fontWeight: 'bold' }}
              value={formData.min_passengers || 1}
              onChange={(e) => updateFormData({ min_passengers: parseInt(e.target.value) || 1 })}
            />
          </div>

          <div className="form-group">
            <label className="form-group__label">
              Máximo de pasajeros por travesía *
            </label>
            <input
              type="number"
              min="1"
              className="input-control"
              style={{ fontWeight: 'bold' }}
              value={formData.max_passengers || 6}
              onChange={(e) => updateFormData({ max_passengers: parseInt(e.target.value) || 6 })}
            />
          </div>
        </div>

        {/* Pagos y Cancelaciones */}
        <div className="step-section" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
          <div className="form-group">
            <label className="form-group__label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              Métodos de pago permitidos
              <div title="Vías por las cuales podés recibir el dinero" style={{ cursor: 'help' }}>
                <Info size={16} color="var(--text-muted)" />
              </div>
            </label>
            <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '12px 16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)' }}>
                <input 
                  type="checkbox" 
                  style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary-500)' }}
                  checked={formData.allowed_payment_methods.includes('PayPal')}
                  onChange={() => handleTogglePaymentMethod('PayPal')}
                />
                <span style={{ fontWeight: 600 }}>PayPal</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '12px 16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)' }}>
                <input 
                  type="checkbox" 
                  style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary-500)' }}
                  checked={formData.allowed_payment_methods.includes('Mercado Pago')}
                  onChange={() => handleTogglePaymentMethod('Mercado Pago')}
                />
                <span style={{ fontWeight: 600 }}>Mercado Pago</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label className="form-group__label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              Política de cancelación
              <div title="Qué pasa si el pasajero cancela a último momento" style={{ cursor: 'help' }}>
                <Info size={16} color="var(--text-muted)" />
              </div>
            </label>
            <select
              className="input-control"
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
        <div className="step-section">
          <label className="form-group__label" style={{ marginBottom: '16px' }}>
            ¿Cómo quieres cobrar tu travesía?
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: '12px', borderRadius: 'var(--radius-xl)', cursor: 'pointer', transition: 'background-color 0.3s ease', width: 'fit-content', paddingRight: '32px' }} className="payment-mode-hover">
              <input 
                type="radio" 
                name="payment_mode"
                style={{ width: '20px', height: '20px', accentColor: 'var(--color-primary-500)' }}
                checked={formData.requires_full_payment === true}
                onChange={() => updateFormData({ requires_full_payment: true })}
              />
              <span style={{ fontWeight: 600, userSelect: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Pago Total Online
                <div title="Se le cobrará la totalidad del monto al momento de reservar." style={{ cursor: 'help' }}>
                  <Info size={16} color="var(--text-muted)" />
                </div>
              </span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: '12px', borderRadius: 'var(--radius-xl)', cursor: 'pointer', transition: 'background-color 0.3s ease', width: 'fit-content', paddingRight: '32px' }} className="payment-mode-hover">
              <input 
                type="radio" 
                name="payment_mode"
                style={{ width: '20px', height: '20px', accentColor: 'var(--color-primary-500)' }}
                checked={formData.requires_full_payment === false}
                onChange={() => updateFormData({ requires_full_payment: false })}
              />
              <span style={{ fontWeight: 600, userSelect: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Reserva con Anticipo (Seña)
                <div title="El cliente paga online el anticipo (comisión Kailu + 3% servicio), y el saldo lo cubre a bordo." style={{ cursor: 'help' }}>
                  <Info size={16} color="var(--text-muted)" />
                </div>
              </span>
            </label>
          </div>
          <p className="step-subtitle" style={{ fontSize: '12px', marginTop: '16px' }}>
            Nota: Todos los cobros online incluyen una tasa de servicio del 3% procesada por la plataforma.
          </p>
        </div>

      </div>
      <style>{`
        .payment-mode-hover:hover {
          background-color: rgba(255, 255, 255, 0.05);
        }
      `}</style>
    </div>
  )
}

export default Step8Pricing
