import React from 'react'
import { useTripWizardStore } from '../../../../stores/useTripWizardStore'
import useAuthStore from '../../../../stores/authStore'
import { Info } from 'lucide-react'

const Step8Pricing = () => {
  const { formData, updateFormData, hasBookings } = useTripWizardStore()
  const { profile } = useAuthStore()
  const commissionRate = profile?.captain_commission_rate || 20 // Fallback to default 20% commission

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

      <div className="step-form" style={{ opacity: hasBookings ? 0.6 : 1, pointerEvents: hasBookings ? 'none' : 'auto' }}>
        
        {hasBookings && (
          <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#d97706', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, marginBottom: 'var(--space-6)' }}>
            ⚠️ Edición bloqueada. Esta travesía ya cuenta con reservas. Solo puedes modificar las plazas bloqueadas en el paso de "Fechas".
          </div>
        )}

        {/* Precios */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-6)', alignItems: 'end' }}>
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-1)', minHeight: '32px' }}>
              <label className="form-group__label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: formData.allow_individual_booking !== false ? 'var(--text-primary)' : 'var(--text-muted)', transition: 'color 0.3s ease' }}>
                Precio por pasajero
                <div title="El costo individual base al reservar lugares compartidos." style={{ cursor: 'help' }}>
                  <Info size={16} color="var(--text-muted)" />
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', backgroundColor: 'rgba(0, 0, 0, 0.02)', padding: '2px 8px', borderRadius: '9999px', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Permitir por pasajero</span>
                <input 
                  type="checkbox" 
                  style={{ width: '28px', height: '14px', accentColor: 'var(--color-primary-500)' }}
                  checked={formData.allow_individual_booking !== false}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    updateFormData({ 
                      allow_individual_booking: isChecked,
                      price_per_person: isChecked ? formData.price_per_person : 0 
                    });
                  }}
                />
              </label>
            </div>
            <div className="input-with-icon">
              <span className="input-icon" style={{ fontWeight: 'bold' }}>$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                disabled={formData.allow_individual_booking === false}
                className="input-control"
                style={{ paddingLeft: '40px', fontWeight: 'bold', opacity: formData.allow_individual_booking !== false ? 1 : 0.5 }}
                value={formData.price_per_person || ''}
                onChange={(e) => updateFormData({ price_per_person: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-1)', minHeight: '32px' }}>
              <label className="form-group__label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: formData.allow_full_boat ? 'var(--text-primary)' : 'var(--text-muted)', transition: 'color 0.3s ease' }}>
                Precio por barco completo
                <div title="El precio total si alguien reserva la exclusividad de todo el barco." style={{ cursor: 'help' }}>
                  <Info size={16} color="var(--text-muted)" />
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', backgroundColor: 'rgba(0, 0, 0, 0.02)', padding: '2px 8px', borderRadius: '9999px', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Permitir alquilar todo el barco</span>
                <input 
                  type="checkbox" 
                  style={{ width: '28px', height: '14px', accentColor: 'var(--color-primary-500)' }}
                  checked={formData.allow_full_boat}
                  onChange={(e) => updateFormData({ allow_full_boat: e.target.checked })}
                />
              </label>
            </div>

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
          <div className="form-group" style={{ display: 'none' }}>
            <label className="form-group__label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              Métodos de pago permitidos
              <div title="Vías por las cuales podés recibir el dinero" style={{ cursor: 'help' }}>
                <Info size={16} color="var(--text-muted)" />
              </div>
            </label>
            <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '12px 16px', border: '1px solid rgba(255, 255, 255, 0.3)', borderRadius: 'var(--radius-xl)' }}>
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
                onChange={() => updateFormData({ requires_full_payment: true, deposit_percentage: 100.0 })}
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
                onChange={() => {
                  const currentDeposit = formData.deposit_percentage ?? 100.0
                  const finalDeposit = currentDeposit < commissionRate ? commissionRate : currentDeposit
                  updateFormData({ 
                    requires_full_payment: false,
                    deposit_percentage: finalDeposit
                  })
                }}
              />
              <span style={{ fontWeight: 600, userSelect: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Reserva con Anticipo (Seña)
                <div title="El cliente paga online el anticipo (comisión Kailu), y el saldo lo cubre a bordo." style={{ cursor: 'help' }}>
                  <Info size={16} color="var(--text-muted)" />
                </div>
              </span>
            </label>

            {formData.requires_full_payment === false && (
              <div style={{ paddingLeft: '36px', marginTop: 'var(--space-2)' }}>
                <div className="form-group" style={{ maxWidth: '300px' }}>
                  <label className="form-group__label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Porcentaje de anticipo *
                    <div title={`El porcentaje del total que el cliente debe pagar online para reservar (mínimo ${commissionRate}%).`} style={{ cursor: 'help' }}>
                      <Info size={16} color="var(--text-muted)" />
                    </div>
                  </label>
                  <div className="input-with-icon">
                    <span className="input-icon" style={{ fontWeight: 'bold' }}>%</span>
                    <input
                      type="number"
                      min={commissionRate}
                      max="100"
                      step="5"
                      className="input-control"
                      style={{ paddingLeft: '40px', fontWeight: 'bold' }}
                      value={formData.deposit_percentage ?? commissionRate}
                      onChange={(e) => {
                        let val = parseFloat(e.target.value) || commissionRate
                        if (val < commissionRate) val = commissionRate
                        if (val > 100) val = 100
                        updateFormData({ deposit_percentage: val })
                      }}
                    />
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '6px', fontStyle: 'italic', lineHeight: '1.4' }}>
                    * Mínimo permitido: {commissionRate}% (tu comisión acordada con Kailu).
                  </p>
                </div>
              </div>
            )}
          </div>
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
