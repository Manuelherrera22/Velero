import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Eye, Check, X, MapPin, Users, AlertCircle, Loader, Percent, Save } from 'lucide-react'
import supabase from '../../lib/supabase'

export default function ReviewTrips() {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [rejectId, setRejectId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const [discountInputs, setDiscountInputs] = useState({})

  useEffect(() => { fetchTrips() }, [filter])

  const fetchTrips = async () => {
    setLoading(true)
    let query = supabase
      .from('trips')
      .select(`*, captain:profiles!captain_id(full_name, email)`)
      .order('created_at', { ascending: false })

    if (filter !== 'all') {
      query = query.eq('status', filter)
    }

    const { data } = await query
    
    // Initialize discount inputs
    const discounts = {}
    data?.forEach(t => {
      discounts[t.id] = t.metadata?.discount_percentage || ''
    })
    setDiscountInputs(discounts)
    
    setTrips(data || [])
    setLoading(false)
  }

  const handleApprove = async (tripId) => {
    setActionLoading(tripId)
    await supabase.from('trips').update({ status: 'published' }).eq('id', tripId)
    await fetchTrips()
    setActionLoading(null)
  }

  const handleReject = async (tripId) => {
    if (!rejectReason.trim()) return
    setActionLoading(tripId)
    await supabase.from('trips').update({ status: 'rejected', rejection_reason: rejectReason }).eq('id', tripId)
    setRejectId(null)
    setRejectReason('')
    await fetchTrips()
    setActionLoading(null)
  }

  const handleDiscountChange = (tripId, value) => {
    setDiscountInputs(prev => ({ ...prev, [tripId]: value }))
  }

  const handleSaveDiscount = async (trip) => {
    setActionLoading(`discount-${trip.id}`)
    const newValue = parseInt(discountInputs[trip.id]) || 0
    const newMetadata = { ...(trip.metadata || {}), discount_percentage: newValue }
    
    await supabase.from('trips').update({ metadata: newMetadata }).eq('id', trip.id)
    
    setTrips(trips.map(t => t.id === trip.id ? { ...t, metadata: newMetadata } : t))
    setActionLoading(null)
  }

  const formatPrice = (p, c) => c === 'EUR' ? `€${p}` : `$${p?.toLocaleString('es-AR')}`

  return (
    <div>
      <div className="dashboard__header">
        <h1 className="dashboard__title">Revisar Travesías</h1>
      </div>

      <div className="search-tags" style={{ marginBottom: 'var(--space-6)' }}>
        {['pending', 'published', 'rejected', 'draft', 'all'].map(f => (
          <button key={f} className={`search-tag ${filter === f ? 'search-tag--active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'pending' ? 'Pendientes' : f === 'published' ? 'Publicadas' : f === 'rejected' ? 'Rechazadas' : f === 'draft' ? 'Borradores' : 'Todas'}
          </button>
        ))}
      </div>

      {loading && <div className="protected-loading"><p>Cargando...</p></div>}

      {!loading && trips.length === 0 && (
        <div className="dashboard__empty">
          <div className="dashboard__empty-icon"><Eye size={48} /></div>
          <h3>Sin travesías para revisar</h3>
          <p>No hay travesías con estado "{filter}".</p>
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
                <p className="item-card__subtitle" style={{ marginTop: '2px' }}>
                  Capitán: {trip.captain?.full_name || 'Desconocido'} ({trip.captain?.email})
                </p>
              </div>
              <span className={`status-badge status-badge--${trip.status}`}>
                {trip.status === 'pending' ? 'Pendiente' : trip.status === 'published' ? 'Publicada' : trip.status === 'rejected' ? 'Rechazada' : trip.status}
              </span>
            </div>

            {trip.description && (
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
                {trip.description?.slice(0, 200)}{trip.description?.length > 200 ? '...' : ''}
              </p>
            )}

            {trip.rejection_reason && (
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-error)', background: 'rgba(239,68,68,0.08)', padding: '8px 12px', borderRadius: '8px' }}>
                <AlertCircle size={12} style={{ verticalAlign: '-1px' }} /> {trip.rejection_reason}
              </div>
            )}

            <div className="item-card__footer" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '12px' }}>
              <span><Users size={14} style={{ verticalAlign: '-2px' }} /> {trip.capacity} pers. · {trip.tags?.join(', ') || '—'}</span>
              <span style={{ color: 'var(--color-accent-400)', fontWeight: 600 }}>{formatPrice(trip.price_per_person, trip.currency)}/pers.</span>
            </div>

            {/* Discount Management */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}><Percent size={14} style={{ verticalAlign: '-2px', marginRight: '4px' }}/> Descuento aplicado:</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="number" 
                  min="0" 
                  max="100" 
                  className="input" 
                  style={{ width: '80px', padding: '4px 8px', minHeight: '32px' }} 
                  placeholder="%" 
                  value={discountInputs[trip.id] || ''} 
                  onChange={(e) => handleDiscountChange(trip.id, e.target.value)} 
                />
                <button 
                  className="btn btn--outline btn--sm" 
                  style={{ minHeight: '32px', padding: '0 12px' }}
                  onClick={() => handleSaveDiscount(trip)}
                  disabled={actionLoading === `discount-${trip.id}` || parseInt(discountInputs[trip.id] || 0) === (trip.metadata?.discount_percentage || 0)}
                >
                  {actionLoading === `discount-${trip.id}` ? <Loader size={14} className="spin" /> : <Save size={14} />}
                </button>
              </div>
            </div>

            {trip.status === 'pending' && (
              <>
                {rejectId === trip.id ? (
                  <div className="admin-reject-input">
                    <input className="input" placeholder="Motivo del rechazo..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} autoFocus />
                    <div className="admin-action-row">
                      <button className="btn btn--ghost btn--sm" style={{ flex: 1 }} onClick={() => setRejectId(null)}>Cancelar</button>
                      <button className="btn btn--accent btn--sm" style={{ flex: 1, background: 'var(--color-error)' }} onClick={() => handleReject(trip.id)} disabled={actionLoading === trip.id}>
                        {actionLoading === trip.id ? <Loader size={14} className="spin" /> : 'Confirmar Rechazo'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="admin-action-row">
                    <button className="btn btn--accent btn--sm" style={{ flex: 1 }} onClick={() => handleApprove(trip.id)} disabled={actionLoading === trip.id}>
                      {actionLoading === trip.id ? <Loader size={14} className="spin" /> : <><Check size={14} /> Aprobar</>}
                    </button>
                    <button className="btn btn--ghost btn--sm" style={{ flex: 1, color: 'var(--color-coral-400)' }} onClick={() => setRejectId(trip.id)}>
                      <X size={14} /> Rechazar
                    </button>
                    <Link to={`/travesia/${trip.id}`} className="btn btn--outline btn--sm"><Eye size={14} /></Link>
                  </div>
                )}
              </>
            )}
            {trip.status !== 'pending' && (
               <div className="admin-action-row">
                  <Link to={`/travesia/${trip.id}`} className="btn btn--outline btn--sm" style={{ flex: 1 }}><Eye size={14} /> Ver en plataforma</Link>
               </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
