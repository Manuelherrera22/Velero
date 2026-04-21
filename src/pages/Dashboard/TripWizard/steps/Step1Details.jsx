import React from 'react'
import { useTripWizardStore } from '../../../../stores/useTripWizardStore'

const Step1Details = () => {
  const { formData, updateFormData } = useTripWizardStore()

  const handleRoleChange = (role) => {
    updateFormData({ role_in_activity: role })
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="space-y-2">
        <h2 className="text-3xl font-bold bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
          Cuentános sobre tu travesía
        </h2>
        <p className="text-muted-foreground text-lg">
          Empecemos con lo básico. Un buen título y descripción ayudarán a los viajeros a enamorarse de tu propuesta.
        </p>
      </div>

      <div className="space-y-6">
        {/* Título */}
        <div className="space-y-3">
          <label className="text-sm font-bold tracking-tight text-foreground/80 uppercase">
            Título de la travesía *
          </label>
          <input
            type="text"
            className="input input-bordered w-full h-14 text-lg"
            placeholder="Ej: Navegación de atardecer por el Río de la Plata"
            value={formData.title}
            onChange={(e) => updateFormData({ title: e.target.value })}
            autoFocus
          />
        </div>

        {/* Descripción */}
        <div className="space-y-3">
          <label className="text-sm font-bold tracking-tight text-foreground/80 uppercase">
            Descripción promocional *
          </label>
          <textarea
            className="textarea textarea-bordered w-full text-base min-h-[160px]"
            placeholder="Describe la experiencia general, qué la hace única, los paisajes y emociones..."
            value={formData.description}
            onChange={(e) => updateFormData({ description: e.target.value })}
          />
        </div>

        {/* Rol del organizador */}
        <div className="space-y-4 pt-4 border-t border-border/50">
          <label className="text-sm font-bold tracking-tight text-foreground/80 uppercase block">
            ¿Cuál será tu rol en esta travesía?
          </label>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Opción Capitán */}
            <label 
              className={`relative flex cursor-pointer flex-col p-6 rounded-2xl border-2 transition-all duration-300 ${
                formData.role_in_activity === 'capitan' 
                ? 'border-accent bg-accent/5 shadow-md scale-[1.02]' 
                : 'border-border/60 hover:border-accent/50 hover:bg-secondary/20'
              }`}
            >
              <input 
                type="radio" 
                name="role_in_activity"
                value="capitan"
                checked={formData.role_in_activity === 'capitan'}
                onChange={() => handleRoleChange('capitan')}
                className="sr-only"
              />
              <span className="font-bold text-lg mb-1">Capitán</span>
              <span className="text-sm text-muted-foreground">Seré yo quien navegue la embarcación durante toda la experiencia.</span>
              
              <div className={`absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                formData.role_in_activity === 'capitan' ? 'border-accent bg-accent' : 'border-muted-foreground/30'
              }`}>
                {formData.role_in_activity === 'capitan' && <div className="w-2.5 h-2.5 bg-accent-content rounded-full" />}
              </div>
            </label>

            {/* Opción Coordinador */}
            <label 
              className={`relative flex cursor-pointer flex-col p-6 rounded-2xl border-2 transition-all duration-300 ${
                formData.role_in_activity === 'coordinador' 
                ? 'border-accent bg-accent/5 shadow-md scale-[1.02]' 
                : 'border-border/60 hover:border-accent/50 hover:bg-secondary/20'
              }`}
            >
              <input 
                type="radio" 
                name="role_in_activity"
                value="coordinador"
                checked={formData.role_in_activity === 'coordinador'}
                onChange={() => handleRoleChange('coordinador')}
                className="sr-only"
              />
              <span className="font-bold text-lg mb-1">Coordinador</span>
              <span className="text-sm text-muted-foreground">Organizo la actividad pero otra persona certificada patroneará el barco.</span>
              
              <div className={`absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                formData.role_in_activity === 'coordinador' ? 'border-accent bg-accent' : 'border-muted-foreground/30'
              }`}>
                {formData.role_in_activity === 'coordinador' && <div className="w-2.5 h-2.5 bg-accent-content rounded-full" />}
              </div>
            </label>
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-4 pt-4 border-t border-border/50">
          <label className="text-sm font-bold tracking-tight text-foreground/80 uppercase block">
            Categorías y Etiquetas
          </label>
          <p className="text-sm text-muted-foreground mb-2">Seleccioná los tags que describen tu travesía o escribí los tuyos presionando Enter.</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {['Romántico', 'Aventura', 'Atardecer', 'Pesca', 'Relax', 'Fiesta'].map(tag => (
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
                className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                  (formData.tags || []).includes(tag)
                    ? 'bg-primary text-primary-content border-primary'
                    : 'bg-secondary/20 border-border/50 text-foreground/80 hover:border-primary/50'
                } border`}
              >
                {tag}
              </button>
            ))}
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Escribir nuevo tag y presionar Enter..."
              className="input input-bordered w-full"
              onKeyDown={(e) => {
                const currentTags = formData.tags || [];
                if (e.key === 'Enter' && e.target.value.trim() !== '') {
                  e.preventDefault();
                  const newTag = e.target.value.trim().charAt(0).toUpperCase() + e.target.value.trim().slice(1);
                  if (!currentTags.includes(newTag)) {
                    updateFormData({ tags: [...currentTags, newTag] });
                  }
                  e.target.value = '';
                }
              }}
            />
          </div>
          
          {/* Custom Tags rendering */}
          {formData.tags?.filter(t => !['Romántico', 'Aventura', 'Atardecer', 'Pesca', 'Relax', 'Fiesta'].includes(t)).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {formData.tags.filter(t => !['Romántico', 'Aventura', 'Atardecer', 'Pesca', 'Relax', 'Fiesta'].includes(t)).map(tag => (
                <span key={tag} className="px-3 py-1 bg-secondary text-secondary-foreground text-sm rounded-full flex items-center border border-border">
                  {tag}
                  <button 
                    type="button" 
                    className="ml-2 text-muted-foreground hover:text-foreground"
                    onClick={() => updateFormData({ tags: formData.tags.filter(t => t !== tag) })}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default Step1Details
