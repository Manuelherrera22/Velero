import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Anchor, Shield, CalendarCheck, Leaf, Star, 
  MapPin, Users, ArrowRight, Compass, Waves,
  Clock, ChevronRight, Sparkles, Quote
} from 'lucide-react'
import useTripStore from '../stores/tripStore'
import './Landing.css'

/* ── Fallback mock data (shown when no published trips in DB) ── */
const MOCK_TRIPS = [
  { id: '1', title: 'Paseo por el Río de la Plata', location: 'San Fernando, Buenos Aires', price_per_person: 25000, currency: 'ARS', capacity: 6, tags: ['Paseo', 'Río'], captain: { full_name: 'Carlos M.' } },
  { id: '2', title: 'Atardecer en el Delta del Paraná', location: 'Tigre, Buenos Aires', price_per_person: 30000, currency: 'ARS', capacity: 4, tags: ['Atardecer', 'Delta'], captain: { full_name: 'Miguel A.' } },
  { id: '3', title: 'Navegación por Lago Nahuel Huapi', location: 'Bariloche, Río Negro', price_per_person: 45000, currency: 'ARS', capacity: 8, tags: ['Aventura', 'Lago'], captain: { full_name: 'Javier R.' } },
]

const BENEFITS = [
  { icon: Shield, title: 'Capitanes Verificados', description: 'Licencias náuticas verificadas, amplia experiencia y compromiso con la seguridad de cada pasajero.' },
  { icon: Sparkles, title: 'Experiencias Curadas', description: 'Cada travesía es revisada para garantizar calidad, autenticidad y una experiencia inolvidable.' },
  { icon: CalendarCheck, title: 'Reserva Simple', description: 'Elige fecha, paga en segundos con Mercado Pago, y recibe tu confirmación al instante. Sin registro obligatorio.' },
  { icon: Leaf, title: 'Navegación Sostenible', description: 'Experiencias respetuosas con el entorno natural. Navegar a vela es la forma más limpia de explorar el agua.' },
]

const TESTIMONIALS = [
  { name: 'Micaela', location: 'Buenos Aires, Río de la Plata', text: 'Una experiencia increíble. Nunca pensé que navegar en velero fuera tan accesible. El capitán nos hizo sentir seguros y la vista fue espectacular.', rating: 5 },
  { name: 'Valentina', location: 'Buenos Aires, Delta de San Fernando', text: 'Fue el mejor regalo de cumpleaños. El delta desde un velero es otro mundo. Súper recomendado para desconectar de la rutina.', rating: 5 },
  { name: 'Susana', location: 'Alicante, Altea', text: 'Navegamos por la bahía al atardecer. Un sueño hecho realidad. La plataforma fue muy fácil de usar y todo salió perfecto.', rating: 5 },
]

const STEPS = [
  { num: '01', title: 'Explora', desc: 'Busca travesías por destino, fecha o tipo de experiencia.' },
  { num: '02', title: 'Reserva', desc: 'Elige tu fecha, selecciona extras y paga de forma segura.' },
  { num: '03', title: 'Navega', desc: 'Vive una experiencia única en el agua con capitanes expertos.' },
]

export default function Landing() {
  const revealRefs = useRef([])
  const { featuredTrips, fetchFeaturedTrips } = useTripStore()

  useEffect(() => {
    fetchFeaturedTrips()
  }, [])

  const displayTrips = featuredTrips.length > 0 ? featuredTrips : MOCK_TRIPS

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    )

    revealRefs.current.forEach((el) => {
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  const addRevealRef = (el) => {
    if (el && !revealRefs.current.includes(el)) {
      revealRefs.current.push(el)
    }
  }

  const formatPrice = (price, currency) => {
    if (currency === 'EUR') return `€${price}`
    if (currency === 'USD') return `US$${price}`
    return `$${price?.toLocaleString('es-AR')}`
  }

  return (
    <div className="landing">
      {/* ══════════════════ HERO ══════════════════ */}
      <section className="hero">
        <div className="hero__bg">
          <div 
            className="hero__video"
            style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              width: '100%', 
              height: '100%', 
              backgroundImage: 'url("https://images.unsplash.com/photo-1505228395891-9a51e7e86bf6?q=80&w=2000&auto=format&fit=crop")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 1, 
              zIndex: 0,
              animation: 'panZoom 30s infinite alternate linear'
            }}
          />
          <div className="hero__gradient" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 100%)', zIndex: 1 }} />
          <div className="hero__particles" style={{ zIndex: 2 }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="hero__particle" style={{
                '--delay': `${i * 1.2}s`,
                '--x': `${20 + i * 15}%`,
                '--y': `${30 + (i % 3) * 20}%`,
              }} />
            ))}
          </div>
        </div>

        <div className="container hero__content">
          <div className="hero__badge animate-fade-in">
            <Waves size={14} />
            <span>Experiencias Auténticas</span>
          </div>

          <h1 className="hero__title animate-slide-up">
            Descubre el agua<br />
            <span className="hero__title--accent">desde otra perspectiva</span>
          </h1>

          <p className="hero__subtitle animate-slide-up" style={{ animationDelay: '0.2s' }}>
            Conectamos viajeros con capitanes que ofrecen travesías en velero 
            únicas, accesibles y sostenibles. Sin complicaciones.
          </p>

          <div className="hero__actions animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <Link to="/explorar" className="btn btn--accent btn--lg">
              Explorar Travesías
              <ArrowRight size={18} />
            </Link>
            <a href="#como-funciona" className="btn btn--ghost btn--lg" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.1)' }}>
              ¿Cómo funciona?
            </a>
          </div>


        </div>

        <div className="hero__scroll-indicator">
          <div className="hero__scroll-line" />
        </div>
      </section>

      {/* ══════════════════ TRAVESÍAS DESTACADAS ══════════════════ */}
      <section className="section" id="travesias">
        <div className="container reveal" ref={addRevealRef}>
          <div className="section__header-row">
            <div>
              <p className="section__label">Travesías Destacadas</p>
              <h2 className="section__title">
                Activa el modo velero
              </h2>
            </div>
            <Link to="/explorar" className="btn btn--outline">
              Ver Todas
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="divider" />

          <div className="trips-grid stagger-children">
            {displayTrips.map((trip) => (
              <Link key={trip.id} to={`/travesia/${trip.id}`} className="trip-card card">
                <div className="trip-card__image-wrap">
                  {trip.images?.[0] ? (
                    <img src={trip.images[0]} alt={trip.title} className="card__image" />
                  ) : (
                    <div className="trip-card__image-placeholder">
                      <Compass size={40} />
                      <span>{trip.location}</span>
                    </div>
                  )}
                  <div className="trip-card__overlay">
                    <span className="card__tag">
                      {trip.tags?.[0] || 'Travesía'}
                    </span>
                  </div>
                </div>
                <div className="card__body">
                  <div className="trip-card__meta">
                    <span className="trip-card__location">
                      <MapPin size={14} /> {trip.location}
                    </span>
                    <span className="trip-card__duration">
                      <Users size={14} /> {trip.capacity} pers.
                    </span>
                  </div>
                  <h3 className="card__title">{trip.title}</h3>
                  <p className="trip-card__captain">
                    <Anchor size={13} /> Capitán {trip.captain?.full_name || 'Verificado'}
                  </p>
                </div>
                <div className="card__footer">
                  <div className="card__rating">
                    <Star size={14} fill="currentColor" />
                    {trip.avgRating || '—'}
                  </div>
                  <div className="card__price">
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 'normal', marginRight: '4px' }}>Desde</span>
                    {formatPrice(trip.price_per_person, trip.currency)}
                    <span>/persona</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ CÓMO FUNCIONA ══════════════════ */}
      <section className="section section--dark" id="como-funciona">
        <div className="container reveal" ref={addRevealRef}>
          <p className="section__label">Simple y Rápido</p>
          <h2 className="section__title">
            De la pantalla al agua en 3 pasos
          </h2>
          <div className="divider" />

          <div className="steps-row stagger-children">
            {STEPS.map((step, i) => (
              <div key={i} className="step-card">
                <span className="step-card__num">{step.num}</span>
                <h3 className="step-card__title">{step.title}</h3>
                <p className="step-card__desc">{step.desc}</p>
                {i < STEPS.length - 1 && (
                  <ChevronRight size={20} className="step-card__arrow" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ BENEFICIOS ══════════════════ */}
      <section className="section" id="beneficios" ref={addRevealRef}>
        <div className="container reveal" ref={addRevealRef}>
          <p className="section__label">¿Por qué Kailu?</p>
          <h2 className="section__title">
            Cada travesía está pensada para ofrecer algo más que un paseo
          </h2>
          <div className="divider" />

          <div className="benefits-grid stagger-children">
            {BENEFITS.map((benefit, i) => (
              <div key={i} className="benefit-card glass">
                <div className="benefit-card__icon">
                  <benefit.icon size={24} />
                </div>
                <h3 className="benefit-card__title">{benefit.title}</h3>
                <p className="benefit-card__desc">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ TESTIMONIOS ══════════════════ */}
      <section className="section" id="testimonios">
        <div className="container reveal" ref={addRevealRef}>
          <p className="section__label">Testimonios</p>
          <h2 className="section__title">
            Lo que dicen nuestros viajeros
          </h2>
          <div className="divider" />

          <div className="testimonials-grid stagger-children">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="testimonial-card glass">
                <Quote size={28} className="testimonial-card__quote" />
                <p className="testimonial-card__text">{t.text}</p>
                <div className="testimonial-card__rating">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} size={14} fill="currentColor" />
                  ))}
                </div>
                <div className="testimonial-card__author">
                  <div className="testimonial-card__avatar">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <strong>{t.name}</strong>
                    <span>{t.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ CTA CAPITANES ══════════════════ */}
      <section className="section captain-cta">
        <div className="container reveal" ref={addRevealRef}>
          <div className="captain-cta__card glass">
            <div className="captain-cta__content">
              <p className="section__label">Para Capitanes</p>
              <h2 className="captain-cta__title">
                Comparte tu pasión,<br />conecta con tripulantes
              </h2>
              <ul className="captain-cta__list">
                <li><Anchor size={16} /> Publica tus travesías y gestiona reservas</li>
                <li><Users size={16} /> Llega a viajeros de todo el mundo</li>
                <li><Shield size={16} /> Navega con el respaldo de la plataforma</li>
              </ul>
              <div className="captain-cta__actions">
                <Link to="/login" className="btn btn--primary btn--lg">
                  Publicar Travesía
                  <ArrowRight size={18} />
                </Link>
                <a 
                  href="https://wa.me/5491161789818?text=Hola%20Kailu!%20Quiero%20agendar%20una%20reunión%20como%20capitán" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--ghost btn--lg"
                >
                  Agendar Demo
                </a>
              </div>
            </div>
            <div className="captain-cta__visual">
              <div className="captain-cta__compass animate-float">
                <Compass size={120} strokeWidth={0.8} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ CTA FINAL ══════════════════ */}
      <section className="section final-cta">
        <div className="container reveal" ref={addRevealRef}>
          <div className="final-cta__inner">
            <h2 className="final-cta__title">
              ¿Listo para navegar?
            </h2>
            <p className="final-cta__subtitle">
              Encuentra tu próxima aventura en el agua. Sin registro obligatorio.
            </p>
            <Link to="/explorar" className="btn btn--accent btn--lg">
              Explorar Travesías
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
