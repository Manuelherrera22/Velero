import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, MoreVertical, Compass, AlertCircle } from 'lucide-react'
import useTripStore from '../../stores/tripStore'
import './Dashboard.css'

export default function MyTrips() {
  const { trips, loading, fetchMyTrips } = useTripStore()
  const navigate = useNavigate()
  
  // State for the Delete Modal
  const [tripToDelete, setTripToDelete] = useState(null)
  
  // State for the Dropdown menus
  const [activeMenuId, setActiveMenuId] = useState(null)

  useEffect(() => { 
    fetchMyTrips() 
  }, [])

  // Close dropdown if clicking outside
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

  const handleDelete = (e) => {
    e.stopPropagation()
    // TODO: implement Supabase deletion
    console.log('Eliminando', tripToDelete)
    setTripToDelete(null)
    setActiveMenuId(null)
  }

  return (
    <div className="dash-page">
      
      {/* Principal Pane */}
      <div className="dash-pane">
        
        {/* Header */}
        <div className="dash-pane__header">
          <div className="dash-pane__header-left">
            <div className="dash-pane__icon">
              <Compass size={28} />
            </div>
            <h1 className="dash-pane__title">Travesías</h1>
          </div>
          
          <button 
            onClick={() => navigate('/dashboard/travesias/nueva')} 
            className="btn btn--accent"
            style={{ padding: '12px 24px', fontSize: '0.95rem', borderRadius: 'var(--radius-xl)' }}
          >
            <Plus size={18} /> Crear una travesía
          </button>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="dash-pane__empty">
            <div className="dash-spinner"></div>
            <p style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Cargando flotas...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && trips.length === 0 && (
          <div className="dash-pane__empty dash-pane__empty--dashed">
            <Compass size={64} style={{ color: 'rgba(255,255,255,0.1)', marginBottom: '16px' }} />
            <h3 className="dash-pane__empty-title">Aún no creaste travesías</h3>
            <p className="dash-pane__empty-desc">Tus aventuras náuticas aparecerán aquí ordenadas para que puedas gestionarlas fácilmente.</p>
            <button 
              onClick={() => navigate('/dashboard/travesias/nueva')} 
              className="btn btn--outline"
              style={{ borderRadius: '9999px', padding: '12px 32px', marginTop: '8px' }}
            >
              Crear mi primera travesía
            </button>
          </div>
        )}

        {/* The Data Table */}
        {!loading && trips.length > 0 && (
          <div style={{ overflowX: 'auto', width: '100%', paddingBottom: '128px' }}>
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Travesía</th>
                  <th>Estado</th>
                  <th className="dash-table__hide-mobile">Pendientes</th>
                  <th className="dash-table__hide-mobile">Modificado</th>
                  <th className="dash-table__hide-tablet">Creado</th>
                  <th style={{ textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {trips.map((trip, idx) => {
                  const isPublished = trip.status === 'published'

                  return (
                    <tr key={trip.id} className={idx % 2 === 0 ? 'dash-table__row--even' : ''}>
                      
                      <td style={{ maxWidth: '200px' }}>
                        <Link 
                          to={`/travesia/${trip.id}`} 
                          style={{ fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none', transition: 'color 0.2s' }}
                          onMouseOver={(e) => e.target.style.color = 'var(--color-accent-400)'}
                          onMouseOut={(e) => e.target.style.color = 'var(--text-primary)'}
                        >
                          {trip.title}
                        </Link>
                      </td>
                      
                      <td>
                        <span className={`dash-badge ${isPublished ? 'dash-badge--success' : 'dash-badge--warning'}`}>
                          {isPublished ? 'Publicada' : 'En Revisión'}
                        </span>
                      </td>

                      <td className="dash-table__hide-mobile" style={{ color: 'var(--text-secondary)' }}>-</td>
                      <td className="dash-table__hide-mobile" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{formatDate(trip.updated_at)}</td>
                      <td className="dash-table__hide-tablet" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{formatDate(trip.created_at)}</td>

                      <td style={{ textAlign: 'center', position: 'relative' }}>
                        <button 
                          className="dash-menu-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveMenuId(activeMenuId === trip.id ? null : trip.id)
                          }}
                        >
                          <MoreVertical size={20} />
                        </button>

                        {activeMenuId === trip.id && (
                          <div className="dash-dropdown" onClick={(e) => e.stopPropagation()}>
                            <button className="dash-dropdown__item">Copiar</button>
                            <button className="dash-dropdown__item" onClick={() => navigate(`/dashboard/travesias/${trip.id}/editar`)}>Editar</button>
                            <button className="dash-dropdown__item">Editar fecha y hora</button>
                            <button 
                              className="dash-dropdown__item dash-dropdown__item--danger"
                              onClick={() => {
                                setTripToDelete(trip)
                                setActiveMenuId(null)
                              }}
                            >
                              Eliminar
                            </button>
                          </div>
                        )}
                      </td>

                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DE ELIMINACIÓN */}
      {tripToDelete && (
        <div className="dash-modal-overlay">
          <div className="dash-modal">
            
            <div className="dash-modal__icon dash-modal__icon--danger">
              <AlertCircle size={32} />
            </div>

            <h3 className="dash-modal__title">Estás por eliminar esta travesía</h3>
            <p className="dash-modal__desc">¿Deseas eliminar esta travesía de forma permanente? Esta acción no se puede deshacer.</p>

            <div className="dash-modal__actions">
              <button onClick={() => setTripToDelete(null)} className="btn btn--primary" style={{ width: '100%', height: '48px', borderRadius: 'var(--radius-xl)' }}>
                Me arrepentí, no quiero eliminar
              </button>
              <button onClick={handleDelete} className="btn btn--danger" style={{ width: '100%', height: '48px', borderRadius: 'var(--radius-xl)' }}>
                Quiero eliminar esta travesía
              </button>
            </div>
            
          </div>
        </div>
      )}

    </div>
  )
}
