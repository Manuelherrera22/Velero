import { useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { User, Mail, Phone, MapPin, Shield, LogOut, Edit3, Save, Loader, Lock, CheckCircle, Eye, EyeOff, Building2, CreditCard, Plus } from 'lucide-react'
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
    location: profile?.location || '',
    business_name: profile?.business_name || '',
    business_location: profile?.business_location || '',
    bank_alias: profile?.bank_alias || '',
    bank_holder: profile?.bank_holder || '',
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

  const [uploadingLicense, setUploadingLicense] = useState(false)

  const handleLicenseUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert('El archivo supera el límite de 5MB')
      return
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      alert('Solo se permiten archivos JPG, PNG o PDF')
      return
    }

    setUploadingLicense(true)
    try {
      const fileExt = file.name.split('.').pop()
      const filePath = `${profile.id}_license_${Date.now()}.${fileExt}`

      const { data, error } = await supabase.storage
        .from('licenses')
        .upload(filePath, file, { cacheControl: '3600', upsert: true })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('licenses')
        .getPublicUrl(filePath)

      const result = await updateProfile({ nautical_license_url: publicUrl })
      if (!result.success) {
        throw new Error(result.error)
      }
      alert('¡Licencia náutica subida correctamente! Será auditada por un administrador.')
    } catch (err) {
      console.error(err)
      alert('Error al subir la licencia: ' + (err.message || err))
    } finally {
      setUploadingLicense(false)
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
                <span className={`badge badge--${profile?.role === 'admin' ? 'error' : profile?.role === 'publisher' ? 'warning' : profile?.role === 'affiliate' ? 'success' : 'info'}`}>
                  {profile?.role === 'admin' ? 'Admin' : profile?.role === 'publisher' ? 'Capitán' : profile?.role === 'affiliate' ? 'Aliado' : 'Viajero'}
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

            {profile?.role === 'affiliate' && (
              <>
                <div className="profile-field">
                  <label><Building2 size={14} /> Nombre del negocio</label>
                  {editing ? (
                    <input className="input" value={formData.business_name} onChange={(e) => updateField('business_name', e.target.value)} placeholder="Ej: Hotel Faena" />
                  ) : (
                    <p>{profile?.business_name || '—'}</p>
                  )}
                </div>
                <div className="profile-field">
                  <label><MapPin size={14} /> Ubicación del negocio</label>
                  {editing ? (
                    <input className="input" value={formData.business_location} onChange={(e) => updateField('business_location', e.target.value)} placeholder="Ej: Puerto Madero, CABA" />
                  ) : (
                    <p>{profile?.business_location || '—'}</p>
                  )}
                </div>
                <div className="profile-field">
                  <label><CreditCard size={14} /> Alias o CBU (Transferencias)</label>
                  {editing ? (
                    <input className="input" value={formData.bank_alias} onChange={(e) => updateField('bank_alias', e.target.value)} placeholder="alias.de.mp" />
                  ) : (
                    <p>{profile?.bank_alias || '—'}</p>
                  )}
                </div>
                <div className="profile-field">
                  <label><User size={14} /> Titular de cuenta bancaria</label>
                  {editing ? (
                    <input className="input" value={formData.bank_holder} onChange={(e) => updateField('bank_holder', e.target.value)} placeholder="Nombre del titular" />
                  ) : (
                    <p>{profile?.bank_holder || '—'}</p>
                  )}
                </div>
              </>
            )}

            {profile?.role === 'publisher' && (
              <div className="profile-field" style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Shield size={14} /> Documentación de Licencia Náutica
                </label>
                <div style={{ marginTop: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {profile?.nautical_license_url ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '8px', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px' }}>📄</span>
                        <div>
                          <strong style={{ fontSize: '13px', display: 'block', color: 'var(--text-primary)' }}>Licencia Náutica Cargada</strong>
                          <span style={{ fontSize: '11px', color: profile?.is_verified ? '#22c55e' : '#f59e0b', fontWeight: 600 }}>
                            {profile?.is_verified ? '✓ Verificada por administración' : '⏳ Pendiente de verificación'}
                          </span>
                        </div>
                      </div>
                      <a href={profile.nautical_license_url} target="_blank" rel="noreferrer" className="btn btn--outline btn--sm" style={{ minHeight: 'unset', padding: '4px 10px', fontSize: '12px' }}>
                        Ver Documento
                      </a>
                    </div>
                  ) : (
                    <div style={{ padding: '16px', border: '1px dashed rgba(255, 255, 255, 0.15)', borderRadius: '8px', textAlign: 'center', background: 'rgba(255, 255, 255, 0.01)' }}>
                      <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        Para verificar tu cuenta y poder publicar travesías, por favor subí tu carnet o licencia náutica.
                      </p>
                      <label className="btn btn--accent btn--sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', minHeight: 'unset', padding: '6px 12px' }}>
                        {uploadingLicense ? <Loader size={14} className="spin" /> : <><Plus size={14} /> Subir Licencia</>}
                        <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleLicenseUpload} disabled={uploadingLicense} style={{ display: 'none' }} />
                      </label>
                      <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '6px' }}>
                        Formatos permitidos: PDF, PNG, JPG (máx. 5MB)
                      </span>
                    </div>
                  )}
                  {profile?.nautical_license_url && (
                    <label className="btn btn--ghost btn--sm" style={{ alignSelf: 'flex-start', cursor: 'pointer', fontSize: '11px', minHeight: 'unset', padding: '4px 8px' }}>
                      Reemplazar archivo
                      <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleLicenseUpload} disabled={uploadingLicense} style={{ display: 'none' }} />
                    </label>
                  )}
                </div>
              </div>
            )}
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
