import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sailboat, Compass, Anchor, ArrowRight, Eye, EyeOff, Loader, Check } from 'lucide-react'
import useAuthStore from '../stores/authStore'
import './Register.css'

export default function Register() {
  const navigate = useNavigate()
  const { signUp, error, clearError } = useAuthStore()

  const [role, setRole] = useState(null) // 'viewer' | 'publisher'
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

    if (!role) {
      setLocalError('Seleccioná un tipo de cuenta.')
      return
    }
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
            {role === 'publisher'
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
        <div className="register-card__logo">
          <Sailboat size={36} />
        </div>

        <h1 className="register-card__title">Creá tu cuenta</h1>
        <p className="register-card__subtitle">
          Elegí cómo querés usar Kailu
        </p>

        {/* Role Selector */}
        <div className="register-roles">
          <button
            type="button"
            className={`register-role ${role === 'viewer' ? 'register-role--active' : ''}`}
            onClick={() => { setRole('viewer'); clearError(); setLocalError('') }}
          >
            <div className="register-role__icon">
              <Compass size={28} />
            </div>
            <div className="register-role__info">
              <strong>Viajero</strong>
              <span>Explorá y reservá travesías</span>
            </div>
            {role === 'viewer' && <Check size={18} className="register-role__check" />}
          </button>

          <button
            type="button"
            className={`register-role ${role === 'publisher' ? 'register-role--active' : ''}`}
            onClick={() => { setRole('publisher'); clearError(); setLocalError('') }}
          >
            <div className="register-role__icon">
              <Anchor size={28} />
            </div>
            <div className="register-role__info">
              <strong>Capitán</strong>
              <span>Publicá y gestioná travesías</span>
            </div>
            {role === 'publisher' && <Check size={18} className="register-role__check" />}
          </button>
        </div>

        {/* Error Messages */}
        {(error || localError) && (
          <div className="register-error">{localError || error}</div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="register-form">
          <div className="input-group">
            <label className="register-label">Nombre completo</label>
            <input
              type="text"
              className="input"
              placeholder="Ej: Juan Pérez"
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
                Crear mi cuenta
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <p className="register-card__note">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="register-link">Iniciá sesión</Link>
        </p>
      </div>
    </div>
  )
}
