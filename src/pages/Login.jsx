import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Phone, ArrowRight, Sailboat, Sparkles, Loader, Lock, Eye, EyeOff } from 'lucide-react'
import useAuthStore from '../stores/authStore'
import supabase from '../lib/supabase'
import './Login.css'

export default function Login() {
  const [method, setMethod] = useState('email')
  const [value, setValue] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [otpStep, setOtpStep] = useState(false)
  const [otp, setOtp] = useState('')

  // Password login
  const [usePassword, setUsePassword] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  const { signInWithEmail, signInWithPhone, verifyPhoneOtp, error, clearError } = useAuthStore()

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()
    setPasswordError('')
    setLoading(true)

    try {
      if (method === 'email') {
        if (usePassword) {
          // Email + Password login
          const { data, error: authError } = await supabase.auth.signInWithPassword({
            email: value,
            password,
          })
          if (authError) {
            setPasswordError(authError.message === 'Invalid login credentials'
              ? 'Email o contraseña incorrectos'
              : authError.message)
          } else {
            window.location.href = '/'
          }
        } else {
          const result = await signInWithEmail(value)
          if (result.success) setSent(true)
        }
      } else {
        const result = await signInWithPhone(value)
        if (result.success) setOtpStep(true)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    clearError()
    setLoading(true)

    try {
      const result = await verifyPhoneOtp(value, otp)
      if (result.success) {
        window.location.href = '/'
      }
    } finally {
      setLoading(false)
    }
  }

  // OTP verification step
  if (otpStep) {
    return (
      <div className="login-page">
        <div className="login-card glass animate-fade-in">
          <div className="login-sent__icon">
            <Phone size={48} />
          </div>
          <h1 className="login-card__title">Ingresa el código</h1>
          <p className="login-card__subtitle">
            Enviamos un código de verificación al <strong>{value}</strong>
          </p>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleVerifyOtp}>
            <div className="input-group">
              <input
                type="text"
                className="input login-otp-input"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                autoFocus
                required
              />
            </div>
            <button type="submit" className="btn btn--accent btn--lg login-card__submit" disabled={loading}>
              {loading ? <Loader size={18} className="spin" /> : 'Verificar'}
            </button>
          </form>

          <button onClick={() => { setOtpStep(false); clearError() }} className="btn btn--ghost" style={{ width: '100%', marginTop: '12px' }}>
            Volver
          </button>
        </div>
      </div>
    )
  }

  // Sent confirmation
  if (sent) {
    return (
      <div className="login-page">
        <div className="login-card glass animate-fade-in">
          <div className="login-sent__icon">
            <Sparkles size={48} />
          </div>
          <h1 className="login-card__title">¡Revisa tu email!</h1>
          <p className="login-card__subtitle">
            Te enviamos un enlace mágico a <strong>{value}</strong>. Haz click para ingresar.
          </p>
          <button onClick={() => { setSent(false); clearError() }} className="btn btn--ghost" style={{ width: '100%' }}>
            Volver a intentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="login-page">
      <div className="login-card glass animate-fade-in">
        <div className="login-card__logo">
          <Sailboat size={36} />
        </div>

        <h1 className="login-card__title">Bienvenido a Velero</h1>
        <p className="login-card__subtitle">
          {usePassword
            ? 'Ingresa con tu email y contraseña.'
            : 'Ingresa con tu email o teléfono. Sin contraseñas, sin complicaciones.'}
        </p>

        {error && <div className="login-error">{error}</div>}
        {passwordError && <div className="login-error">{passwordError}</div>}

        {/* Method Toggle */}
        {!usePassword && (
          <div className="login-toggle">
            <button
              className={`login-toggle__btn ${method === 'email' ? 'login-toggle__btn--active' : ''}`}
              onClick={() => { setMethod('email'); setValue(''); clearError() }}
            >
              <Mail size={16} /> Email
            </button>
            <button
              className={`login-toggle__btn ${method === 'phone' ? 'login-toggle__btn--active' : ''}`}
              onClick={() => { setMethod('phone'); setValue(''); clearError() }}
            >
              <Phone size={16} /> Teléfono
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            {method === 'email' || usePassword ? (
              <input
                type="email"
                className="input"
                placeholder="tu@email.com"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
                autoFocus
              />
            ) : (
              <input
                type="tel"
                className="input"
                placeholder="+54 11 1234 5678"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
                autoFocus
              />
            )}
          </div>

          {/* Password field */}
          {usePassword && (
            <div className="input-group" style={{ marginTop: 'var(--space-3)' }}>
              <div className="profile-password-input">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  placeholder="Tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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
          )}

          <button type="submit" className="btn btn--accent btn--lg login-card__submit" disabled={loading}>
            {loading ? (
              <Loader size={18} className="spin" />
            ) : (
              <>
                {usePassword ? 'Iniciar sesión' : method === 'email' ? 'Enviar enlace mágico' : 'Enviar código'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Toggle password/magic link */}
        <button
          className="btn btn--ghost login-password-toggle"
          onClick={() => {
            setUsePassword(!usePassword)
            setMethod('email')
            setPassword('')
            setPasswordError('')
            clearError()
          }}
        >
          <Lock size={14} />
          {usePassword ? 'Usar enlace mágico' : '¿Tenés contraseña? Ingresá con ella'}
        </button>

        <p className="login-card__note">
          Al ingresar aceptas nuestros <a href="#">Términos y Condiciones</a> y <a href="#">Política de Privacidad</a>.
        </p>
      </div>
    </div>
  )
}
