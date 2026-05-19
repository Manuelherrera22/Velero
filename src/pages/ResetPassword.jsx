import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff, Save, Loader, ShieldCheck } from 'lucide-react'
import supabase from '../lib/supabase'
import useAuthStore from '../stores/authStore'
import './Login.css'

export default function ResetPassword() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleReset = async (e) => {
    e.preventDefault()
    setError('')
    
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (password !== passwordConfirm) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      
      setSuccess(true)
      setTimeout(() => {
        if (profile?.role === 'admin') navigate('/admin')
        else if (profile?.role === 'publisher') navigate('/dashboard')
        else if (profile?.role === 'affiliate') navigate('/afiliado')
        else navigate('/mis-viajes')
      }, 2000)
    } catch (err) {
      setError(err.message || 'Error al actualizar la contraseña.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card glass" style={{ maxWidth: '400px' }}>
        <div className="login-header">
          <div className="login-logo">
            <ShieldCheck size={32} />
          </div>
          <h1 className="login-title">Creá una nueva contraseña</h1>
          <p className="login-subtitle">Por seguridad, ingresá tu nueva clave para continuar.</p>
        </div>

        {success ? (
          <div className="login-alert" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', textAlign: 'center', padding: '24px' }}>
            <p style={{ fontWeight: 600, marginBottom: '8px' }}>¡Contraseña actualizada!</p>
            <p style={{ fontSize: '14px' }}>Redirigiendo a tu panel...</p>
          </div>
        ) : (
          <form className="login-form" onSubmit={handleReset}>
            <div className="input-group">
              <label><Lock size={14} /> Nueva contraseña</label>
              <div className="login-password-input" style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="input-group">
              <label><Lock size={14} /> Repetir contraseña</label>
              <input
                className="input"
                type={showPassword ? 'text' : 'password'}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="Repetí la contraseña"
                required
              />
            </div>

            {error && <div className="login-alert">{error}</div>}

            <button type="submit" className="btn btn--accent btn--lg" disabled={loading} style={{ width: '100%', marginTop: '8px' }}>
              {loading ? <Loader size={18} className="spin" /> : <><Save size={18} /> Guardar y Continuar</>}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
