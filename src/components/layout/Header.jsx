import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, Sailboat, User, LogOut, LayoutDashboard, Ticket, Building2 } from 'lucide-react'
import useAuthStore from '../../stores/authStore'
import Notifications from './Notifications'
import './Header.css'

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, profile, signOut } = useAuthStore()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
    setUserMenuOpen(false)
  }, [location])

  const handleSignOut = async () => {
    setUserMenuOpen(false)
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <header className={`header ${scrolled ? 'header--scrolled' : ''}`}>
      <div className="container header__inner">
        <Link to="/" className="header__logo" aria-label="Kailu Home">
          <img src="/logo-kailu.jpg" alt="Kailu" style={{ height: '48px', width: 'auto', borderRadius: '4px' }} />
        </Link>

        <nav className={`header__nav ${menuOpen ? 'header__nav--open' : ''}`}>
          <Link to="/explorar" className="header__link">
            Explorar Travesías
          </Link>
          <a href="/#beneficios" className="header__link">
            ¿Por qué Kailu?
          </a>
          <a href="/#testimonios" className="header__link">
            Testimonios
          </a>

          {user ? (
            <>
              {(profile?.role === 'publisher' || profile?.role === 'admin') && (
                <Link to="/dashboard" className="header__link header__link--captain">
                  <LayoutDashboard size={16} />
                  Panel Capitán
                </Link>
              )}
              {(profile?.role === 'affiliate' || profile?.role === 'admin') && (
                <Link to="/afiliado" className="header__link header__link--captain" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
                  <Building2 size={16} />
                  Panel Aliado Kailu
                </Link>
              )}
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px' }}>
                <Notifications />
                
                <div className="header__user-menu">
                <button 
                  className="header__user-btn"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <div className="header__user-avatar">
                    {(profile?.full_name || user.email || '?').charAt(0).toUpperCase()}
                  </div>
                  <span className="header__user-name">
                    {profile?.full_name || user.email?.split('@')[0] || 'Mi cuenta'}
                  </span>
                </button>

              {userMenuOpen && (
                <div className="header__dropdown glass animate-fade-in">
                  <Link to="/mis-viajes" className="header__dropdown-item">
                    <Ticket size={16} /> Mis Viajes
                  </Link>
                  <Link to="/perfil" className="header__dropdown-item">
                    <User size={16} /> Mi Perfil
                  </Link>
                  {(profile?.role === 'publisher' || profile?.role === 'admin') && (
                    <Link to="/dashboard" className="header__dropdown-item">
                      <LayoutDashboard size={16} /> Dashboard
                    </Link>
                  )}
                  <button onClick={handleSignOut} className="header__dropdown-item header__dropdown-item--danger">
                    <LogOut size={16} /> Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
            </div>
            </>
          ) : (
            <Link to="/login" className="header__link header__link--cta">
              <User size={16} />
              Ingresar
            </Link>
          )}
        </nav>

        <button
          className="header__toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </header>
  )
}
