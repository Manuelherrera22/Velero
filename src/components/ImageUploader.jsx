import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon, Loader } from 'lucide-react'
import './ImageUploader.css'

export default function ImageUploader({ images = [], onUpload, onRemove, maxImages = 6, loading = false }) {
  const fileInputRef = useRef(null)
  const [dragActive, setDragActive] = useState(false)

  const handleFiles = (files) => {
    const validFiles = Array.from(files).filter(f =>
      f.type.startsWith('image/') && f.size <= 5 * 1024 * 1024 // Max 5MB
    )
    if (validFiles.length > 0 && onUpload) {
      onUpload(validFiles)
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files?.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleInputChange = (e) => {
    if (e.target.files?.length > 0) {
      handleFiles(e.target.files)
      e.target.value = '' // Reset for re-upload
    }
  }

  const canUpload = images.length < maxImages

  return (
    <div className="image-uploader">
      {/* Existing images */}
      {images.length > 0 && (
        <div className="image-uploader__grid">
          {images.map((url, i) => (
            <div key={i} className="image-uploader__item">
              <img src={url} alt={`Imagen ${i + 1}`} />
              <button
                className="image-uploader__remove"
                onClick={() => onRemove && onRemove(url, i)}
                title="Eliminar imagen"
              >
                <X size={14} />
              </button>
              {i === 0 && <span className="image-uploader__badge">Principal</span>}
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {canUpload && (
        <div
          className={`image-uploader__dropzone ${dragActive ? 'image-uploader__dropzone--active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          {loading ? (
            <>
              <Loader size={28} className="spin" />
              <p>Subiendo imagen...</p>
            </>
          ) : (
            <>
              <Upload size={28} />
              <p>Arrastrá imágenes acá o <span>hacé click para subir</span></p>
              <small>{images.length}/{maxImages} imágenes · Máx 5MB · JPG, PNG, WebP</small>
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleInputChange}
        style={{ display: 'none' }}
      />
    </div>
  )
}
