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
    <div className="step-container">
      
      <div className="step-header">
        <h2 className="step-title">
          Servicios y la Embarcación
        </h2>
        <p className="step-subtitle">
          Detalla exactamente qué incluye el precio y vincula el transporte.
        </p>
      </div>

      <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-6)' }}>
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
          color: 'rgba(255, 255, 255, 0.7)' 
        }}>
          <div style={{ gridColumn: 'span 8 / span 8' }}>Servicios</div>
          <div style={{ gridColumn: 'span 2 / span 2', textAlign: 'center', color: 'var(--color-primary-500)' }}>Incluidos</div>
          <div style={{ gridColumn: 'span 2 / span 2', textAlign: 'center', color: 'var(--color-error-500)' }}>Excluidos</div>
        </div>

        {/* Matrix rows */}
        <div style={{ maxHeight: '300px', overflowY: 'auto', paddingTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', paddingRight: 'var(--space-2)' }} className="custom-scrollbar">
          {AVAILABLE_SERVICES.map((service) => {
            const isIncluded = formData.included_services.includes(service)
            const isExcluded = formData.excluded_services.includes(service)

            return (
              <div key={service} style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 'var(--space-4)', alignItems: 'center' }} className="service-row-hover">
                <div style={{ gridColumn: 'span 8 / span 8', fontWeight: 500, color: 'rgba(255, 255, 255, 0.9)', transition: 'color 0.2s ease' }} className="service-label">
                  {service}
                </div>
                <div style={{ gridColumn: 'span 2 / span 2', display: 'flex', justifyContent: 'center' }}>
                  <input 
                    type="checkbox" 
                    style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary-500)', borderRadius: '4px' }}
                    checked={isIncluded}
                    onChange={() => toggleService('included_services', service)}
                  />
                </div>
                <div style={{ gridColumn: 'span 2 / span 2', display: 'flex', justifyContent: 'center' }}>
                  <input 
                    type="checkbox" 
                    style={{ width: '16px', height: '16px', accentColor: 'var(--color-error-500)', borderRadius: '4px' }}
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
          style={{ fontWeight: 500 }}
          value={formData.boat_id || ''}
          onChange={(e) => updateFormData({ boat_id: e.target.value })}
        >
          <option value="" disabled>Seleccione...</option>
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
          color: white !important;
        }
      `}</style>
    </div>
  )
}

export default Step5Services
