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
          <h1 className="login-card__title" style={{ color: 'var(--color-primary-500)' }}>✨ Revisa tu bandeja de entrada</h1>
          <p className="login-card__subtitle" style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginTop: '16px' }}>
            Te hemos enviado un link de acceso seguro a <strong>{value}</strong>.
          </p>
          <div style={{ padding: '16px', background: 'var(--color-primary-50)', border: '1px solid var(--color-primary-100)', borderRadius: 'var(--radius-lg)', margin: '20px 0', textAlign: 'center' }}>
            <p style={{ margin: 0, fontWeight: 500, color: 'var(--color-primary-800)' }}>
              Por favor, cierra o minimiza esta ventana, abre tu aplicación de correo electrónico y haz clic en el enlace para entrar automáticamente a tu cuenta.
            </p>
          </div>
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

        <h1 className="login-card__title">Bienvenido a Kailu</h1>
        <p className="login-card__subtitle">
          {usePassword
            ? 'Ingresa con tu email y contraseña.'
            : 'Ingresa con tu email. Sin contraseñas, sin complicaciones.'}
        </p>

        {error && <div className="login-error" style={{ background: '#FEE2E2', color: '#B91C1C', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #FCA5A5', fontSize: '0.9rem', fontWeight: 500 }}>{error}</div>}
        {passwordError && <div className="login-error" style={{ background: '#FEE2E2', color: '#B91C1C', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #FCA5A5', fontSize: '0.9rem', fontWeight: 500 }}>{passwordError}</div>}

        {/* Method Toggle */}
        {!usePassword && (
          <div className="login-toggle" style={{ gridTemplateColumns: '1fr' }}>
            <button
              className={`login-toggle__btn login-toggle__btn--active`}
            >
              <Mail size={16} /> Ingresar con Email
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

          {usePassword && (
            <div style={{ textAlign: 'right', marginTop: '8px' }}>
              <button 
                type="button" 
                className="btn btn--ghost btn--sm" 
                onClick={() => alert("La recuperación de contraseña requiere configurar una página dedicada. Por ahora, podés volver a ingresar usando el 'Link de acceso'.")} 
                style={{ padding: 0, height: 'auto', fontSize: '0.85rem', color: 'var(--text-tertiary)' }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}

          <button type="submit" className="btn btn--accent btn--lg login-card__submit" disabled={loading} style={{ marginTop: 'var(--space-4)' }}>
            {loading ? (
              <Loader size={18} className="spin" />
            ) : (
              <>
                {usePassword ? 'Iniciar sesión' : method === 'email' ? 'Enviar link de acceso' : 'Enviar código'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="login-divider"><span>Otras opciones</span></div>

        <div className="flex flex-col gap-3">
          {/* Toggle password/magic link */}
          <button
            className="btn btn--ghost login-password-toggle w-full"
            onClick={() => {
              setUsePassword(!usePassword)
              setMethod('email')
              setPassword('')
              setPasswordError('')
              clearError()
            }}
          >
            <Lock size={14} />
            {usePassword ? 'Ingresar con link de acceso' : '¿Tenés contraseña? Ingresá con ella'}
          </button>

          {/* Registration CTA */}
          <div className="login-register-cta text-center mb-1">
            <p>¿No tenés cuenta?{' '}
              <Link to="/registro" className="login-register-link font-bold">
                Registrate acá
              </Link>
            </p>
          </div>

          {/* Captain CTA */}
          <Link to="/registro?rol=capitan" className="login-captain-cta mt-2">
            <div className="login-captain-cta__icon">
              <Sailboat size={20} />
            </div>
            <div className="login-captain-cta__text">
              <strong>¿Sos capitán?</strong>
              <span>Registrate y publicá tu primera travesía</span>
            </div>
            <ArrowRight size={16} className="login-captain-cta__arrow" />
          </Link>

          {/* Affiliate CTA */}
          <Link to="/registro?rol=afiliado" className="login-captain-cta" style={{ background: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.15)' }}>
            <div className="login-captain-cta__text" style={{ paddingLeft: '8px' }}>
              <strong>¿Querés ser afiliado?</strong>
              <span>Recomendá travesías y ganá comisiones</span>
            </div>
            <ArrowRight size={16} className="login-captain-cta__arrow" style={{ color: 'var(--color-success)' }} />
          </Link>
        </div>

        <p className="login-card__note" style={{ marginTop: 'var(--space-4)' }}>
          Al ingresar aceptas nuestros <a href="#">Términos y Condiciones</a> y <a href="#">Política de Privacidad</a>.
        </p>
      </div>
    </div>
  )
}
