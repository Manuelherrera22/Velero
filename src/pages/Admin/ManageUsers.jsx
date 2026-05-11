import { useState, useEffect } from 'react'
import { Users, CheckCircle, XCircle, Loader, Shield, User } from 'lucide-react'
import supabase from '../../lib/supabase'

export default function ManageUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, publisher, affiliate, viewer
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => { fetchUsers() }, [filter])

  const fetchUsers = async () => {
    setLoading(true)
    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (filter !== 'all') {
      query = query.eq('role', filter)
    }

    const { data } = await query
    setUsers(data || [])
    setLoading(false)
  }

  const toggleVerifyCaptain = async (userId, currentStatus) => {
    setActionLoading(userId)
    const { error } = await supabase
      .from('profiles')
      .update({ is_verified: !currentStatus })
      .eq('id', userId)

    if (!error) {
      setUsers(users.map(u => u.id === userId ? { ...u, is_verified: !currentStatus } : u))
    }
    setActionLoading(null)
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
    <div>
      <div className="dashboard__header">
        <h1 className="dashboard__title">Gestión de Usuarios</h1>
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
                    <strong>{user.full_name || 'Sin Nombre'}</strong>
                    <span style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {user.email} 
                      {user.phone && ` · ${user.phone}`}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span className={`status-badge`} style={{ 
                      background: user.role === 'admin' ? 'rgba(168, 85, 247, 0.1)' : user.role === 'publisher' ? 'rgba(59, 130, 246, 0.1)' : user.role === 'affiliate' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255,255,255,0.05)',
                      color: user.role === 'admin' ? '#a855f7' : user.role === 'publisher' ? '#3b82f6' : user.role === 'affiliate' ? '#f59e0b' : 'var(--text-secondary)'
                    }}>
                      {user.role === 'admin' ? <Shield size={12} style={{marginRight:'4px'}}/> : <User size={12} style={{marginRight:'4px'}}/>}
                      {getRoleLabel(user.role)}
                    </span>

                    {user.role === 'publisher' && (
                      <button 
                        className={`btn btn--sm ${user.is_verified ? 'btn--ghost' : 'btn--accent'}`}
                        onClick={() => toggleVerifyCaptain(user.id, user.is_verified)}
                        disabled={actionLoading === user.id}
                        style={{ minWidth: '130px', color: user.is_verified ? 'var(--color-success)' : undefined }}
                      >
                        {actionLoading === user.id ? (
                          <Loader size={14} className="spin" />
                        ) : user.is_verified ? (
                          <><CheckCircle size={14} /> Verificado</>
                        ) : (
                          <><XCircle size={14} /> Sin Verificar</>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
