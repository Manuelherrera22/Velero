import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Sailboat, Compass, Anchor, Building2, ArrowRight, Eye, EyeOff, Loader, Check } from 'lucide-react'
import useAuthStore from '../stores/authStore'
import supabase from '../lib/supabase'
import './Register.css'

const ROLE_CONFIG = {
  viewer: {
    icon: Compass,
    title: 'Creá tu cuenta',
    subtitle: 'Registrate para explorar y reservar travesías náuticas.',
    nameLabel: 'Nombre completo',
    namePlaceholder: 'Ej: Juan Pérez',
    buttonText: 'Crear mi cuenta',
    successMsg: '¡Casi listo! Enviamos un link a tu email para validar tu cuenta. Debés confirmarlo para empezar a explorar.',
    badgeClass: '',
  },
  publisher: {
    icon: Anchor,
    title: 'Registro de Capitán',
    subtitle: 'Completá tus datos para empezar a publicar travesías en Kailu.',
    nameLabel: 'Nombre completo (como capitán)',
    namePlaceholder: 'Ej: Cap. Juan Pérez',
    buttonText: 'Crear cuenta de Capitán',
    successMsg: '¡Casi listo! Enviamos un link a tu email. Debés validarlo para acceder a tu panel de capitán.',
    badgeClass: 'register-role-badge--captain',
  },
  affiliate: {
    icon: Building2,
    title: 'Registro de Aliado Kailu',
    subtitle: 'Registrá tu hotel o agencia para recomendar travesías y ganar comisiones.',
    nameLabel: 'Nombre del responsable',
    namePlaceholder: 'Ej: María García',
    buttonText: 'Crear cuenta de Aliado',
    successMsg: '¡Casi listo! Enviamos un link a tu email. Debés validarlo para acceder a tu panel de aliado.',
    badgeClass: 'register-role-badge--affiliate',
  },
}

export default function Register() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { signUp, error, clearError, isAuthenticated } = useAuthStore()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      window.location.href = '/mis-viajes'
    }
  }, [isAuthenticated])

  // Auto-detect role from URL
  const rolParam = searchParams.get('rol')
  const role = rolParam === 'capitan' ? 'publisher'
    : rolParam === 'afiliado' ? 'affiliate'
    : 'viewer'
  const config = ROLE_CONFIG[role]
  const RoleIcon = config.icon

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [businessLocation, setBusinessLocation] = useState('')
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
    if (role === 'affiliate' && !businessName.trim()) {
      setLocalError('Ingresá el nombre de tu negocio.')
      return
    }

    setLoading(true)
    try {
      // Pasamos también el teléfono a la función signUp o actualizamos el perfil luego
      const result = await signUp(email, password, fullName.trim(), role)
      if (result.success) {
        // Guardar el teléfono en el perfil
        if (result.data?.user && phone.trim()) {
          await supabase.from('profiles').update({ phone: phone.trim() }).eq('id', result.data.user.id)
        }

        // If affiliate, create the hotel/business record
        if (role === 'affiliate' && result.data?.user) {
          await supabase.from('hotels').insert({
            name: businessName.trim(),
            location: businessLocation.trim() || null,
            contact_email: email,
            contact_phone: phone.trim() || null,
            commission_percent: 10,
            owner_id: result.data.user.id,
            business_type: 'hotel',
          })
        }
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
          <h1 className="register-card__title">¡Validá tu email!</h1>
          <p className="register-card__subtitle">{config.successMsg}</p>
          <a href="mailto:" target="_blank" rel="noopener noreferrer" className="btn btn--accent btn--lg register-card__submit">
            Revisar mi correo
            <ArrowRight size={18} />
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="register-page">
      <div className="register-card glass animate-fade-in">
        {/* Header — adapts to role */}
        <div className={`register-role-badge ${config.badgeClass}`}>
          <RoleIcon size={28} />
        </div>

        <h1 className="register-card__title">{config.title}</h1>
        <p className="register-card__subtitle">{config.subtitle}</p>

        {/* Error Messages */}
        {(error || localError) && (
          <div className="register-error">{localError || error}</div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="register-form">
          {/* Affiliate: Business fields */}
          {role === 'affiliate' && (
            <>
              <div className="input-group">
                <label className="register-label">Nombre del negocio *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ej: Hotel Faena, Agencia Turismo Norte"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <label className="register-label">Ubicación del negocio</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ej: Puerto Madero, Buenos Aires"
                  value={businessLocation}
                  onChange={(e) => setBusinessLocation(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="input-group">
            <label className="register-label">{config.nameLabel}</label>
            <input
              type="text"
              className="input"
              placeholder={config.namePlaceholder}
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

          {(role === 'affiliate' || role === 'publisher') && (
            <div className="input-group">
              <label className="register-label">Teléfono (opcional)</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  className="input"
                  style={{ width: '100px', padding: '0.75rem 0.5rem' }}
                  value={phone.match(/^\+\d+/)?.[0] || '+54'}
                  onChange={(e) => {
                    const currentNumber = phone.replace(/^\+\d+\s*/, '')
                    setPhone(e.target.value + ' ' + currentNumber)
                  }}
                >
                  <option value="+54">🇦🇷 +54</option>
                  <option value="+55">🇧🇷 +55</option>
                  <option value="+56">🇨🇱 +56</option>
                  <option value="+598">🇺🇾 +598</option>
                  <option value="+595">🇵🇾 +595</option>
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+34">🇪🇸 +34</option>
                </select>
                <input
                  type="tel"
                  className="input"
                  style={{ flex: 1 }}
                  placeholder="11 1234 5678"
                  value={phone.replace(/^\+\d+\s*/, '')}
                  onChange={(e) => {
                    const prefix = phone.match(/^\+\d+/)?.[0] || '+54'
                    setPhone(prefix + ' ' + e.target.value)
                  }}
                />
              </div>
            </div>
          )}

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
                {config.buttonText}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Footer links */}
        <p className="register-card__note">
          ¿Ya tenés cuenta?{' '}
          <Link to={`/login${role !== 'viewer' ? '?method=password' : ''}`} className="register-link">Iniciá sesión</Link>
        </p>

        {/* Switch CTAs */}
        {role === 'viewer' && (
          <>
            <Link to="/registro?rol=capitan" className="register-switch-cta">
              <Anchor size={16} />
              <span>¿Sos capitán? <strong>Registrate acá</strong></span>
            </Link>
            <Link to="/registro?rol=afiliado" className="register-switch-cta">
              <Building2 size={16} />
              <span>¿Tenés un hotel o agencia? <strong>Registrate como Aliado Kailu</strong></span>
            </Link>
          </>
        )}

        {role === 'publisher' && (
          <Link to="/registro" className="register-switch-cta">
            <Compass size={16} />
            <span>¿Sos viajero? <strong>Registrate como viajero</strong></span>
          </Link>
        )}

        {role === 'affiliate' && (
          <Link to="/registro" className="register-switch-cta">
            <Compass size={16} />
            <span>¿Sos viajero? <strong>Registrate como viajero</strong></span>
          </Link>
        )}
      </div>
    </div>
  )
}
