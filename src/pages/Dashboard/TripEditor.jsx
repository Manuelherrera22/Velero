import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Save, ArrowLeft, MapPin, DollarSign, Users, Calendar, Plus, X, Tag, Package, Loader, Image as ImageIcon } from 'lucide-react'
import useTripStore from '../../stores/tripStore'
import useBoatStore from '../../stores/boatStore'
import ImageUploader from '../../components/ImageUploader'

export default function TripEditor() {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const isEditing = !!tripId

  const { fetchTrip, createTrip, updateTrip, addTripDate, removeTripDate, addTripAddon, removeTripAddon, uploadTripImage, removeTripImage, tripDates, tripAddons, currentTrip, tags, fetchTags, loading } = useTripStore()
  const { boats, fetchMyBoats } = useBoatStore()

  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    capacity: 6,
    price_per_person: '',
    currency: 'ARS',
    boat_id: '',
    tags: [],
  })

  const [newDate, setNewDate] = useState({ date: '', start_time: '10:00', end_time: '', spots: 6 })
  const [newAddon, setNewAddon] = useState({ name: '', description: '', price: '' })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchTags()
    fetchMyBoats()
    if (isEditing) {
      fetchTrip(tripId).then(result => {
        if (result?.trip) {
          setForm({
            title: result.trip.title || '',
            description: result.trip.description || '',
            location: result.trip.location || '',
            capacity: result.trip.capacity || 6,
            price_per_person: result.trip.price_per_person || '',
            currency: result.trip.currency || 'ARS',
            boat_id: result.trip.boat_id || '',
            tags: result.trip.tags || [],
          })
        }
      })
    }
  }, [tripId])

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const toggleTag = (tagName) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tagName)
        ? prev.tags.filter(t => t !== tagName)
        : [...prev.tags, tagName]
    }))
  }

  const handleSave = async () => {
    if (!form.title || !form.location || !form.price_per_person) return
    setSaving(true)

    const tripData = {
      ...form,
      price_per_person: parseFloat(form.price_per_person),
      capacity: parseInt(form.capacity),
      boat_id: form.boat_id || null,
    }

    let result
    if (isEditing) {
      result = await updateTrip(tripId, tripData)
    } else {
      result = await createTrip(tripData)
    }

    setSaving(false)
    if (result.success) {
      if (!isEditing && result.data?.id) {
        navigate(`/dashboard/travesias/${result.data.id}/editar`)
      }
    }
  }

  const handleAddDate = async () => {
    if (!newDate.date || !newDate.start_time || !tripId) return
    await addTripDate({
      trip_id: tripId,
      date: newDate.date,
      start_time: newDate.start_time,
      end_time: newDate.end_time || null,
      available_spots: parseInt(newDate.spots) || form.capacity,
    })
    setNewDate({ date: '', start_time: '10:00', end_time: '', spots: form.capacity })
  }

  const handleAddAddon = async () => {
    if (!newAddon.name || !newAddon.price || !tripId) return
    await addTripAddon({
      trip_id: tripId,
      name: newAddon.name,
      description: newAddon.description,
      price: parseFloat(newAddon.price),
    })
    setNewAddon({ name: '', description: '', price: '' })
  }

  const handleImageUpload = async (files) => {
    if (!tripId) return
    setUploading(true)
    for (const file of files) {
      await uploadTripImage(tripId, file)
    }
    setUploading(false)
  }

  const handleImageRemove = async (url) => {
    if (!tripId) return
    await removeTripImage(tripId, url)
  }

  return (
    <div>
      <div className="dashboard__header">
        <button onClick={() => navigate('/dashboard/travesias')} className="btn btn--ghost btn--sm">
          <ArrowLeft size={16} /> Volver
        </button>
        <button onClick={handleSave} className="btn btn--accent btn--sm" disabled={saving}>
          {saving ? <Loader size={16} className="spin" /> : <><Save size={16} /> {isEditing ? 'Guardar Cambios' : 'Crear Travesía'}</>}
        </button>
      </div>

      <h1 className="dashboard__title" style={{ marginBottom: 'var(--space-8)' }}>
        {isEditing ? 'Editar Travesía' : 'Nueva Travesía'}
      </h1>

      {/* Basic Info */}
      <div className="form-section">
        <h3 className="form-section__title"><MapPin size={18} /> Información Básica</h3>

        <div className="input-group">
          <label>Título *</label>
          <input className="input" placeholder="Ej: Paseo por el Río de la Plata" value={form.title} onChange={(e) => updateField('title', e.target.value)} required />
        </div>

        <div className="input-group">
          <label>Descripción e Itinerario</label>
          <textarea className="input" placeholder="Describe la experiencia, qué incluye, el recorrido, punto de encuentro..." value={form.description} onChange={(e) => updateField('description', e.target.value)} rows={6} />
        </div>

        <div className="form-row">
          <div className="input-group">
            <label>Ubicación *</label>
            <input className="input" placeholder="Ej: San Fernando, Buenos Aires" value={form.location} onChange={(e) => updateField('location', e.target.value)} required />
          </div>
          <div className="input-group">
            <label>Capacidad (personas)</label>
            <input className="input" type="number" min={1} max={50} value={form.capacity} onChange={(e) => updateField('capacity', e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <div className="input-group">
            <label>Precio por persona *</label>
            <input className="input" type="number" min={0} step="0.01" placeholder="25000" value={form.price_per_person} onChange={(e) => updateField('price_per_person', e.target.value)} required />
          </div>
          <div className="input-group">
            <label>Moneda</label>
            <select className="input" value={form.currency} onChange={(e) => updateField('currency', e.target.value)}>
              <option value="ARS">ARS (Peso Argentino)</option>
              <option value="EUR">EUR (Euro)</option>
              <option value="USD">USD (Dólar)</option>
            </select>
          </div>
        </div>

        <div className="input-group">
          <label>Embarcación</label>
          <select className="input" value={form.boat_id} onChange={(e) => updateField('boat_id', e.target.value)}>
            <option value="">Seleccionar embarcación...</option>
            {boats.map(b => (
              <option key={b.id} value={b.id}>{b.name} ({b.type} · {b.length_m}m)</option>
            ))}
          </select>
          {boats.length === 0 && (
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '4px' }}>
              Primero agrega una embarcación en la sección "Embarcaciones"
            </p>
          )}
        </div>
      </div>

      {/* Tags */}
      <div className="form-section">
        <h3 className="form-section__title"><Tag size={18} /> Categorías / Tags</h3>
        <div className="tag-selector">
          {tags.map(tag => (
            <button key={tag.id} className={`tag-btn ${form.tags.includes(tag.name) ? 'tag-btn--selected' : ''}`} onClick={() => toggleTag(tag.name)}>
              {tag.name}
            </button>
          ))}
        </div>
      </div>

      {/* Images — only if editing */}
      {isEditing && (
        <div className="form-section">
          <h3 className="form-section__title"><ImageIcon size={18} /> Fotos de la Travesía</h3>
          <ImageUploader
            images={currentTrip?.images || []}
            onUpload={handleImageUpload}
            onRemove={handleImageRemove}
            maxImages={6}
            loading={uploading}
          />
        </div>
      )}

      {/* Dates — only if editing */}
      {isEditing && (
        <div className="form-section">
          <h3 className="form-section__title"><Calendar size={18} /> Fechas Disponibles</h3>

          <div className="dates-list">
            {tripDates.map(d => (
              <div key={d.id} className="date-item">
                <div className="date-item__info">
                  <span>{new Date(d.date + 'T12:00:00').toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span>{d.start_time}hs{d.end_time ? ` - ${d.end_time}hs` : ''}</span>
                  <span style={{ color: 'var(--color-accent-400)' }}>{d.available_spots} lugares</span>
                </div>
                <button className="btn btn--ghost btn--sm" onClick={() => removeTripDate(d.id)}><X size={14} /></button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
            <input type="date" className="input" style={{ flex: 1, minWidth: 150 }} value={newDate.date} onChange={(e) => setNewDate(p => ({ ...p, date: e.target.value }))} />
            <input type="time" className="input" style={{ width: 120 }} value={newDate.start_time} onChange={(e) => setNewDate(p => ({ ...p, start_time: e.target.value }))} />
            <input type="number" className="input" style={{ width: 80 }} placeholder="Lugares" value={newDate.spots} onChange={(e) => setNewDate(p => ({ ...p, spots: e.target.value }))} />
            <button className="btn btn--accent btn--sm" onClick={handleAddDate}><Plus size={16} /> Agregar</button>
          </div>
        </div>
      )}

      {/* Addons — only if editing */}
      {isEditing && (
        <div className="form-section">
          <h3 className="form-section__title"><Package size={18} /> Extras / Servicios Adicionales</h3>

          <div className="dates-list">
            {tripAddons.map(a => (
              <div key={a.id} className="addon-item">
                <div>
                  <strong>{a.name}</strong>
                  {a.description && <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{a.description}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="addon-item__price">${a.price?.toLocaleString('es-AR')}</span>
                  <button className="btn btn--ghost btn--sm" onClick={() => removeTripAddon(a.id)}><X size={14} /></button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
            <input className="input" style={{ flex: 2, minWidth: 150 }} placeholder="Nombre del extra" value={newAddon.name} onChange={(e) => setNewAddon(p => ({ ...p, name: e.target.value }))} />
            <input className="input" type="number" style={{ width: 100 }} placeholder="Precio" value={newAddon.price} onChange={(e) => setNewAddon(p => ({ ...p, price: e.target.value }))} />
            <button className="btn btn--accent btn--sm" onClick={handleAddAddon}><Plus size={16} /> Agregar</button>
          </div>
        </div>
      )}

      {!isEditing && (
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginTop: 'var(--space-4)' }}>
          * Guarda la travesía primero para agregar fechas y extras. Será enviada a revisión antes de publicarse.
        </p>
      )}
    </div>
  )
}
