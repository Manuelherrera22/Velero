import React, { useState } from 'react'
import { useTripWizardStore } from '../../../../stores/useTripWizardStore'
import useAuthStore from '../../../../stores/authStore'
import supabase from '../../../../lib/supabase'
import { UploadCloud, Image as ImageIcon, X, Loader, AlertTriangle, RefreshCw } from 'lucide-react'

const PHOTO_CATEGORIES = [
  { id: 'portada', label: 'Portada', description: 'La imagen principal de tu travesía.' },
  { id: 'camarote', label: 'Camarote', description: 'Muestra dónde dormirán.' },
  { id: 'actividad', label: 'Actividad', description: 'Aventuras en el agua.' },
  { id: 'comidas', label: 'Comidas', description: 'Platos típicos a bordo.' },
  { id: 'paisaje', label: 'Paisaje', description: 'Imágenes del destino.' }
]

const Step4Photos = () => {
  const { formData, addPhoto, removePhoto, replacePhoto, getTotalPhotos, hasBookings } = useTripWizardStore()
  const fileInputRef = React.useRef(null)
  const [activeCategory, setActiveCategory] = useState(null)
  const [uploadingUrls, setUploadingUrls] = useState(new Set()) // tracks blob URLs currently uploading
  const [failedUrls, setFailedUrls] = useState(new Set()) // tracks blob URLs that failed to upload

  // Increment/decrement the global pending counter so TripWizard can block navigation
  const incPending = () => useTripWizardStore.setState(s => ({ pendingUploads: s.pendingUploads + 1 }))
  const decPending = () => useTripWizardStore.setState(s => ({ pendingUploads: Math.max(0, s.pendingUploads - 1) }))

  const compressAndUpload = async (blobUrl, category, attempt = 1) => {
    const MAX_ATTEMPTS = 3 // 3 retries for slow connections
    try {
      const user = useAuthStore.getState().user
      if (!user) {
        console.warn('No user for eager upload, will upload at save time')
        return
      }

      setUploadingUrls(prev => new Set([...prev, blobUrl]))
      setFailedUrls(prev => { const next = new Set(prev); next.delete(blobUrl); return next })
      if (attempt === 1) incPending() // Only increment on first attempt

      // Compress image — generous 30s timeout for slow devices
      const blob = await Promise.race([
        new Promise((resolve, reject) => {
          const img = new Image()
          img.onload = () => {
            const MAX = 1200
            let w = img.width, h = img.height
            if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX } }
            else { if (h > MAX) { w *= MAX / h; h = MAX } }
            const canvas = document.createElement('canvas')
            canvas.width = w; canvas.height = h
            canvas.getContext('2d').drawImage(img, 0, 0, w, h)
            canvas.toBlob(b => b ? resolve(b) : reject('toBlob failed'), 'image/jpeg', 0.8)
          }
          img.onerror = () => reject('Image load failed')
          img.src = blobUrl
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout comprimiendo imagen')), 30000))
      ])

      const ext = 'jpg'
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`

      // Upload — 120s timeout for very slow connections
      const uploadResult = await Promise.race([
        supabase.storage
          .from('trip-images')
          .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout subiendo imagen')), 120000))
      ])

      if (uploadResult.error) throw uploadResult.error

      const { data } = supabase.storage.from('trip-images').getPublicUrl(fileName)
      const publicUrl = data.publicUrl

      // Replace the blob URL with the real URL in the store
      if (replacePhoto) {
        replacePhoto(category, blobUrl, publicUrl)
      }

      decPending()
      console.log(`[EagerUpload] ✅ ${category}: uploaded successfully`)
    } catch (err) {
      console.warn(`[EagerUpload] ⚠️ Attempt ${attempt} failed for ${category}:`, err)
      if (attempt < MAX_ATTEMPTS) {
        // Wait a bit before retrying (exponential backoff)
        await new Promise(r => setTimeout(r, 1000 * attempt))
        return compressAndUpload(blobUrl, category, attempt + 1)
      }
      // All retries exhausted — mark as failed
      decPending()
      setFailedUrls(prev => new Set([...prev, blobUrl]))
    } finally {
      setUploadingUrls(prev => {
        const next = new Set(prev)
        next.delete(blobUrl)
        return next
      })
    }
  }

  const handleUploadClick = (category) => {
    setActiveCategory(category)
    if (fileInputRef.current) {
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
      // Start eager upload in background
      compressAndUpload(url, activeCategory)
    })
    
    e.target.value = null
  }

  return (
    <div className="step-container">
      <input 
        type="file" 
        accept="image/png, image/jpeg, image/webp" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={handleFileChange}
      />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="step-header" style={{ maxWidth: '36rem' }}>
          <h2 className="step-title">Sube fotos increíbles</h2>
          <p className="step-subtitle">
            Atrae a más pasajeros subiendo al menos 5 fotos. Las imágenes se suben automáticamente en segundo plano para acelerar la publicación.
          </p>
          
          {hasBookings && (
            <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#d97706', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, marginBottom: 'var(--space-6)' }}>
              ⚠️ Edición bloqueada. Esta travesía ya cuenta con reservas.
            </div>
          )}
        </div>
        <div style={{ textAlign: 'center', opacity: hasBookings ? 0.6 : 1, pointerEvents: hasBookings ? 'none' : 'auto' }}>
          <button 
            className="btn btn--outline" 
            style={{ borderRadius: '9999px' }}
            onClick={() => handleUploadClick('portada')}
          >
            <UploadCloud size={20} style={{ marginRight: '8px' }} />
            Cargar imágenes
          </button>
          <p className="step-subtitle" style={{ fontSize: '14px', marginTop: '8px', fontWeight: 600 }}>({getTotalPhotos()} fotos)</p>
          {uploadingUrls.size > 0 && (
            <p style={{ fontSize: '12px', color: 'var(--color-accent-500)', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <Loader size={12} className="spin" /> Subiendo {uploadingUrls.size}...
            </p>
          )}
          {failedUrls.size > 0 && uploadingUrls.size === 0 && (
            <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <AlertTriangle size={12} /> {failedUrls.size} foto(s) con error — usá el botón "Reintentar" en cada foto
            </p>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)', opacity: hasBookings ? 0.6 : 1, pointerEvents: hasBookings ? 'none' : 'auto' }}>
        
        {PHOTO_CATEGORIES.map((category) => {
          const isPortada = category.id === 'portada'
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
              <div style={{
                position: 'absolute', top: '12px', left: '12px',
                backgroundColor: 'var(--color-primary-500)', color: 'white',
                fontSize: '12px', fontWeight: 'bold', padding: '4px 12px',
                borderRadius: '9999px', zIndex: 10
              }}>
                {category.label}
              </div>

              <button 
                onClick={() => handleUploadClick(category.id)}
                style={{
                  position: 'absolute', top: '12px', right: '12px',
                  backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)',
                  padding: '8px', borderRadius: '50%', border: '1px solid var(--border-color)',
                  zIndex: 10, cursor: 'pointer', transition: 'color 0.3s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-accent-500)'}
                onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                title="Cargar foto en esta categoría"
              >
                <ImageIcon size={16} />
              </button>

              <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
                {urls.length === 0 ? (
                  <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255, 255, 255, 0.4)', gap: '12px' }}>
                    <ImageIcon size={48} style={{ opacity: 0.5 }} />
                    <button 
                      onClick={() => handleUploadClick(category.id)}
                      className="btn btn--outline btn--sm"
                      style={{ padding: '6px 16px', fontSize: '13px', borderRadius: '9999px', pointerEvents: 'auto', zIndex: 20 }}
                    >
                      Subir foto{isPortada ? '' : 's'}
                    </button>
                  </div>
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', flexWrap: 'wrap', gap: '4px', overflowY: 'auto', padding: '4px', boxSizing: 'border-box' }}>
                    {urls.map((url, i) => (
                      <div 
                        key={i} 
                        style={{
                          position: 'relative',
                          width: (isPortada || urls.length === 1) ? '100%' : 'calc(50% - 2px)',
                          height: (isPortada || urls.length === 1) ? '100%' : 'calc(50% - 2px)',
                          minHeight: urls.length > 2 ? '70px' : '100%',
                          flexGrow: 1
                        }}
                        className="photo-card-hover"
                      >
                        <img src={url} alt={category.label} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-lg)' }} />
                        {/* Upload indicator */}
                        {uploadingUrls.has(url) && (
                          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Loader size={24} color="white" className="spin" />
                          </div>
                        )}
                        {/* Failed upload indicator with retry */}
                        {failedUrls.has(url) && !uploadingUrls.has(url) && (
                          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(220, 38, 38, 0.6)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <AlertTriangle size={20} color="white" />
                            <button
                              onClick={(e) => { e.stopPropagation(); compressAndUpload(url, category.id) }}
                              style={{ background: 'white', color: '#dc2626', border: 'none', borderRadius: '9999px', padding: '4px 12px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <RefreshCw size={12} /> Reintentar
                            </button>
                          </div>
                        )}
                        <button 
                          onClick={() => removePhoto(category.id, url)}
                          className="photo-remove-btn"
                          style={{
                            position: 'absolute', top: '50%', left: '50%',
                            transform: 'translate(-50%, -50%)',
                            backgroundColor: 'var(--color-error-500)', color: 'white',
                            padding: '8px', borderRadius: '50%', border: 'none',
                            cursor: 'pointer', opacity: 0, transition: 'opacity 0.3s ease'
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
