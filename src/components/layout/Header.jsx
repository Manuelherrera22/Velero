import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Sailboat, User, LogOut, LayoutDashboard } from 'lucide-react'
import useAuthStore from '../../stores/authStore'
import './Header.css'

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const location = useLocation()
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
    await signOut()
    setUserMenuOpen(false)
  }

  return (
    <header className={`header ${scrolled ? 'header--scrolled' : ''}`}>
      <div className="container header__inner">
        <Link to="/" className="header__logo" aria-label="Velero Home">
          <Sailboat size={28} strokeWidth={2.2} />
          <span className="header__logo-text">Velero</span>
        </Link>

        <nav className={`header__nav ${menuOpen ? 'header__nav--open' : ''}`}>
          <Link to="/explorar" className="header__link">
            Explorar Travesías
          </Link>
          <a href="/#beneficios" className="header__link">
            ¿Por qué Velero?
          </a>
          <a href="/#testimonios" className="header__link">
            Testimonios
          </a>

          {user ? (
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
