import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Edit3, MapPin, Users, Eye } from 'lucide-react'
import useTripStore from '../../stores/tripStore'

export default function MyTrips() {
  const { trips, loading, fetchMyTrips } = useTripStore()

  useEffect(() => { fetchMyTrips() }, [])

  const formatPrice = (p, c) => c === 'EUR' ? `€${p}` : `$${p?.toLocaleString('es-AR')}`

  return (
    <div>
      <div className="dashboard__header">
        <h1 className="dashboard__title">Mis Travesías</h1>
        <Link to="/dashboard/travesias/nueva" className="btn btn--accent btn--sm">
          <Plus size={16} /> Nueva Travesía
        </Link>
      </div>

      {loading && <div className="protected-loading"><p>Cargando...</p></div>}

      {!loading && trips.length === 0 && (
        <div className="dashboard__empty">
          <div className="dashboard__empty-icon"><Eye size={48} /></div>
          <h3>Sin travesías aún</h3>
          <p>Publica tu primera travesía y comienza a recibir reservas.</p>
          <Link to="/dashboard/travesias/nueva" className="btn btn--accent">
            <Plus size={16} /> Crear mi primera travesía
          </Link>
        </div>
      )}

      <div className="dashboard__grid">
        {trips.map(trip => (
          <div key={trip.id} className="item-card glass">
            <div className="item-card__header">
              <div>
                <h3 className="item-card__title">{trip.title}</h3>
                <p className="item-card__subtitle">
                  <MapPin size={13} style={{ display: 'inline', verticalAlign: '-2px' }} /> {trip.location}
                </p>
              </div>
              <span className={`status-badge status-badge--${trip.status}`}>
                {trip.status === 'draft' ? 'Borrador' :
                 trip.status === 'pending' ? 'Pendiente' :
                 trip.status === 'published' ? 'Publicada' :
                 trip.status === 'rejected' ? 'Rechazada' : 'Archivada'}
              </span>
            </div>

            {trip.rejection_reason && (
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-error)', background: 'rgba(239,68,68,0.08)', padding: '8px 12px', borderRadius: '8px' }}>
                Motivo: {trip.rejection_reason}
              </div>
            )}

            <div className="item-card__footer">
              <span><Users size={14} style={{ verticalAlign: '-2px' }} /> {trip.capacity} personas</span>
              <span style={{ color: 'var(--color-accent-400)', fontWeight: 600 }}>
                {formatPrice(trip.price_per_person, trip.currency)}/persona
              </span>
            </div>

            <div className="item-card__actions">
              <Link to={`/dashboard/travesias/${trip.id}/editar`} className="btn btn--ghost btn--sm" style={{ flex: 1 }}>
                <Edit3 size={14} /> Editar
              </Link>
              {trip.status === 'published' && (
                <Link to={`/travesia/${trip.id}`} className="btn btn--outline btn--sm" style={{ flex: 1 }}>
                  <Eye size={14} /> Ver
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
