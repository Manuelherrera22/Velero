import React, { useState } from 'react'
import { useTripWizardStore } from '../../../../stores/useTripWizardStore'
import { Plus, Trash2, Wine, FileText } from 'lucide-react'

const Step6Addons = () => {
  const { formData, addAddon, removeAddon, updateAddon, hasBookings } = useTripWizardStore()
  const addons = formData.addons || []

  const [newAddon, setNewAddon] = useState({ name: '', description: '', price: '' })

  const handleAdd = () => {
    if (!newAddon.name.trim() || !newAddon.price) return
    addAddon({
      id: `new_${Date.now()}`,
      name: newAddon.name.trim(),
      description: newAddon.description.trim(),
      price: parseFloat(newAddon.price) || 0
    })
    setNewAddon({ name: '', description: '', price: '' })
  }

  const formatPrice = (value) => {
    return Number(value || 0).toLocaleString('es-AR')
  }

  return (
    <div className="step-container">
      <div className="step-header">
        <h2 className="step-title">Adicionales opcionales</h2>
        <p className="step-subtitle">
          Ofrecé extras como vinos, picadas o excursiones que los pasajeros pueden agregar a su reserva. Estos adicionales no se ven afectados por descuentos.
        </p>
      </div>

      {hasBookings && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, marginBottom: 'var(--space-6)' }}>
          ⚠️ Esta travesía ya tiene reservas. No se pueden modificar los adicionales.
        </div>
      )}

      {/* Add new addon form */}
      <div style={{ backgroundColor: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-6)', marginBottom: 'var(--space-6)', opacity: hasBookings ? 0.5 : 1, pointerEvents: hasBookings ? 'none' : 'auto' }}>
        <label className="form-group__label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', color: 'var(--text-primary)' }}>
          <Plus size={18} /> Agregar un adicional
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 'var(--space-4)', alignItems: 'end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', display: 'block', fontWeight: 'bold' }}>Nombre *</label>
            <div className="input-with-icon">
              <Wine className="input-icon" size={16} />
              <input
                type="text"
                className="input-control"
                style={{ paddingLeft: '36px' }}
                placeholder="Ej: Botella de Malbec"
                value={newAddon.name}
                onChange={(e) => setNewAddon({ ...newAddon, name: e.target.value })}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', display: 'block', fontWeight: 'bold' }}>Precio *</label>
            <div className="input-with-icon">
              <span className="input-icon" style={{ fontWeight: 'bold' }}>$</span>
              <input
                type="number"
                className="input-control"
                style={{ paddingLeft: '36px', fontWeight: 'bold' }}
                placeholder="0"
                value={newAddon.price}
                onChange={(e) => setNewAddon({ ...newAddon, price: e.target.value })}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
              />
            </div>
          </div>

          <button
            className="btn btn--accent"
            style={{ height: '44px', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
            onClick={handleAdd}
            disabled={!newAddon.name.trim() || !newAddon.price}
          >
            <Plus size={16} /> Agregar
          </button>
        </div>

        <div className="form-group" style={{ marginBottom: 0, marginTop: 'var(--space-4)' }}>
          <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', display: 'block', fontWeight: 'bold' }}>Descripción (opcional)</label>
          <div className="input-with-icon">
            <FileText className="input-icon" size={16} />
            <input
              type="text"
              className="input-control"
              style={{ paddingLeft: '36px' }}
              placeholder="Ej: Vino tinto de Mendoza, cosecha 2020"
              value={newAddon.description}
              onChange={(e) => setNewAddon({ ...newAddon, description: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* List of addons */}
      <div style={{ backgroundColor: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--border-color)', paddingBottom: 'var(--space-2)' }}>
          <h3 style={{ fontWeight: 'bold', fontSize: '18px', color: 'var(--text-primary)' }}>Adicionales creados</h3>
          <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{addons.length} extra{addons.length !== 1 ? 's' : ''}</span>
        </div>

        {addons.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-8) 0', color: 'var(--text-muted)' }}>
            <Wine size={40} style={{ opacity: 0.3, marginBottom: 'var(--space-2)' }} />
            <p>Aún no agregaste adicionales.</p>
            <p style={{ fontSize: '13px', marginTop: '4px' }}>Los adicionales son opcionales para los pasajeros y se suman al precio base.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {addons.map((addon) => (
              <div
                key={addon.id}
                className="addon-row-hover"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--space-4)',
                  backgroundColor: 'rgba(0,0,0,0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-xl)',
                  transition: 'border-color 0.3s ease'
                }}
              >
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '2px' }}>
                    🎁 {addon.name}
                  </p>
                  {addon.description && (
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{addon.description}</p>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '2px' }}>Precio</p>
                    <p style={{ fontWeight: 'bold', color: 'var(--color-accent-500)', fontSize: '16px' }}>$ {formatPrice(addon.price)}</p>
                  </div>
                  {!hasBookings && (
                    <button
                      onClick={() => removeAddon(addon.id)}
                      className="addon-remove-btn"
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: 'rgba(239, 68, 68, 0.6)',
                        padding: '8px',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        opacity: 0,
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .addon-row-hover:hover {
          border-color: rgba(0, 180, 180, 0.4) !important;
          background-color: white !important;
        }
        .addon-row-hover:hover .addon-remove-btn {
          opacity: 1 !important;
        }
        .addon-remove-btn:hover {
          color: var(--color-error-500) !important;
          background-color: rgba(239, 68, 68, 0.1) !important;
        }
      `}</style>
    </div>
  )
}

export default Step6Addons
