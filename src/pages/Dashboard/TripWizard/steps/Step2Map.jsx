import React, { useState, useEffect } from 'react'
import { useTripWizardStore } from '../../../../stores/useTripWizardStore'
import { MapPin, Search, Loader } from 'lucide-react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix Leaflet's default icon issue with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Component to handle clicks on the map
const MapEvents = ({ setCoordinates }) => {
  useMapEvents({
    click(e) {
      setCoordinates({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return null
}

// Component to automatically fly to the searched location
const MapFlyTo = ({ center }) => {
  const map = useMap()
  useEffect(() => {
    if (center) {
      map.flyTo([center.lat, center.lng], 13)
    }
  }, [center, map])
  return null
}

const Step2Map = () => {
  const { formData, updateFormData } = useTripWizardStore()
  const [searchQuery, setSearchQuery] = useState(formData.location || '')
  const [searching, setSearching] = useState(false)
  const [mapCenter, setMapCenter] = useState(formData.coordinates || { lat: -34.6037, lng: -58.3816 }) // Default: Buenos Aires

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat)
        const lng = parseFloat(data[0].lon)
        const newCoords = { lat, lng }
        
        setMapCenter(newCoords)
        updateFormData({ location: searchQuery })
      } else {
        alert("No se encontró la ubicación. Intenta con un nombre más específico.")
      }
    } catch (error) {
      console.error("Error buscando ubicación:", error)
      alert("Hubo un error al buscar la ubicación.")
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="step-container">
      
      <div className="step-header">
        <h2 className="step-title">
          Marquemos el rumbo
        </h2>
        <p className="step-subtitle">
          Busca una ciudad o región y marca en el mapa el lugar exacto desde donde zarparán los pasajeros.
        </p>
      </div>

      <div className="step-form">
        
        {/* Búsqueda y Ubicación Genérica */}
        <div className="form-group">
          <label className="form-group__label">
            Ciudad o Región *
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div className="input-with-icon" style={{ flex: 1 }}>
              <MapPin className="input-icon" size={20} />
              <input
                type="text"
                className="input-control"
                style={{ paddingLeft: '44px' }}
                placeholder="Ej: San Fernando, Buenos Aires"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button 
              className="btn btn--accent" 
              onClick={handleSearch}
              disabled={searching || !searchQuery.trim()}
              style={{ padding: '0 24px' }}
            >
              {searching ? <Loader size={18} className="spin" /> : <Search size={18} />}
            </button>
          </div>
          <p className="step-subtitle" style={{ fontSize: '12px', marginTop: '4px' }}>Esta será la información pública general antes de reservar.</p>
        </div>

        {/* Mapa interactivo Real */}
        <div className="step-section">
          <label className="form-group__label">
            Ubicación exacta de embarque (Privado)
          </label>
          <p className="step-subtitle" style={{ fontSize: '14px', marginBottom: '16px' }}>Haz clic en el mapa para marcar el muelle o puerto. Esta ubicación exacta solo se compartirá con quienes realicen la reserva.</p>
          
          <div style={{
            width: '100%',
            height: '400px',
            borderRadius: 'var(--radius-2xl)',
            border: formData.coordinates ? '2px solid var(--color-accent-400)' : '2px solid var(--border-color)',
            overflow: 'hidden',
            position: 'relative',
            zIndex: 1
          }}>
            <MapContainer 
              center={[mapCenter.lat, mapCenter.lng]} 
              zoom={12} 
              style={{ width: '100%', height: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              />
              <MapFlyTo center={mapCenter} />
              <MapEvents setCoordinates={(coords) => {
                updateFormData({ coordinates: coords })
              }} />
              
              {formData.coordinates && (
                <Marker position={[formData.coordinates.lat, formData.coordinates.lng]} />
              )}
            </MapContainer>
          </div>
          
          {formData.coordinates && (
            <div style={{ marginTop: '12px', padding: '12px', backgroundColor: 'rgba(0, 180, 180, 0.1)', borderRadius: '8px', color: 'var(--color-accent-600)', fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={16} /> PIN marcado en {formData.coordinates.lat.toFixed(4)}, {formData.coordinates.lng.toFixed(4)}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default Step2Map
