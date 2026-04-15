import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { User, Mail, Phone, MapPin, Sailboat, Shield, LogOut, Edit3, Save, Loader } from 'lucide-react'
import useAuthStore from '../stores/authStore'
import './Profile.css'

export default function Profile() {
  const { user, profile, signOut, updateProfile } = useAuthStore()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    bio: profile?.bio || '',
    location: profile?.location || '',
  })

  if (!user) return <Navigate to="/login" replace />

  const handleSave = async () => {
    setSaving(true)
    await updateProfile(formData)
    setSaving(false)
    setEditing(false)
  }

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="profile-page">
      <div className="container container--narrow">
        <div className="profile-card glass animate-fade-in">
          {/* Header */}
          <div className="profile-header">
            <div className="profile-avatar">
              {(profile?.full_name || user.email || '?').charAt(0).toUpperCase()}
            </div>
            <div className="profile-header__info">
              <h1>{profile?.full_name || 'Sin nombre'}</h1>
              <p>{user.email || user.phone}</p>
              <div className="profile-header__badges">
                <span className={`badge badge--${profile?.role === 'admin' ? 'error' : profile?.role === 'publisher' ? 'warning' : 'info'}`}>
                  {profile?.role === 'admin' ? 'Admin' : profile?.role === 'publisher' ? 'Capitán' : 'Viajero'}
                </span>
                {profile?.is_verified && (
                  <span className="badge badge--success">
                    <Shield size={12} /> Verificado
                  </span>
                )}
              </div>
            </div>
            <div className="profile-header__actions">
              {!editing ? (
                <button className="btn btn--ghost btn--sm" onClick={() => setEditing(true)}>
                  <Edit3 size={14} /> Editar
                </button>
              ) : (
                <button className="btn btn--accent btn--sm" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader size={14} className="spin" /> : <><Save size={14} /> Guardar</>}
                </button>
              )}
            </div>
          </div>

          <div className="divider" style={{ width: '100%' }} />

          {/* Profile Fields */}
          <div className="profile-fields">
            <div className="profile-field">
              <label><User size={14} /> Nombre</label>
              {editing ? (
                <input className="input" value={formData.full_name} onChange={(e) => updateField('full_name', e.target.value)} placeholder="Tu nombre completo" />
              ) : (
                <p>{profile?.full_name || '—'}</p>
              )}
            </div>

            <div className="profile-field">
              <label><Mail size={14} /> Email</label>
              <p>{user.email || '—'}</p>
            </div>

            <div className="profile-field">
              <label><Phone size={14} /> Teléfono</label>
              {editing ? (
                <input className="input" value={formData.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder="+54 11 1234 5678" />
              ) : (
                <p>{profile?.phone || '—'}</p>
              )}
            </div>

            <div className="profile-field">
              <label><MapPin size={14} /> Ubicación</label>
              {editing ? (
                <input className="input" value={formData.location} onChange={(e) => updateField('location', e.target.value)} placeholder="Buenos Aires, Argentina" />
              ) : (
                <p>{profile?.location || '—'}</p>
              )}
            </div>

            <div className="profile-field">
              <label><Sailboat size={14} /> Bio</label>
              {editing ? (
                <textarea className="input" rows={3} value={formData.bio} onChange={(e) => updateField('bio', e.target.value)} placeholder="Contanos sobre vos..." />
              ) : (
                <p>{profile?.bio || '—'}</p>
              )}
            </div>
          </div>

          <div className="divider" style={{ width: '100%' }} />

          {/* Actions */}
          <button className="btn btn--ghost profile-logout" onClick={signOut}>
            <LogOut size={16} /> Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  )
}
