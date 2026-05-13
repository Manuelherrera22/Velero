import React from 'react'
import { useTripWizardStore } from '../../../../stores/useTripWizardStore'
import { UploadCloud, Image as ImageIcon, X } from 'lucide-react'

const PHOTO_CATEGORIES = [
  { id: 'portada', label: 'Portada', description: 'La imagen principal de tu travesía.' },
  { id: 'camarote', label: 'Camarote', description: 'Muestra dónde dormirán.' },
  { id: 'actividad', label: 'Actividad', description: 'Aventuras en el agua.' },
  { id: 'comidas', label: 'Comidas', description: 'Platos típicos a bordo.' },
  { id: 'paisaje', label: 'Paisaje', description: 'Imágenes del destino.' }
]

const Step4Photos = () => {
  const { formData, addPhoto, removePhoto } = useTripWizardStore()
  const fileInputRef = React.useRef(null)
  const [activeCategory, setActiveCategory] = React.useState(null)

  const handleUploadClick = (category) => {
    setActiveCategory(category)
    if (fileInputRef.current) {
      // If it's portada, we only want 1 file. Otherwise, multiple.
      if (category === 'portada') {
        fileInputRef.current.removeAttribute('multiple')
      } else {
        fileInputRef.current.setAttribute('multiple', '')
      }
      fileInputRef.current.click()
    }
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0 || !activeCategory) return

    files.forEach(file => {
      const url = URL.createObjectURL(file)
      addPhoto(activeCategory, url)
    })
    
    e.target.value = null // reset
  }

  const getTotalPhotos = () => {
    let count = formData.images_meta.portada ? 1 : 0
    PHOTO_CATEGORIES.slice(1).forEach(cat => {
      count += (formData.images_meta[cat.id] || []).length
    })
    return count
  }

  return (
    <div className="step-container">
      {/* Hidden File Input */}
      <input 
        type="file" 
        accept="image/png, image/jpeg, image/webp" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={handleFileChange}
      />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="step-header" style={{ maxWidth: '36rem' }}>
          <h2 className="step-title">
            Sube fotos increíbles
          </h2>
          <p className="step-subtitle">
            Atrae a más pasajeros subiendo al menos 5 fotos que representen la experiencia de paisajes, actividades y la embarcación.
          </p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <button 
            className="btn btn--outline" 
            style={{ borderRadius: '9999px' }}
            onClick={() => handleUploadClick('portada')}
          >
            <UploadCloud size={20} style={{ marginRight: '8px' }} />
            Cargar imágenes
          </button>
          <p className="step-subtitle" style={{ fontSize: '14px', marginTop: '8px', fontWeight: 600 }}>({getTotalPhotos()} fotos)</p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Videos: Próximamente</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
        
        {PHOTO_CATEGORIES.map((category) => {
          const isPortada = category.id === 'portada'
          // Extract matching urls
          const urls = isPortada 
            ? formData.images_meta.portada ? [formData.images_meta.portada] : []
            : formData.images_meta[category.id] || []

          return (
            <div 
              key={category.id} 
              style={{
                position: 'relative',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 'var(--radius-2xl)',
                border: `2px dashed ${urls.length > 0 ? 'rgba(0, 180, 180, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
                minHeight: '160px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                transition: 'border-color 0.3s ease'
              }}
              onMouseOver={(e) => { if(urls.length === 0) e.currentTarget.style.borderColor = 'rgba(0, 180, 180, 0.4)' }}
              onMouseOut={(e) => { if(urls.length === 0) e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)' }}
            >
              {/* Category Badge */}
              <div style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                backgroundColor: 'var(--color-primary-500)',
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold',
                padding: '4px 12px',
                borderRadius: '9999px',
                zIndex: 10
              }}>
                {category.label}
              </div>

              {/* Upload Trigger / Edit */}
              <button 
                onClick={() => handleUploadClick(category.id)}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  padding: '8px',
                  borderRadius: '50%',
                  border: '1px solid var(--border-color)',
                  zIndex: 10,
                  cursor: 'pointer',
                  transition: 'color 0.3s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-accent-500)'}
                onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                title="Cargar foto en esta categoría"
              >
                <ImageIcon size={16} />
              </button>

              {/* Render Images wrapper */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
                {urls.length === 0 ? (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255, 255, 255, 0.1)' }}>
                    <ImageIcon size={64} />
                  </div>
                ) : (
                  <div style={{ width: '100%', display: 'flex', overflowX: urls.length > 1 ? 'auto' : 'visible', scrollSnapType: urls.length > 1 ? 'x mandatory' : 'none' }}>
                    {urls.map((url, i) => (
                      <div 
                        key={i} 
                        style={{
                          position: 'relative',
                          flexShrink: 0,
                          width: (isPortada || urls.length === 1) ? '100%' : '80%',
                          height: '100%',
                          scrollSnapAlign: 'center'
                        }}
                        className="photo-card-hover"
                      >
                        <img src={url} alt={category.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button 
                          onClick={() => removePhoto(category.id, url)}
                          className="photo-remove-btn"
                          style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            backgroundColor: 'var(--color-error-500)',
                            color: 'white',
                            padding: '8px',
                            borderRadius: '50%',
                            border: 'none',
                            cursor: 'pointer',
                            opacity: 0,
                            transition: 'opacity 0.3s ease'
                          }}
                        >
                          <X size={20} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
            </div>
          )
        })}
      </div>
      <style>{`
        .photo-card-hover:hover .photo-remove-btn {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  )
}

export default Step4Photos
