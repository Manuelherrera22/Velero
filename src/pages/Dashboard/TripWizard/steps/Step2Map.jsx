import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useTripWizardStore } from '../../../../stores/useTripWizardStore'
import { MapPin, Search, Loader, Navigation } from 'lucide-react'
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

// Component to handle clicks on the map (backup fine-tuning)
const MapEvents = ({ onClickMap }) => {
  useMapEvents({
    click(e) {
      onClickMap({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return null
}

// Component to automatically fly to the searched location
const MapFlyTo = ({ center, zoom }) => {
  const map = useMap()
  useEffect(() => {
    if (center) {
      map.flyTo([center.lat, center.lng], zoom || 16)
    }
  }, [center, map, zoom])
  return null
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

const Step2Map = () => {
  const { formData, updateFormData } = useTripWizardStore()
  const [searchQuery, setSearchQuery] = useState(formData.location || '')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searching, setSearching] = useState(false)
  const [mapCenter, setMapCenter] = useState(formData.coordinates || { lat: -34.6037, lng: -58.3816 })
  const [mapZoom, setMapZoom] = useState(formData.coordinates ? 16 : 12)
  const debounceRef = useRef(null)
  const containerRef = useRef(null)

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced autocomplete search
  const fetchSuggestions = useCallback(async (query) => {
    if (!query || query.length < 3 || !MAPBOX_TOKEN) {
      setSuggestions([])
      return
    }

    try {
      // proximity bias toward Buenos Aires metro area for better Argentine results
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&limit=5&language=es&proximity=-58.3816,-34.6037&country=ar`
      )
      const data = await response.json()
      if (data && data.features) {
        setSuggestions(data.features)
        setShowSuggestions(true)
      }
    } catch (err) {
      console.error('Autocomplete error:', err)
    }
  }, [])

  const handleInputChange = (e) => {
    const value = e.target.value
    setSearchQuery(value)

    // Debounce: wait 300ms after typing stops
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value)
    }, 300)
  }

  const handleSelectSuggestion = (feature) => {
    const [lng, lat] = feature.center
    const newCoords = { lat, lng }
    const placeName = feature.place_name

    setSearchQuery(placeName)
    setMapCenter(newCoords)
    setMapZoom(17)
    setSuggestions([])
    setShowSuggestions(false)

    // Auto-set the PIN and location in one click
    updateFormData({
      location: placeName,
      coordinates: newCoords,
      exact_location: placeName
    })
  }

  // Fallback: manual search on Enter or button click
  const handleManualSearch = async () => {
    if (!searchQuery.trim() || !MAPBOX_TOKEN) return
    setSearching(true)
    setShowSuggestions(false)
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${MAPBOX_TOKEN}&limit=1&language=es`
      )
      const data = await response.json()
      
      if (data && data.features && data.features.length > 0) {
        handleSelectSuggestion(data.features[0])
      } else {
        alert("No se encontró la ubicación. Intenta con una dirección más específica.")
      }
    } catch (error) {
      console.error("Error buscando ubicación:", error)
      alert("Hubo un error al buscar la ubicación.")
    } finally {
      setSearching(false)
    }
  }

  // When clicking the map, fine-tune the pin position
  const handleMapClick = (coords) => {
    updateFormData({ coordinates: coords })
  }

  return (
    <div className="step-container">
      
      <div className="step-header">
        <h2 className="step-title">
          Marquemos el rumbo
        </h2>
        <p className="step-subtitle">
          Escribí la dirección exacta de embarque y el PIN se colocará automáticamente. También podés ajustarlo tocando el mapa.
        </p>
      </div>

      <div className="step-form">
        
        {/* Autocomplete Search */}
        <div className="form-group" ref={containerRef} style={{ position: 'relative' }}>
          <label className="form-group__label">
            <Navigation size={16} style={{ marginRight: '6px', color: 'var(--color-accent-500)' }} />
            Dirección de embarque *
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div className="input-with-icon" style={{ flex: 1 }}>
              <MapPin className="input-icon" size={20} />
              <input
                type="text"
                className="input-control"
                style={{ paddingLeft: '44px' }}
                placeholder="Ej: Camino Escollera 1500, San Isidro"
                value={searchQuery}
                onChange={handleInputChange}
                onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              />
            </div>
            <button 
              className="btn btn--accent" 
              onClick={handleManualSearch}
              disabled={searching || !searchQuery.trim()}
              style={{ padding: '0 24px' }}
            >
              {searching ? <Loader size={18} className="spin" /> : <Search size={18} />}
            </button>
          </div>

          {/* Autocomplete Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 1000,
              backgroundColor: 'var(--bg-secondary, #0F172A)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 'var(--radius-xl)',
              marginTop: '4px',
              boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
              overflow: 'hidden'
            }}>
              {suggestions.map((feature, idx) => (
                <button
                  key={feature.id || idx}
                  onClick={() => handleSelectSuggestion(feature)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    padding: '14px 16px',
                    border: 'none',
                    borderBottom: idx < suggestions.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                    backgroundColor: 'transparent',
                    color: 'var(--text-primary, #fff)',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(11, 171, 195, 0.1)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <MapPin size={16} style={{ flexShrink: 0, color: 'var(--color-accent-500)' }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {feature.place_name}
                  </span>
                </button>
              ))}
            </div>
          )}

          <p className="step-subtitle" style={{ fontSize: '12px', marginTop: '4px' }}>
            Escribí la dirección completa y seleccioná de la lista. El PIN se colocará automáticamente.
          </p>
        </div>

        {/* Mapa interactivo */}
        <div className="step-section">
          
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
              zoom={mapZoom} 
              style={{ width: '100%', height: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.mapbox.com/">Mapbox</a>'
                url={`https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`}
                tileSize={512}
                zoomOffset={-1}
              />
              <MapFlyTo center={mapCenter} zoom={mapZoom} />
              <MapEvents onClickMap={handleMapClick} />
              
              {formData.coordinates && (
                <Marker position={[formData.coordinates.lat, formData.coordinates.lng]} />
              )}
            </MapContainer>
          </div>
          
          {formData.coordinates && (
            <div style={{ marginTop: '12px', padding: '12px 16px', backgroundColor: 'rgba(0, 180, 180, 0.1)', borderRadius: 'var(--radius-lg)', color: 'var(--color-accent-600)', fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={16} /> PIN marcado — Si necesitás ajustarlo, tocá directamente en el mapa.
            </div>
          )}

          <div className="form-group" style={{ marginTop: '24px' }}>
            <label className="form-group__label">
              Referencias para ubicar la embarcación
            </label>
            <textarea
              className="input-control"
              style={{ minHeight: '80px', paddingTop: '12px', resize: 'vertical' }}
              placeholder="Agregá referencias para ubicar la embarcación (ej: La amarra puede variar, comunicarse al llegar a la portería del club)..."
              value={formData.location_reference || ''}
              onChange={(e) => updateFormData({ location_reference: e.target.value })}
            />
            <p className="step-subtitle" style={{ fontSize: '12px', marginTop: '4px' }}>Si la amarra cambia con frecuencia o es difícil de encontrar solo con GPS, deja instrucciones claras aquí para tus pasajeros.</p>
          </div>
        </div>

      </div>
    </div>
  )
}

export default Step2Map
