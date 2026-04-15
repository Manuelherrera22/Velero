import { useEffect, useState } from 'react'
import { Ship, Plus, Edit3, Trash2, X, Save, Loader } from 'lucide-react'
import useBoatStore from '../../stores/boatStore'

export default function MyBoats() {
  const { boats, loading, fetchMyBoats, createBoat, updateBoat, deleteBoat } = useBoatStore()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', type: 'velero', length_m: '', amenities: '', description: ''
  })

  useEffect(() => { fetchMyBoats() }, [])

  const resetForm = () => {
    setForm({ name: '', type: 'velero', length_m: '', amenities: '', description: '' })
    setShowForm(false)
    setEditingId(null)
  }

  const startEdit = (boat) => {
    setForm({
      name: boat.name, type: boat.type, length_m: boat.length_m || '',
      amenities: boat.amenities || '', description: boat.description || ''
    })
    setEditingId(boat.id)
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.name) return
    setSaving(true)
    const data = { ...form, length_m: form.length_m ? parseFloat(form.length_m) : null }

    if (editingId) {
      await updateBoat(editingId, data)
    } else {
      await createBoat(data)
    }

    setSaving(false)
    resetForm()
  }

  const handleDelete = async (id) => {
    if (confirm('¿Estás seguro de eliminar esta embarcación?')) {
      await deleteBoat(id)
    }
  }

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  return (
    <div>
      <div className="dashboard__header">
        <h1 className="dashboard__title">Embarcaciones</h1>
        {!showForm && (
          <button className="btn btn--accent btn--sm" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Nueva Embarcación
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="item-card glass" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="item-card__header">
            <h3 className="item-card__title">{editingId ? 'Editar' : 'Nueva'} Embarcación</h3>
            <button className="btn btn--ghost btn--sm" onClick={resetForm}><X size={14} /></button>
          </div>

          <div className="form-row">
            <div className="input-group">
              <label>Nombre *</label>
              <input className="input" placeholder="Ej: Viento Sur" value={form.name} onChange={(e) => updateField('name', e.target.value)} />
            </div>
            <div className="input-group">
              <label>Tipo</label>
              <select className="input" value={form.type} onChange={(e) => updateField('type', e.target.value)}>
                <option value="velero">Velero</option>
                <option value="catamaran">Catamarán</option>
                <option value="lancha">Lancha</option>
                <option value="yate">Yate</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="input-group">
              <label>Eslora (metros)</label>
              <input className="input" type="number" step="0.1" placeholder="9.7" value={form.length_m} onChange={(e) => updateField('length_m', e.target.value)} />
            </div>
            <div className="input-group">
              <label>Comodidades</label>
              <input className="input" placeholder="Ej: Baño, cocina, toldo, GPS" value={form.amenities} onChange={(e) => updateField('amenities', e.target.value)} />
            </div>
          </div>

          <div className="input-group">
            <label>Descripción</label>
            <textarea className="input" rows={3} placeholder="Descripción de la embarcación..." value={form.description} onChange={(e) => updateField('description', e.target.value)} />
          </div>

          <button className="btn btn--accent" onClick={handleSave} disabled={saving} style={{ alignSelf: 'flex-end' }}>
            {saving ? <Loader size={16} className="spin" /> : <><Save size={16} /> {editingId ? 'Guardar' : 'Crear'}</>}
          </button>
        </div>
      )}

      {/* List */}
      {loading && <div className="protected-loading"><p>Cargando...</p></div>}

      {!loading && boats.length === 0 && !showForm && (
        <div className="dashboard__empty">
          <div className="dashboard__empty-icon"><Ship size={48} /></div>
          <h3>Sin embarcaciones</h3>
          <p>Agrega tu primera embarcación para poder publicar travesías.</p>
          <button className="btn btn--accent" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Agregar embarcación
          </button>
        </div>
      )}

      <div className="dashboard__grid">
        {boats.map(boat => (
          <div key={boat.id} className="item-card glass">
            <div className="item-card__header">
              <div>
                <h3 className="item-card__title">{boat.name}</h3>
                <p className="item-card__subtitle">{boat.type} · {boat.length_m ? `${boat.length_m}m` : 'Eslora no especificada'}</p>
              </div>
            </div>
            {boat.amenities && <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{boat.amenities}</p>}
            <div className="item-card__actions" style={{ marginTop: 'auto' }}>
              <button className="btn btn--ghost btn--sm" style={{ flex: 1 }} onClick={() => startEdit(boat)}>
                <Edit3 size={14} /> Editar
              </button>
              <button className="btn btn--ghost btn--sm" style={{ color: 'var(--color-coral-400)' }} onClick={() => handleDelete(boat.id)}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
