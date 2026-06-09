import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Anchor, Shield, CalendarCheck, Leaf, Star, 
  MapPin, Users, ArrowRight, Compass, Waves,
  Clock, ChevronRight, Sparkles, Quote
} from 'lucide-react'
import useTripStore from '../stores/tripStore'
import './Landing.css'

const HERO_IMAGES = [
  '/WhatsApp Image 2026-06-08 at 5.27.36 PM1.jpeg',
  '/WhatsApp Image 2026-06-08 at 5.27.36 PM2.jpeg',
  '/WhatsApp Image 2026-06-08 at 5.27.37 PM3.jpeg',
  '/WhatsApp Image 2026-06-08 at 5.27.37 PM4.jpeg',
  '/WhatsApp Image 2026-06-08 at 5.27.37 PM5.jpeg',
  '/WhatsApp Image 2026-06-08 at 5.27.38 PM6.jpeg'
]

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
  { name: 'Noelia', location: 'Experiencia mindfulness, Buenos Aires', text: 'Hola buen día\nMuy lindo todo\nFue una experiencia muy linda\nHermoso el día\nHermoso el viaje\nEl tiempo de paz y relax\nLas herramientas brindadas\nPara conectar con uno mismo\nFue una experiencia única\nGracias', rating: 5 },
]

const STEPS = [
  { num: '01', title: 'Explora', desc: 'Busca travesías por destino, fecha o tipo de experiencia.' },
  { num: '02', title: 'Reserva', desc: 'Elige tu fecha, selecciona extras y paga de forma segura.' },
  { num: '03', title: 'Navega', desc: 'Vive una experiencia única en el agua con capitanes expertos.' },
]

const FAQS = {
  generales: {
    title: 'Generales',
    items: [
      {
        question: '¿Qué es Kailu?',
        answer: <p>Kailu es una plataforma que conecta personas con experiencias vinculadas a la navegación, la naturaleza y el encuentro con otras personas. A través de Kailu puedes descubrir y reservar actividades organizadas por capitanes, anfitriones y organizadores independientes, además de experiencias creadas o coordinadas directamente por Kailu.</p>
      },
      {
        question: '¿Cuál es el objetivo de Kailu?',
        answer: <p>Kailu busca facilitar el acceso a experiencias auténticas, ayudando a los capitanes y organizadores a dar visibilidad a sus propuestas y permitiendo que más personas puedan descubrir, reservar y vivir actividades únicas de manera simple y segura.</p>
      },
      {
        question: '¿Quiénes pueden utilizar Kailu?',
        answer: (
          <>
            <p>En Kailu existen distintos tipos de usuarios dentro de la plataforma:</p>
            <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
              <li><strong>Participantes</strong>, que reservan experiencias;</li>
              <li><strong>Capitanes u Organizadores</strong>, que publican actividades;</li>
              <li>y <strong>Aliados Kailu</strong>, que ayudan a difundir propuestas y ganan comisiones.</li>
            </ul>
          </>
        )
      },
      {
        question: '¿Es necesario registrarme para reservar?',
        answer: (
          <>
            <p>No. No es necesario crear una cuenta en Kailu para realizar una reserva.</p>
            <p>Durante el proceso de contratación solicitaremos un correo electrónico y un número de teléfono para validar la reserva, enviar la confirmación correspondiente y poder contactarte en caso de ser necesario.</p>
          </>
        )
      },
      {
        question: '¿Puedo crear un usuario en Kailu?',
        answer: (
          <>
            <p>Sí. Los Capitanes u Organizadores y Aliados Kailu necesitarán crear un usuario para poder publicar experiencias, gestionar propuestas o participar de las funcionalidades específicas de la plataforma.</p>
            <p>Si deseas participar en actividades publicadas en Kailu, también podrás crear una cuenta para gestionar tus reservas y acceder a futuras funcionalidades.</p>
          </>
        )
      },
      {
        question: '¿Necesito experiencia previa para participar?',
        answer: <p>No. Muchas experiencias están pensadas para personas sin experiencia previa. En cada actividad encontrarás información específica sobre requisitos o experiencia recomendada.</p>
      },
      {
        question: '¿Cómo puedo contactar a Kailu?',
        answer: <p>Puedes escribirnos en cualquier momento a: <strong>soporte@kailu.travel</strong>. También podrás encontrar novedades y contenidos en nuestros canales oficiales.</p>
      }
    ]
  },
  participantes: {
    title: 'Para Participantes',
    items: [
      {
        question: '¿Cómo puedo reservar una experiencia?',
        answer: <p>Solo debes seleccionar la actividad que te interese, elegir la fecha disponible y seguir el proceso de reserva indicado en la plataforma.</p>
      },
      {
        question: '¿Cómo funcionan los pagos?',
        answer: (
          <>
            <p>Dependiendo de la experiencia, algunas reservas podrán abonarse completamente online y otras podrán requerir un anticipo para confirmar la plaza y el pago del saldo restante directamente al Capitán u Organizador.</p>
            <p>Las condiciones de pago se informarán antes de confirmar la reserva.</p>
          </>
        )
      },
      {
        question: '¿Qué incluye el precio de una experiencia?',
        answer: <p>Cada publicación detalla los servicios incluidos, horarios, duración y cualquier condición particular definida por el Capitán u Organizador.</p>
      },
      {
        question: '¿Puedo cancelar una reserva?',
        answer: <p>Sí. Las condiciones de cancelación y devolución pueden variar según la experiencia contratada. Te recomendamos revisar las condiciones particulares de cada actividad antes de reservar.</p>
      },
      {
        question: '¿Qué ocurre si una actividad se cancela por mal clima?',
        answer: <p>En casos de mal clima, razones de seguridad o fuerza mayor, las partes podrán acordar una reprogramación o, cuando el participante no pueda asistir en la nueva fecha propuesta, se realizará la devolución de los importes abonados.</p>
      },
      {
        question: '¿Cómo me comunico con el Capitán u Organizador?',
        answer: <p>Dependiendo de la modalidad disponible, Kailu podrá ofrecer herramientas de comunicación entre usuarios o actuar como intermediario para facilitar el contacto y la coordinación de la experiencia.</p>
      },
      {
        question: '¿Qué información debo proporcionar al reservar?',
        answer: <p>Para algunas actividades podremos solicitar datos como nombre, documento de identidad, información de contacto o datos relevantes para la seguridad y correcta organización.</p>
      }
    ]
  },
  capitanes: {
    title: 'Para Capitanes u Organizadores',
    items: [
      {
        question: '¿Cómo puedo publicar una experiencia en Kailu?',
        answer: <p>Debes registrarte en la plataforma y completar la información solicitada sobre la actividad, embarcación o experiencia que deseas ofrecer.</p>
      },
      {
        question: '¿Qué modalidades de pago puedo ofrecer?',
        answer: <p>Dependiendo del tipo de experiencia, podrás optar por: cobro total online, o reserva mediante anticipo online y saldo restante abonado directamente por el participante al Capitán u Organizador.</p>
      },
      {
        question: '¿Cuándo recibo el dinero de una reserva?',
        answer: (
          <>
            <p>Si el cobro lo realiza Kailu en su totalidad, recibes el importe dentro de las 48 hs posteriores a la concreción de la experiencia.</p>
            <p>Si la modalidad elegida es con anticipo, recibes el pago restante del participante al momento previo al inicio de la experiencia.</p>
          </>
        )
      },
      {
        question: '¿Qué ocurre si un participante cancela?',
        answer: <p>Las cancelaciones y posibles devoluciones se gestionarán según las condiciones particulares de cada experiencia y las políticas generales de Kailu.</p>
      },
      {
        question: '¿Puedo cancelar una actividad?',
        answer: (
          <>
            <p>Sí. En caso de condiciones climáticas adversas, razones de seguridad, fuerza mayor u otras situaciones, podrás cancelar o reprogramar la actividad.</p>
            <p>Kailu podrá revisar situaciones de cancelaciones reiteradas o injustificadas que afecten la experiencia de los participantes.</p>
          </>
        )
      },
      {
        question: '¿Qué información recibiré sobre los participantes?',
        answer: <p>Podrás acceder a la información necesaria para gestionar correctamente la experiencia, incluyendo datos de contacto e información relevante para la actividad.</p>
      },
      {
        question: '¿Kailu cobra comisión?',
        answer: (
          <>
            <p>Sí. Kailu cobra una comisión sobre las reservas realizadas a través de la plataforma, además de posibles gastos de gestión e impuestos aplicables.</p>
            <p>Actualmente, la comisión general para publicaciones estándar es del 20% sobre el valor de la experiencia.</p>
          </>
        )
      }
    ]
  }
}

export default function Landing() {
  const revealRefs = useRef([])
  const { featuredTrips, fetchFeaturedTrips } = useTripStore()
  const [openFaq, setOpenFaq] = useState(null)
  const [activeFaqCategory, setActiveFaqCategory] = useState('generales')
  const [currentBgIndex, setCurrentBgIndex] = useState(0)
  const [prevBgIndex, setPrevBgIndex] = useState(null)

  useEffect(() => {
    fetchFeaturedTrips()
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBgIndex((prev) => {
        setPrevBgIndex(prev)
        return (prev + 1) % HERO_IMAGES.length
      })
    }, 5000)
    return () => clearInterval(timer)
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

  useEffect(() => {
    if (window.location.hash) {
      setTimeout(() => {
        const id = window.location.hash.replace('#', '')
        const el = document.getElementById(id)
        if (el) el.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [window.location.hash])

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
        <div className="hero__bg" style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          {HERO_IMAGES.map((imgSrc, index) => (
            <div 
              key={imgSrc}
              className="hero__video"
              style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: '100%', 
                height: '100%', 
                backgroundImage: `url("${imgSrc}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: index === currentBgIndex ? 1 : (index === prevBgIndex ? 1 : 0), 
                transition: index === currentBgIndex ? 'opacity 1.5s ease-in-out' : 'none',
                zIndex: index === currentBgIndex ? 2 : (index === prevBgIndex ? 1 : 0),
                transform: index === currentBgIndex ? 'scale(1.05)' : 'scale(1.0)',
                animation: index === currentBgIndex ? 'panZoom 15s infinite alternate linear' : 'none'
              }}
            />
          ))}
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
            No es solo navegar. Es lo que pasa cuando te subís.
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

      {/* ══════════════════ DESTINOS DESTACADOS ══════════════════ */}
      <section className="section" id="destinos">
        <div className="container reveal" ref={addRevealRef}>
          <div className="section__header-row" style={{ alignItems: 'center', flexDirection: 'column', textAlign: 'center', marginBottom: 'var(--space-6)' }}>
            <p className="section__label">Descubre Nuevos Horizontes</p>
            <h2 className="section__title">Destinos Destacados</h2>
          </div>
          <div className="divider" style={{ margin: '0 auto var(--space-8)' }} />

          <div className="destinations-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
            {[
              {
                name: 'Buenos Aires',
                desc: 'Naturaleza, navegación y escapadas a pocos minutos de la ciudad;',
                img: '/Buenos aires.jpeg',
                link: '/explorar?search=Buenos Aires'
              },
              {
                name: 'Bariloche',
                desc: 'Lagos, montaña y naturaleza en estado puro;',
                img: '/Bariloche.jpeg',
                link: '/explorar?search=Bariloche'
              },
              {
                name: 'Uruguay',
                desc: 'Navegaciones entre costas históricas, naturaleza y pueblos de encanto',
                img: '/WhatsApp Image 2026-06-08 at 5.27.36 PM.jpeg',
                link: '/explorar?search=Uruguay'
              }
            ].map((dest, i) => (
              <Link key={i} to={dest.link} className="destination-card glass" style={{
                position: 'relative',
                height: '350px',
                borderRadius: 'var(--radius-xl)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: 'var(--space-5)',
                textDecoration: 'none',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                transition: 'all 0.3s ease',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.borderColor = 'rgba(11, 171, 195, 0.3)';
                e.currentTarget.querySelector('.destination-bg').style.transform = 'scale(1.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.querySelector('.destination-bg').style.transform = 'scale(1)';
              }}
              >
                <div className="destination-bg" style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: `url("${dest.img}")`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  transition: 'transform 0.5s ease',
                  zIndex: 0
                }} />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.4) 50%, rgba(15, 23, 42, 0.1) 100%)',
                  zIndex: 1
                }} />
                <div style={{ position: 'relative', zIndex: 2 }}>
                  <h3 style={{ fontSize: '22px', fontWeight: 700, color: 'white', marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>{dest.name}</h3>
                  <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.85)', marginBottom: '16px', lineHeight: '1.4', minHeight: '38px' }}>{dest.desc}</p>
                  <span className="btn btn--accent btn--sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    Ver Travesías <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ CATEGORÍAS / FORMAS DE VIVIR ══════════════════ */}
      <section className="section section--dark" id="formas-de-vivir">
        <div className="container reveal" ref={addRevealRef}>
          <div className="section__header-row" style={{ alignItems: 'center', flexDirection: 'column', textAlign: 'center', marginBottom: 'var(--space-6)' }}>
            <p className="section__label">Explora por Estilo</p>
            <h2 className="section__title">Distintas formas de vivir Kailu en el agua</h2>
          </div>
          <div className="divider" style={{ margin: '0 auto var(--space-8)' }} />

          <div className="categories-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
            {[
              { name: 'Navegaciones', desc: 'Salidas generales', link: '/explorar' },
              { name: 'Solos y Solas', desc: 'Encuentros mensuales', link: '/explorar?search=Solos y Solas' },
              { name: 'Mindfulness', desc: 'Bienestar y meditación', link: '/explorar?search=Mindfulness' },
              { name: 'Degustaciones', desc: 'Gastronomía a bordo', link: '/explorar?search=Degustaciones' },
              { name: 'Aprender', desc: 'Cursos y clínica náutica', link: '/explorar?search=Aprender' }
            ].map((cat, i) => (
              <Link key={i} to={cat.link} className="category-card glass" style={{
                padding: 'var(--space-5)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                textAlign: 'center',
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '160px',
                transition: 'all 0.25s ease',
                background: 'rgba(255, 255, 255, 0.01)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.background = 'rgba(11, 171, 195, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(11, 171, 195, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.01)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
              }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'rgba(11, 171, 195, 0.1)',
                  color: 'var(--color-accent-400)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 'var(--space-3)'
                }}>
                  <Compass size={20} />
                </div>
                <strong style={{ fontSize: '15px', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>{cat.name}</strong>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{cat.desc}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ CÓMO FUNCIONA ══════════════════ */}
      <section className="section" id="como-funciona">
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
      <section className="section section--dark" id="beneficios" ref={addRevealRef}>
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

      {/* ══════════════════ PREGUNTAS FRECUENTES ══════════════════ */}
      <section className="section" id="faq">
        <div className="container reveal" ref={addRevealRef}>
          <div className="section__header-row" style={{ alignItems: 'center', flexDirection: 'column', textAlign: 'center' }}>
            <p className="section__label">Aclaramos tus dudas</p>
            <h2 className="section__title">Preguntas Frecuentes</h2>
          </div>
          <div className="divider" style={{ margin: '0 auto var(--space-8)' }} />

          <div className="faq-tabs">
            {Object.entries(FAQS).map(([key, category]) => (
              <button 
                key={key}
                className={`faq-tab ${activeFaqCategory === key ? 'faq-tab--active' : ''}`}
                onClick={() => {
                  setActiveFaqCategory(key)
                  setOpenFaq(null)
                }}
              >
                {category.title}
              </button>
            ))}
          </div>

          <div className="faq-accordion stagger-children">
            {FAQS[activeFaqCategory].items.map((faq, i) => {
              const isOpen = openFaq === i
              return (
                <div key={i} className={`faq-item ${isOpen ? 'faq-item--open' : ''}`} onClick={() => setOpenFaq(isOpen ? null : i)}>
                  <div className="faq-item__header">
                    <h3 className="faq-item__question">{faq.question}</h3>
                    <div className="faq-item__icon">{isOpen ? '−' : '+'}</div>
                  </div>
                  <div className="faq-item__body" style={{ maxHeight: isOpen ? '1000px' : '0', overflow: 'hidden', transition: 'max-height 0.3s ease' }}>
                    <div className="faq-item__content">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              )
            })}
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
