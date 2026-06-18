import { useState, useEffect } from 'react'
import { Users, CheckCircle, XCircle, Loader, Shield, User } from 'lucide-react'
import supabase from '../../lib/supabase'

export default function ManageUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, publisher, affiliate, viewer
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => { fetchUsers()
    const t = setTimeout(() => setLoading(false), 8000); return () => clearTimeout(t)
  }, [filter])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('role', filter)
      }

      const { data, error } = await query.abortSignal(AbortSignal.timeout(6000))
      if (error) throw error
      setUsers(data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const toggleVerifyCaptain = async (userId, currentStatus) => {
    setActionLoading(userId)
    const { error } = await supabase
      .from('profiles')
      .update({ is_verified: !currentStatus })
      .eq('id', userId)

    if (!error) {
      setUsers(users.map(u => u.id === userId ? { ...u, is_verified: !currentStatus } : u))
    } else {
      alert('Error al verificar: ' + error.message)
    }
    setActionLoading(null)
  }

  const handleExpelCaptain = async (userId) => {
    if (!window.confirm("¿Seguro que deseas rechazar/expulsar a este capitán? Volverá a ser Pasajero.")) return;
    
    setActionLoading(userId)
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'viewer', is_verified: false })
      .eq('id', userId)

    if (!error) {
      setUsers(users.filter(u => u.id !== userId)) // Eliminar de la vista actual o cambiar estado
    } else {
      alert('Error al expulsar: ' + error.message)
    }
    setActionLoading(null)
  }

  const handleUpdateCommission = async (userId, rate) => {
    if (isNaN(rate) || rate < 0 || rate > 100) return
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, captain_commission_rate: rate } : u))
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ captain_commission_rate: rate })
        .eq('id', userId)
      if (error) {
        alert("Error al actualizar la comisión: " + error.message)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleUpdateUserRole = async (userId, newRole) => {
    const roleLabel = getRoleLabel(newRole);
    if (!window.confirm(`¿Seguro que deseas cambiar el rol de este usuario a ${roleLabel}?`)) return;
    
    setActionLoading(userId);
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (!error) {
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } else {
      alert('Error al actualizar el rol: ' + error.message);
    }
    setActionLoading(null);
  }

  const getRoleLabel = (role) => {
    switch(role) {
      case 'admin': return 'Admin'
      case 'publisher': return 'Capitán'
      case 'affiliate': return 'Aliado'
      default: return 'Pasajero'
    }
  }

  return (
    <div className="dash-page">
      <div className="dash-pane">
        <div className="dash-pane__header">
          <div className="dash-pane__header-left">
            <h1 className="dash-pane__title">Gestión de Usuarios</h1>
          </div>
        </div>

      <div className="search-tags" style={{ marginBottom: 'var(--space-6)' }}>
        {['all', 'publisher', 'affiliate', 'viewer'].map(f => (
          <button 
            key={f} 
            className={`search-tag ${filter === f ? 'search-tag--active' : ''}`} 
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'Todos' : f === 'publisher' ? 'Capitanes' : f === 'affiliate' ? 'Aliados' : 'Pasajeros'}
          </button>
        ))}
      </div>

      {loading && <div className="protected-loading"><p>Cargando usuarios...</p></div>}

      {!loading && users.length === 0 && (
        <div className="dashboard__empty">
          <div className="dashboard__empty-icon"><Users size={48} /></div>
          <h3>Sin usuarios encontrados</h3>
          <p>No hay usuarios registrados con el rol seleccionado.</p>
        </div>
      )}

      <div className="metrics-tables" style={{ gridTemplateColumns: '1fr' }}>
        {!loading && users.length > 0 && (
          <div className="metrics-table glass">
            <h3 className="metrics-table__title"><Users size={18} /> Directorio de Usuarios</h3>
            <div className="metrics-table__rows">
              {users.map(user => (
                <div key={user.id} className="metrics-table__row" style={{ alignItems: 'center' }}>
                  <div className="header__user-avatar" style={{ width: '40px', height: '40px', fontSize: '1.2rem', margin: '0' }}>
                    {(user.full_name || user.email || '?').charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="metrics-table__info" style={{ flex: 1, marginLeft: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong>{user.full_name || 'Sin Nombre'}</strong>
                      {user.role === 'publisher' && user.nautical_license_url && (
                        <a 
                          href={user.nautical_license_url} 
                          target="_blank" 
                          rel="noreferrer" 
                          style={{
                            fontSize: '11px',
                            background: 'rgba(11, 171, 195, 0.1)',
                            color: 'var(--color-accent-400)',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            border: '1px solid rgba(11, 171, 195, 0.2)',
                            fontWeight: 'bold',
                            textDecoration: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          📄 Ver Licencia
                        </a>
                      )}
                    </div>
                    <span style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {user.email} 
                      {user.phone && ` · ${user.phone}`}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {user.role !== 'admin' ? (
                      <select
                        value={user.role}
                        disabled={actionLoading === user.id}
                        onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                        style={{
                          background: 'rgba(0, 0, 0, 0.2)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: 'white',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '13px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="viewer" style={{ background: '#1e293b' }}>Pasajero</option>
                        <option value="publisher" style={{ background: '#1e293b' }}>Capitán</option>
                        <option value="affiliate" style={{ background: '#1e293b' }}>Aliado</option>
                      </select>
                    ) : (
                      <span className={`status-badge`} style={{ 
                        background: 'rgba(168, 85, 247, 0.1)',
                        color: '#a855f7'
                      }}>
                        <Shield size={12} style={{marginRight:'4px'}}/>
                        Admin
                      </span>
                    )}

                    {user.role === 'publisher' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* Commission selector */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255, 255, 255, 0.02)', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Comisión:</span>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={user.captain_commission_rate ?? 20.0}
                            onChange={(e) => handleUpdateCommission(user.id, parseFloat(e.target.value))}
                            disabled={actionLoading === user.id}
                            style={{
                              width: '55px',
                              background: 'rgba(0, 0, 0, 0.2)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              color: 'white',
                              borderRadius: '4px',
                              padding: '2px 4px',
                              fontSize: '12px',
                              textAlign: 'center'
                            }}
                          />
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>%</span>
                        </div>

                        {user.is_verified ? (
                          <button 
                            className="btn btn--sm btn--ghost"
                            onClick={() => toggleVerifyCaptain(user.id, user.is_verified)}
                            disabled={actionLoading === user.id}
                            style={{ minWidth: '130px', color: 'var(--color-success)' }}
                          >
                            {actionLoading === user.id ? <Loader size={14} className="spin" /> : <><CheckCircle size={14} /> Verificado</>}
                          </button>
                        ) : (
                          <>
                            <button 
                              className="btn btn--sm btn--accent"
                              onClick={() => toggleVerifyCaptain(user.id, user.is_verified)}
                              disabled={actionLoading === user.id}
                              style={{ minWidth: '110px' }}
                            >
                              {actionLoading === user.id ? <Loader size={14} className="spin" /> : <><CheckCircle size={14} /> Verificar</>}
                            </button>
                            <button 
                              className="btn btn--sm btn--outline"
                              onClick={() => handleExpelCaptain(user.id)}
                              disabled={actionLoading === user.id}
                              style={{ minWidth: '110px', color: 'var(--color-error)' }}
                            >
                              {actionLoading === user.id ? <Loader size={14} className="spin" /> : <><XCircle size={14} /> Expulsar</>}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
