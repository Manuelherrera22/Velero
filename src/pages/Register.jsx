import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Sailboat, Compass, Anchor, ArrowRight, Eye, EyeOff, Loader, Check } from 'lucide-react'
import useAuthStore from '../stores/authStore'
import './Register.css'

export default function Register() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { signUp, error, clearError } = useAuthStore()

  // Auto-detect role from URL: /registro?rol=capitan
  const isCaptain = searchParams.get('rol') === 'capitan'
  const role = isCaptain ? 'publisher' : 'viewer'

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [localError, setLocalError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()
    setLocalError('')

    if (fullName.trim().length < 2) {
      setLocalError('Ingresá tu nombre completo.')
      return
    }
    if (password.length < 6) {
      setLocalError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setLoading(true)
    try {
      const result = await signUp(email, password, fullName.trim(), role)
      if (result.success) {
        setSuccess(true)
      }
    } finally {
      setLoading(false)
    }
  }

  // Success state
  if (success) {
    return (
      <div className="register-page">
        <div className="register-card glass animate-fade-in">
          <div className="register-success-icon">
            <Check size={48} />
          </div>
          <h1 className="register-card__title">¡Cuenta creada!</h1>
          <p className="register-card__subtitle">
            {isCaptain
              ? 'Tu cuenta de capitán está lista. Revisá tu email para confirmar y luego accedé a tu panel para crear tu primera travesía.'
              : 'Tu cuenta está lista. Revisá tu email para confirmar y empezá a explorar travesías.'}
          </p>
          <Link to="/login" className="btn btn--accent btn--lg register-card__submit">
            Ir a Iniciar Sesión
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="register-page">
      <div className="register-card glass animate-fade-in">
        {/* Header — adapts to role */}
        <div className={`register-role-badge ${isCaptain ? 'register-role-badge--captain' : ''}`}>
          {isCaptain ? <Anchor size={28} /> : <Compass size={28} />}
        </div>

        <h1 className="register-card__title">
          {isCaptain ? 'Registro de Capitán' : 'Creá tu cuenta'}
        </h1>
        <p className="register-card__subtitle">
          {isCaptain
            ? 'Completá tus datos para empezar a publicar travesías en Kailu.'
            : 'Registrate para explorar y reservar travesías náuticas.'}
        </p>

        {/* Error Messages */}
        {(error || localError) && (
          <div className="register-error">{localError || error}</div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="register-form">
          <div className="input-group">
            <label className="register-label">
              {isCaptain ? 'Nombre completo (como capitán)' : 'Nombre completo'}
            </label>
            <input
              type="text"
              className="input"
              placeholder={isCaptain ? 'Ej: Cap. Juan Pérez' : 'Ej: Juan Pérez'}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="register-label">Email</label>
            <input
              type="email"
              className="input"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="register-label">Contraseña</label>
            <div className="register-password-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                className="input"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <button
                type="button"
                className="register-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn--accent btn--lg register-card__submit"
            disabled={loading}
          >
            {loading ? (
              <Loader size={18} className="spin" />
            ) : (
              <>
                {isCaptain ? 'Crear cuenta de Capitán' : 'Crear mi cuenta'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Footer links */}
        <p className="register-card__note">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="register-link">Iniciá sesión</Link>
        </p>

        {!isCaptain && (
          <Link to="/registro?rol=capitan" className="register-switch-cta">
            <Anchor size={16} />
            <span>¿Sos capitán? <strong>Registrate acá</strong></span>
          </Link>
        )}

        {isCaptain && (
          <Link to="/registro" className="register-switch-cta">
            <Compass size={16} />
            <span>¿Sos viajero? <strong>Registrate como viajero</strong></span>
          </Link>
        )}
      </div>
    </div>
  )
}
