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

  // Simplified mockup for photo uploading
  const handleSimulatedUpload = (category) => {
    // In production, this would trigger a Supabase Storage upload
    const mockUrl = `https://picsum.photos/seed/${Math.random()}/800/600`
    addPhoto(category, mockUrl)
  }

  const getTotalPhotos = () => {
    let count = formData.images_meta.portada ? 1 : 0
    PHOTO_CATEGORIES.slice(1).forEach(cat => {
      count += (formData.images_meta[cat.id] || []).length
    })
    return count
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex justify-between items-start">
        <div className="space-y-2 max-w-xl">
          <h2 className="text-3xl font-bold bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
            Sube fotos increíbles
          </h2>
          <p className="text-muted-foreground text-lg">
            Atrae a más pasajeros subiendo al menos 5 fotos que representen la experiencia de paisajes, actividades y la embarcación.
          </p>
        </div>
        <div className="text-center">
          <button className="btn btn-outline btn-primary rounded-full">
            <UploadCloud className="w-5 h-5 mr-2" />
            Cargar imágenes
          </button>
          <p className="text-sm font-semibold text-muted-foreground mt-2">({getTotalPhotos()} fotos)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {PHOTO_CATEGORIES.map((category) => {
          const isPortada = category.id === 'portada'
          // Extract matching urls
          const urls = isPortada 
            ? formData.images_meta.portada ? [formData.images_meta.portada] : []
            : formData.images_meta[category.id] || []

          return (
            <div 
              key={category.id} 
              className={`relative bg-secondary/20 rounded-2xl border-2 border-dashed ${urls.length > 0 ? 'border-primary/50' : 'border-border/60 hover:border-accent/40'} min-h-[160px] flex items-center justify-center overflow-hidden group transition-colors`}
            >
              {/* Category Badge */}
              <div className="absolute top-3 left-3 bg-primary text-primary-content text-xs font-bold px-3 py-1 rounded-full shadow-sm z-10 w-fit">
                {category.label}
              </div>

              {/* Upload Trigger / Edit */}
              <button 
                onClick={() => handleSimulatedUpload(category.id)}
                className="absolute top-3 right-3 bg-background text-foreground p-2 rounded-full shadow border hover:text-accent z-10"
                title="Cargar foto en esta categoría"
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              {/* Render Images wrapper */}
              <div className="absolute inset-0 flex">
                {urls.length === 0 ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/50 opacity-40">
                    <ImageIcon className="w-16 h-16" />
                  </div>
                ) : (
                  <div className={`w-full flex ${urls.length > 1 ? 'overflow-x-auto snap-x' : ''}`}>
                    {urls.map((url, i) => (
                      <div key={i} className={`relative flex-shrink-0 ${isPortada || urls.length === 1 ? 'w-full' : 'w-4/5'} h-full snap-center group/img`}>
                        <img src={url} alt={category.label} className="w-full h-full object-cover" />
                        <button 
                          onClick={() => removePhoto(category.id, url)}
                          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity drop-shadow-md hover:bg-red-600"
                        >
                          <X className="w-5 h-5" />
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

    </div>
  )
}

export default Step4Photos
