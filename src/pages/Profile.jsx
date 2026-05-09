import { useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { User, Mail, Phone, MapPin, Sailboat, Shield, LogOut, Edit3, Save, Loader, Lock, CheckCircle, Eye, EyeOff } from 'lucide-react'
import useAuthStore from '../stores/authStore'
import supabase from '../lib/supabase'
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

  const [searchParams] = useSearchParams()
  // Password state
  const [showPasswordSection, setShowPasswordSection] = useState(searchParams.get('recover') === 'true')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  if (!user) return <Navigate to="/login" replace />

  const handleSave = async () => {
    setSaving(true)
    const result = await updateProfile(formData)
    setSaving(false)
    if (!result.success) {
      alert('Hubo un error al guardar: ' + result.error)
    } else {
      setEditing(false)
    }
  }

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSetPassword = async () => {
    setPasswordError('')
    setPasswordSuccess(false)

    if (password.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (password !== passwordConfirm) {
      setPasswordError('Las contraseñas no coinciden')
      return
    }

    setPasswordSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setPasswordSuccess(true)
      setPassword('')
      setPasswordConfirm('')
      setTimeout(() => setPasswordSuccess(false), 5000)
    } catch (err) {
      setPasswordError(err.message || 'Error al crear contraseña')
    } finally {
      setPasswordSaving(false)
    }
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
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    className="input"
                    style={{ width: '110px', padding: '0.75rem 0.5rem' }}
                    value={formData.phone.match(/^\+\d+/)?.[0] || '+54'}
                    onChange={(e) => {
                      const currentNumber = formData.phone.replace(/^\+\d+\s*/, '')
                      updateField('phone', e.target.value + ' ' + currentNumber)
                    }}
                  >
                    <option value="+54">🇦🇷 +54</option>
                    <option value="+55">🇧🇷 +55</option>
                    <option value="+56">🇨🇱 +56</option>
                    <option value="+598">🇺🇾 +598</option>
                    <option value="+595">🇵🇾 +595</option>
                    <option value="+591">🇧🇴 +591</option>
                    <option value="+593">🇪🇨 +593</option>
                    <option value="+51">🇵🇪 +51</option>
                    <option value="+57">🇨🇴 +57</option>
                    <option value="+58">🇻🇪 +58</option>
                    <option value="+52">🇲🇽 +52</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+34">🇪🇸 +34</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+39">🇮🇹 +39</option>
                    <option value="+33">🇫🇷 +33</option>
                    <option value="+49">🇩🇪 +49</option>
                  </select>
                  <input
                    className="input"
                    style={{ flex: 1 }}
                    value={formData.phone.replace(/^\+\d+\s*/, '')}
                    onChange={(e) => {
                      const prefix = formData.phone.match(/^\+\d+/)?.[0] || '+54'
                      updateField('phone', prefix + ' ' + e.target.value)
                    }}
                    placeholder="11 1234 5678"
                  />
                </div>
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
                <textarea className="input" rows={3} value={formData.bio} onChange={(e) => updateField('bio', e.target.value)} placeholder="Contanos tu experiencia navegando..." />
              ) : (
                <p>{profile?.bio || '—'}</p>
              )}
            </div>
          </div>

          <div className="divider" style={{ width: '100%' }} />

          {/* Password Section */}
          <div className="profile-password-section">
            <button
              className="btn btn--ghost btn--sm"
              onClick={() => setShowPasswordSection(!showPasswordSection)}
            >
              <Lock size={14} /> {showPasswordSection ? 'Ocultar' : 'Crear o cambiar contraseña'}
            </button>

            {showPasswordSection && (
              <div className="profile-password-form animate-fade-in">
                <p className="profile-password-hint">
                  Creá una contraseña para poder iniciar sesión con email y contraseña en vez de magic link.
                </p>

                <div className="input-group" style={{ marginBottom: 'var(--space-3)' }}>
                  <label><Lock size={14} /> Nueva contraseña</label>
                  <div className="profile-password-input">
                    <input
                      className="input"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                    />
                    <button
                      type="button"
                      className="profile-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="input-group" style={{ marginBottom: 'var(--space-4)' }}>
                  <label><Lock size={14} /> Repetir contraseña</label>
                  <input
                    className="input"
                    type={showPassword ? 'text' : 'password'}
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="Repetí la contraseña"
                  />
                </div>

                {passwordError && (
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-error)', marginBottom: 'var(--space-3)' }}>
                    {passwordError}
                  </p>
                )}

                {passwordSuccess && (
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)', marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle size={14} /> ¡Contraseña guardada! Ahora podés entrar con email y contraseña.
                  </p>
                )}

                <button
                  className="btn btn--accent btn--sm"
                  onClick={handleSetPassword}
                  disabled={passwordSaving || !password || !passwordConfirm}
                >
                  {passwordSaving ? <Loader size={14} className="spin" /> : <><Save size={14} /> Guardar contraseña</>}
                </button>
              </div>
            )}
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
