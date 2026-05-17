import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, MoreVertical, Sailboat, AlertCircle, X } from 'lucide-react'
import useBoatStore from '../../stores/boatStore'
import './Dashboard.css'

export default function MyBoats() {
  const { boats, loading, fetchMyBoats, deleteBoat, createBoat } = useBoatStore()
  
  const [boatToDelete, setBoatToDelete] = useState(null)
  const [activeMenuId, setActiveMenuId] = useState(null)
  const [isCreating, setIsCreating] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newBoat, setNewBoat] = useState({ name: '', model: '', type: 'velero', length_m: '', cabins: '', bathrooms: '' })

  useEffect(() => { 
    fetchMyBoats() 
  }, [])

  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null)
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', month: '2-digit', year: '2-digit' 
    })
  }

  const handleDelete = async (e) => {
    e.stopPropagation()
    await deleteBoat(boatToDelete.id)
    setBoatToDelete(null)
    setActiveMenuId(null)
  }

  const handleCreate = async () => {
    if (!newBoat.name || !newBoat.type) return
    setCreating(true)
    const data = { 
      ...newBoat, 
      length_m: newBoat.length_m ? parseFloat(newBoat.length_m) : null,
      cabins: newBoat.cabins ? parseInt(newBoat.cabins) : 0,
      bathrooms: newBoat.bathrooms ? parseInt(newBoat.bathrooms) : 0
    }
    const result = await createBoat(data)
    setCreating(false)
    if (result.success) {
      setIsCreating(false)
      setNewBoat({ name: '', model: '', type: 'velero', length_m: '', cabins: '', bathrooms: '' })
    } else {
      alert("Error al crear: " + result.error)
    }
  }

  return (
    <div className="dash-page">
      
      {/* Principal Pane */}
      <div className="dash-pane">
        
        {/* Header */}
        <div className="dash-pane__header">
          <div className="dash-pane__header-left">
            <div className="dash-pane__icon" style={{ background: 'rgba(16, 89, 203, 0.15)', color: 'var(--color-primary-400)' }}>
              <Sailboat size={28} />
            </div>
            <h1 className="dash-pane__title">Embarcaciones</h1>
          </div>
          
          <button 
            className="btn btn--accent"
            style={{ padding: '12px 24px', fontSize: '0.95rem', borderRadius: 'var(--radius-xl)' }}
            onClick={() => setIsCreating(true)}
          >
            <Plus size={18} /> Agregar embarcación
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="dash-pane__empty">
            <div className="dash-spinner"></div>
            <p style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Cargando flota...</p>
          </div>
        )}

        {/* Empty */}
        {!loading && boats.length === 0 && (
          <div className="dash-pane__empty dash-pane__empty--dashed">
            <Sailboat size={64} style={{ color: 'rgba(255,255,255,0.1)', marginBottom: '16px' }} />
            <h3 className="dash-pane__empty-title">Sin embarcaciones</h3>
            <p className="dash-pane__empty-desc">Agrega tu primera embarcación para poder publicarla en futuras travesías.</p>
            <button 
              className="btn btn--outline"
              style={{ borderRadius: '9999px', padding: '12px 32px', marginTop: '8px' }}
              onClick={() => setIsCreating(true)}
            >
              Crear mi embarcación
            </button>
          </div>
        )}

        {/* Data Table */}
        {!loading && boats.length > 0 && (
          <div style={{ overflowX: 'auto', width: '100%', paddingBottom: '128px' }}>
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Alias de la Embarcación</th>
                  <th className="dash-table__hide-mobile">Creado</th>
                  <th className="dash-table__hide-mobile">Modificado</th>
                  <th style={{ textAlign: 'right', paddingRight: '24px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {boats.map((boat, idx) => (
                  <tr key={boat.id} className={idx % 2 === 0 ? 'dash-table__row--even' : ''}>
                    
                    <td style={{ maxWidth: '200px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{boat.name}</span>
                      {boat.manufacturer && (
                        <span style={{ display: 'block', fontSize: '12px', fontWeight: 400, color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {boat.manufacturer} {boat.model}
                        </span>
                      )}
                    </td>

                    <td className="dash-table__hide-mobile" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{formatDate(boat.created_at)}</td>
                    <td className="dash-table__hide-mobile" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{formatDate(boat.updated_at)}</td>

                    <td style={{ textAlign: 'right', paddingRight: '24px', position: 'relative' }}>
                      {/* Desktop inline actions */}
                      <div className="dash-table__inline-actions">
                        <button className="dash-table__action-link">Copiar</button>
                        <button className="dash-table__action-link">Editar</button>
                        <button 
                          className="dash-table__action-link dash-table__action-link--danger"
                          onClick={(e) => {
                            e.stopPropagation()
                            setBoatToDelete(boat)
                          }}
                        >
                          Eliminar
                        </button>
                      </div>

                      {/* Mobile dropdown */}
                      <div className="dash-table__mobile-actions">
                        <button 
                          className="dash-menu-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveMenuId(activeMenuId === boat.id ? null : boat.id)
                          }}
                        >
                          <MoreVertical size={20} />
                        </button>

                        {activeMenuId === boat.id && (
                          <div className="dash-dropdown" onClick={(e) => e.stopPropagation()}>
                            <button className="dash-dropdown__item">Copiar</button>
                            <button className="dash-dropdown__item">Editar</button>
                            <button 
                              className="dash-dropdown__item dash-dropdown__item--danger"
                              onClick={() => {
                                setBoatToDelete(boat)
                                setActiveMenuId(null)
                              }}
                            >
                              Eliminar
                            </button>
                          </div>
                        )}
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {boatToDelete && (
        <div className="dash-modal-overlay">
          <div className="dash-modal">
            
            <div className="dash-modal__icon dash-modal__icon--danger">
              <AlertCircle size={32} />
            </div>

            <h3 className="dash-modal__title">Estás por eliminar esta embarcación</h3>
            <p className="dash-modal__desc">
              Si eliminas <strong>{boatToDelete.name}</strong>, esta no podrá ser asignada a futuras travesías.
            </p>

            <div className="dash-modal__actions">
              <button onClick={() => setBoatToDelete(null)} className="btn btn--primary" style={{ width: '100%', height: '48px', borderRadius: 'var(--radius-xl)' }}>
                No, mantener embarcación
              </button>
              <button onClick={handleDelete} className="btn btn--danger" style={{ width: '100%', height: '48px', borderRadius: 'var(--radius-xl)' }}>
                Eliminar definitivamente
              </button>
            </div>
            
          </div>
        </div>
      )}

      {/* Create Boat Modal */}
      {isCreating && (
        <div className="dash-modal-overlay">
          <div className="dash-modal animate-fade-in" style={{ textAlign: 'left', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 className="dash-modal__title" style={{ margin: 0 }}>Agregar Embarcación</h3>
              <button onClick={() => setIsCreating(false)} className="btn btn--ghost btn--sm" style={{ padding: '8px' }}>
                <X size={20} />
              </button>
            </div>

            <div className="input-group">
              <label>Alias / Nombre de la embarcación *</label>
              <input 
                className="input" 
                placeholder="Ej: Velero Santa María" 
                value={newBoat.name} 
                onChange={(e) => setNewBoat(p => ({ ...p, name: e.target.value }))} 
                autoFocus 
              />
            </div>

            <div className="input-group" style={{ marginTop: '16px' }}>
              <label>Marca / Modelo del velero (Opcional)</label>
              <input 
                className="input" 
                placeholder="Ej: Bavaria 34 Cruiser" 
                value={newBoat.model} 
                onChange={(e) => setNewBoat(p => ({ ...p, model: e.target.value }))} 
              />
            </div>

            <div className="form-row" style={{ marginTop: '16px' }}>
              <div className="input-group">
                <label>Tipo *</label>
                <select 
                  className="input" 
                  value={newBoat.type} 
                  onChange={(e) => setNewBoat(p => ({ ...p, type: e.target.value }))}
                >
                  <option value="velero">Velero</option>
                  <option value="catamaran">Catamarán</option>
                </select>
              </div>
              <div className="input-group">
                <label>Eslora (metros)</label>
                <input 
                  className="input" 
                  type="number" 
                  min="1" 
                  placeholder="Ej: 12" 
                  value={newBoat.length_m} 
                  onChange={(e) => setNewBoat(p => ({ ...p, length_m: e.target.value }))} 
                />
              </div>
            </div>

            <div className="form-row" style={{ marginTop: '16px' }}>
              <div className="input-group">
                <label>Cantidad de camarotes</label>
                <input 
                  className="input" 
                  type="number" 
                  min="0" 
                  placeholder="Ej: 2" 
                  value={newBoat.cabins} 
                  onChange={(e) => setNewBoat(p => ({ ...p, cabins: e.target.value }))} 
                />
              </div>
              <div className="input-group">
                <label>Cantidad de baños</label>
                <input 
                  className="input" 
                  type="number" 
                  min="0" 
                  placeholder="Ej: 1" 
                  value={newBoat.bathrooms} 
                  onChange={(e) => setNewBoat(p => ({ ...p, bathrooms: e.target.value }))} 
                />
              </div>
            </div>

            <div className="dash-modal__actions" style={{ marginTop: '32px', gridTemplateColumns: '1fr 1fr' }}>
              <button onClick={() => setIsCreating(false)} className="btn btn--ghost">
                Cancelar
              </button>
              <button onClick={handleCreate} className="btn btn--accent" disabled={!newBoat.name || !newBoat.type || creating}>
                {creating ? 'Guardando...' : 'Guardar Embarcación'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
