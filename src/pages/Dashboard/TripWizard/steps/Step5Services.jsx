import React from 'react'
import { useTripWizardStore } from '../../../../stores/useTripWizardStore'
import { Anchor, HelpCircle, Plus } from 'lucide-react'

const AVAILABLE_SERVICES = [
  'Seguro',
  'Capitán',
  'Salvavidas',
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
  const { formData, toggleService, updateFormData, hasBookings } = useTripWizardStore()

  return (
    <div className="step-container">
      
      <div className="step-header">
        <h2 className="step-title">
          Servicios y la Embarcación
        </h2>
        <p className="step-subtitle">
          Detalla exactamente qué incluye el precio y vincula el transporte.
        </p>
      </div>

      <div style={{ backgroundColor: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-6)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', opacity: hasBookings ? 0.6 : 1, pointerEvents: hasBookings ? 'none' : 'auto' }}>
        
        {hasBookings && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, marginBottom: 'var(--space-6)' }}>
            ⚠️ Edición bloqueada. Esta travesía ya cuenta con reservas. Solo puedes modificar las plazas bloqueadas en el paso de "Fechas".
          </div>
        )}

        {/* Table Header */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', 
          gap: 'var(--space-4)', 
          paddingBottom: 'var(--space-4)', 
          borderBottom: '1px solid var(--border-color)', 
          fontWeight: 'bold', 
          fontSize: '12px', 
          textTransform: 'uppercase', 
          letterSpacing: '-0.025em', 
          color: 'var(--text-muted)' 
        }}>
          <div style={{ gridColumn: 'span 8 / span 8' }}>Servicios</div>
          <div style={{ gridColumn: 'span 2 / span 2', textAlign: 'center', color: 'var(--color-primary-600)' }}>Incluidos</div>
          <div style={{ gridColumn: 'span 2 / span 2', textAlign: 'center', color: 'var(--color-error-600)' }}>Excluidos</div>
        </div>

        {/* Matrix rows */}
        <div style={{ maxHeight: '300px', overflowY: 'auto', paddingTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', paddingRight: 'var(--space-2)' }} className="custom-scrollbar">
          {[...new Set([...(formData.custom_services || []), ...AVAILABLE_SERVICES, ...formData.included_services, ...formData.excluded_services])].map((service) => {
            const isIncluded = formData.included_services.includes(service)
            const isExcluded = formData.excluded_services.includes(service)
            const isMandatory = service === 'Seguro' || service === 'Salvavidas'

            return (
              <div key={service} style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 'var(--space-4)', alignItems: 'center' }} className="service-row-hover">
                <div style={{ gridColumn: 'span 8 / span 8', fontWeight: 500, color: 'var(--text-primary)', transition: 'color 0.2s ease', opacity: isMandatory ? 0.7 : 1 }} className="service-label">
                  {service} {isMandatory && <span style={{ fontSize: '10px', backgroundColor: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px', color: 'var(--text-muted)' }}>Obligatorio</span>}
                </div>
                <div style={{ gridColumn: 'span 2 / span 2', display: 'flex', justifyContent: 'center' }}>
                  <input 
                    type="checkbox" 
                    style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary-500)', borderRadius: '4px', opacity: isMandatory ? 0.5 : 1 }}
                    checked={isIncluded}
                    disabled={isMandatory}
                    onChange={() => toggleService('included_services', service)}
                  />
                </div>
                <div style={{ gridColumn: 'span 2 / span 2', display: 'flex', justifyContent: 'center' }}>
                  <input 
                    type="checkbox" 
                    style={{ width: '16px', height: '16px', accentColor: 'var(--color-error-500)', borderRadius: '4px', opacity: isMandatory ? 0.5 : 1 }}
                    checked={isExcluded}
                    disabled={isMandatory}
                    onChange={() => toggleService('excluded_services', service)}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Custom Services Row (Moved outside scroll area) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 'var(--space-4)', alignItems: 'center', marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ gridColumn: 'span 8 / span 8', display: 'flex', gap: 'var(--space-2)' }}>
            <input 
              type="text" 
              id="custom_service_input"
              placeholder="Ej: Ropa blanca, Snorkel, Bebidas..." 
              className="input-control" 
              style={{ flex: 1, padding: 'var(--space-2)', fontSize: '13px' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (e.target.value.trim()) {
                    useTripWizardStore.getState().addCustomService(e.target.value.trim());
                    e.target.value = '';
                  }
                }
              }}
            />
            <button 
              type="button"
              className="btn btn--outline" 
              style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)' }}
              onClick={(e) => {
                const input = document.getElementById('custom_service_input');
                if (input && input.value.trim()) {
                  useTripWizardStore.getState().addCustomService(input.value.trim());
                  input.value = '';
                }
              }}
            >
              <Plus size={16} />
            </button>
          </div>
          <div style={{ gridColumn: 'span 4 / span 4', fontSize: '11px', color: 'var(--text-muted)' }}>
            Escribí y presioná enter o el botón + para agregar a la lista.
          </div>
        </div>
      </div>

      {/* Boat Selection */}
      <div className="step-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <label className="form-group__label" style={{ marginBottom: 0 }}>
            Embarcación *
          </label>
          <div title="El barco físico donde se realizará esta travesía" style={{ cursor: 'help' }}>
            <HelpCircle size={16} color="var(--text-muted)" />
          </div>
        </div>

        <select 
          className="input-control"
          style={{ fontWeight: 500, opacity: hasBookings ? 0.6 : 1, pointerEvents: hasBookings ? 'none' : 'auto' }}
          value={formData.boat_id || ''}
          onChange={(e) => updateFormData({ boat_id: e.target.value })}
        >
          <option value="" disabled>Seleccione embarcación...</option>
          {MOCK_BOATS.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
          <option value="NEW" style={{ fontWeight: 'bold', color: 'var(--color-accent-500)' }}>
            ✨ Agregar nueva embarcación
          </option>
        </select>

        {formData.boat_id === 'NEW' && (
          <div style={{ 
            padding: 'var(--space-6)', 
            backgroundColor: 'rgba(0, 180, 180, 0.05)', 
            border: '1px solid rgba(0, 180, 180, 0.2)', 
            borderRadius: 'var(--radius-2xl)', 
            marginTop: 'var(--space-4)',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <h4 style={{ fontWeight: 'bold', color: 'var(--color-accent-500)', marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Anchor size={20}/> Crear Embarcación
            </h4>
            <p className="step-subtitle" style={{ marginBottom: 'var(--space-4)' }}>Guarda la travesía temporalmente para agregar el barco nuevo en una pestaña externa, o completa el mini-formulario aquí (Coming Soon).</p>
            <button className="btn btn--accent" style={{ width: '100%' }}>Configurar barco ahora</button>
          </div>
        )}

      </div>
      <style>{`
        .service-row-hover:hover .service-label {
          color: var(--color-accent-600) !important;
        }
      `}</style>
    </div>
  )
}

export default Step5Services
