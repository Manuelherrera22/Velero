import React, { useState, useEffect } from 'react'
import { useTripWizardStore } from '../../../../stores/useTripWizardStore'
import supabase from '../../../../lib/supabase'

const Step1Details = () => {
  const { formData, updateFormData, hasBookings } = useTripWizardStore()
  const [navigationZones, setNavigationZones] = useState([])

  useEffect(() => {
    const fetchZones = async () => {
      try {
        const { data, error } = await supabase
          .from('navigation_zones')
          .select('*')
          .eq('is_active', true)
          .order('name', { ascending: true })
        if (!error && data) {
          setNavigationZones(data)
        }
      } catch (e) {
        console.error(e)
      }
    }
    fetchZones()
  }, [])

  const handleRoleChange = (role) => {
    updateFormData({ role_in_activity: role })
  }

  return (
    <div className="step-container">
      
      <div className="step-header">
        <h2 className="step-title">
          Cuentános sobre tu travesía
        </h2>
        <p className="step-subtitle">
          Empecemos con lo básico. Un buen título y descripción ayudarán a los viajeros a enamorarse de tu propuesta.
        </p>
      </div>

      <div className="step-form" style={{ opacity: hasBookings ? 0.6 : 1, pointerEvents: hasBookings ? 'none' : 'auto' }}>
        
        {hasBookings && (
          <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#d97706', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, marginBottom: 'var(--space-6)' }}>
            ⚠️ Edición bloqueada. Esta travesía ya cuenta con reservas. Solo puedes modificar las plazas bloqueadas en el paso de "Fechas".
          </div>
        )}

        {/* Título */}
        <div className="form-group">
          <label className="form-group__label">
            Título de la travesía *
          </label>
          <input
            type="text"
            className="input-control"
            placeholder="Ej: Navegación de atardecer por el Río de la Plata"
            value={formData.title}
            onChange={(e) => updateFormData({ title: e.target.value })}
            autoFocus
          />
        </div>

        {/* Descripción */}
        <div className="form-group">
          <label className="form-group__label">
            Descripción promocional *
          </label>
          <textarea
            className="input-control"
            style={{ minHeight: '160px', resize: 'vertical' }}
            placeholder="Describe la experiencia general, qué la hace única, los paisajes y emociones..."
            value={formData.description}
            onChange={(e) => updateFormData({ description: e.target.value })}
          />
        </div>

        {/* Zona de Navegación */}
        <div className="form-group">
          <label className="form-group__label">
            Zona de navegación
          </label>
          <select
            className="input-control"
            value={formData.navigation_zone_id || ''}
            onChange={(e) => updateFormData({ navigation_zone_id: e.target.value })}
          >
            <option value="">Selecciona una zona...</option>
            {navigationZones.map(zone => (
              <option key={zone.id} value={zone.id}>{zone.name}</option>
            ))}
          </select>
          {navigationZones.length === 0 && (
            <p className="step-subtitle" style={{ fontSize: '12px', marginTop: '4px' }}>
              No hay zonas de navegación configuradas por administración.
            </p>
          )}
        </div>

        {/* Rol del organizador */}
        <div className="step-section">
          <label className="form-group__label">
            ¿Cuál será tu rol en esta travesía?
          </label>
          
          <div className="radio-card-grid">
            {/* Opción Capitán */}
            <div 
              className={`radio-card ${formData.role_in_activity === 'capitan' ? 'radio-card--active' : ''}`}
              onClick={() => handleRoleChange('capitan')}
            >
              <h3 className="radio-card__title">Capitán</h3>
              <p className="radio-card__desc">Seré yo quien navegue la embarcación durante toda la experiencia.</p>
              
              <div className="radio-card__indicator">
                {formData.role_in_activity === 'capitan' && <div className="radio-card__indicator-dot" />}
              </div>
            </div>

            {/* Opción Coordinador */}
            <div 
              className={`radio-card ${formData.role_in_activity === 'coordinador' ? 'radio-card--active' : ''}`}
              onClick={() => handleRoleChange('coordinador')}
            >
              <h3 className="radio-card__title">Coordinador</h3>
              <p className="radio-card__desc">Organizo la actividad pero otra persona certificada patroneará el barco.</p>
              
              <div className="radio-card__indicator">
                {formData.role_in_activity === 'coordinador' && <div className="radio-card__indicator-dot" />}
              </div>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="step-section">
          <label className="form-group__label">
            Categorías
          </label>
          <p className="step-subtitle" style={{ fontSize: '14px', marginBottom: '8px' }}>Seleccioná las categorías que describen tu travesía.</p>
          <div className="tags-container">
            {['Paseo', 'Aventura', 'Pesca', 'Atardecer', 'Nocturno', 'Río', 'Delta', 'Costa', 'Relax', 'Naturaleza'].map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  const currentTags = formData.tags || [];
                  updateFormData({ 
                    tags: currentTags.includes(tag) 
                      ? currentTags.filter(t => t !== tag) 
                      : [...currentTags, tag] 
                  })
                }}
                className={`tag-btn ${
                  (formData.tags || []).includes(tag) ? 'tag-btn--active' : ''
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

export default Step1Details
