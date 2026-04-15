import { Link } from 'react-router-dom'
import { Sailboat, Mail, Heart } from 'lucide-react'
import './Footer.css'

/* Inline SVG icons for social platforms (not available in lucide-react) */
const InstagramIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
)

const FacebookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
)

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          {/* Brand */}
          <div className="footer__brand">
            <Link to="/" className="footer__logo">
              <Sailboat size={24} />
              <span>Velero</span>
            </Link>
            <p className="footer__tagline">
              Conectamos viajeros con capitanes que ofrecen experiencias en velero únicas, accesibles y sostenibles.
            </p>
            <div className="footer__social">
              <a href="https://www.instagram.com/bluhar.ok" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <InstagramIcon />
              </a>
              <a href="https://www.facebook.com/profile.php?id=61557620967961" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <FacebookIcon />
              </a>
              <a href="mailto:soporte@bluhar.com" aria-label="Email">
                <Mail size={20} />
              </a>
            </div>
          </div>

          {/* Explorar */}
          <div className="footer__col">
            <h4 className="footer__heading">Explorar</h4>
            <Link to="/explorar" className="footer__link">Buscar Travesías</Link>
            <a href="/#beneficios" className="footer__link">¿Por qué Velero?</a>
            <a href="/#testimonios" className="footer__link">Testimonios</a>
          </div>

          {/* Capitanes */}
          <div className="footer__col">
            <h4 className="footer__heading">Para Capitanes</h4>
            <Link to="/login" className="footer__link">Publicar Travesía</Link>
            <Link to="/login" className="footer__link">Mi Dashboard</Link>
          </div>

          {/* Legal */}
          <div className="footer__col">
            <h4 className="footer__heading">Legal</h4>
            <a href="#" className="footer__link">Términos y Condiciones</a>
            <a href="#" className="footer__link">Privacidad</a>
            <a href="#" className="footer__link">Cookies</a>
            <a href="#" className="footer__link">Preguntas Frecuentes</a>
          </div>
        </div>

        <div className="footer__bottom">
          <p>© {new Date().getFullYear()} Velero. Todos los derechos reservados.</p>
          <p className="footer__made">
            Hecho con <Heart size={14} className="footer__heart" /> para el agua
          </p>
        </div>
      </div>
    </footer>
  )
}
