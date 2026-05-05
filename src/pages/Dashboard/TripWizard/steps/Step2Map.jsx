import React from 'react'
import { useTripWizardStore } from '../../../../stores/useTripWizardStore'
import { MapPin, Navigation } from 'lucide-react'

// Note: React Leaflet would go here, we are using a mockup representation 
// of the map for now until coordinates are fully managed.

const Step2Map = () => {
  const { formData, updateFormData } = useTripWizardStore()

  return (
    <div className="step-container">
      
      <div className="step-header">
        <h2 className="step-title">
          Marquemos el rumbo
        </h2>
        <p className="step-subtitle">
          Muestra en el mapa interactivo desde dónde zarparán los pasajeros y la zona de navegación.
        </p>
      </div>

      <div className="step-form">
        
        {/* Ubicación Genérica */}
        <div className="form-group">
          <label className="form-group__label">
            Ciudad o Región *
          </label>
          <div className="input-with-icon">
            <MapPin className="input-icon" size={20} />
            <input
              type="text"
              className="input-control"
              style={{ paddingLeft: '44px' }}
              placeholder="Ej: Buenos Aires, Río de la Plata"
              value={formData.location}
              onChange={(e) => updateFormData({ location: e.target.value })}
            />
          </div>
          <p className="step-subtitle" style={{ fontSize: '12px', marginTop: '4px' }}>Esta será la información pública general antes de reservar.</p>
        </div>

        {/* Mapa interactivo (Mockup) */}
        <div className="step-section">
          <label className="form-group__label">
            Ubicación exacta de embarque (Privado)
          </label>
          <p className="step-subtitle" style={{ fontSize: '14px', marginBottom: '16px' }}>Haz clic en el mapa para marcar el muelle o puerto. Esta ubicación exacta solo se compartirá con quienes realicen la reserva.</p>
          
          <div style={{
            width: '100%',
            height: '350px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 'var(--radius-2xl)',
            border: formData.coordinates ? '2px solid var(--color-accent-400)' : '2px solid var(--border-color)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'border-color 0.3s ease'
          }}
          onMouseOver={(e) => { if (!formData.coordinates) e.currentTarget.style.borderColor = 'rgba(0, 180, 180, 0.4)' }}
          onMouseOut={(e) => { if (!formData.coordinates) e.currentTarget.style.borderColor = 'var(--border-color)' }}
          onClick={() => updateFormData({ coordinates: { lat: -34.6037, lng: -58.3816 } })}
          >
            
            {/* Visual placeholder for Map */}
            <div style={{
              position: 'absolute',
              inset: '0',
              opacity: formData.coordinates ? '0.4' : '0.2',
              backgroundImage: "url('https://maps.wikimedia.org/osm-intl/12/1392/2483.png')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              transition: 'opacity 0.3s ease'
            }}></div>
            
            <div style={{ zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{
                padding: '16px',
                backgroundColor: formData.coordinates ? 'var(--color-accent-400)' : 'rgba(10, 15, 26, 0.8)',
                backdropFilter: 'blur(8px)',
                borderRadius: '50%',
                boxShadow: formData.coordinates ? '0 0 25px rgba(0, 180, 180, 0.5)' : '0 10px 25px rgba(0,0,0,0.5)',
                color: formData.coordinates ? '#fff' : 'var(--color-primary-500)',
                transition: 'all 0.3s ease'
              }}>
                <MapPin size={32} />
              </div>
              <span style={{
                fontWeight: 600,
                color: formData.coordinates ? '#fff' : 'var(--text-primary)',
                backgroundColor: formData.coordinates ? 'var(--color-accent-600)' : 'rgba(10, 15, 26, 0.5)',
                padding: '6px 16px',
                borderRadius: '4px',
                backdropFilter: 'blur(4px)',
                transition: 'all 0.3s ease'
              }}>
                {formData.coordinates ? 'PIN Marcado Exitosamente' : 'Hacer clic para marcar el PIN'}
              </span>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}

export default Step2Map
