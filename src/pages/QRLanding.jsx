import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Compass, MapPin, Star, Users, Anchor, ArrowRight, Sailboat, Waves } from 'lucide-react'
import supabase from '../lib/supabase'
import './QRLanding.css'

export default function QRLanding() {
  const [searchParams] = useSearchParams()
  const code = searchParams.get('code') || searchParams.get('c')
  
  const [qrData, setQrData] = useState(null)
  const [hotel, setHotel] = useState(null)
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (code) fetchQRData()
  }, [code])

  const fetchQRData = async () => {
    setLoading(true)
    try {
      // Get QR code details
      const { data: qr } = await supabase
        .from('qr_codes')
        .select('*, hotel:hotels!hotel_id(*)')
        .eq('code', code)
        .eq('is_active', true)
        .single()

      if (!qr) {
        setLoading(false)
        return
      }

      setQrData(qr)
      setHotel(qr.hotel)

      // Increment scan count
      await supabase.from('qr_codes').update({ scan_count: qr.scan_count + 1 }).eq('id', qr.id)

      // Fetch trips matching the QR filters
      let query = supabase
        .from('trips')
        .select(`*, captain:profiles!captain_id(full_name, is_verified)`)
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      if (qr.trip_filters?.length > 0) {
        query = query.overlaps('tags', qr.trip_filters)
      }

      const { data: tripsData } = await query
      setTrips(tripsData || [])
    } catch (err) {
      console.error('QR fetch error:', err)
    }
    setLoading(false)
  }

  const formatPrice = (p, c) => {
    if (c === 'EUR') return `€${p}`
    if (c === 'USD') return `US$${p}`
    return `$${p?.toLocaleString('es-AR')}`
  }

  if (!code) {
    return (
      <div className="qr-landing">
        <div className="container" style={{ textAlign: 'center', padding: 'var(--space-24) 0' }}>
          <Sailboat size={64} style={{ color: 'var(--color-accent-400)', marginBottom: 'var(--space-4)' }} />
          <h1>Kailu</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Escanea un código QR para ver travesías cerca de tu hotel.</p>
          <Link to="/explorar" className="btn btn--accent btn--lg" style={{ marginTop: 'var(--space-6)' }}>
            Explorar todas las travesías <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="protected-loading">
        <Waves size={32} className="spin" style={{ color: 'var(--color-accent-400)' }} />
        <p>Buscando travesías...</p>
      </div>
    )
  }

  return (
    <div className="qr-landing">
      {/* Aliado exclusive header */}
      {hotel && (
        <div className="qr-hotel-header glass">
          <div className="container">
            <div className="qr-hotel-header__inner">
              <Sailboat size={28} />
              <div>
                <p className="qr-hotel-header__label">Experiencias seleccionadas junto a</p>
                <h2 className="qr-hotel-header__name">{hotel.name}</h2>
                {qrData?.zone && <p className="qr-hotel-header__zone">Zona: {qrData.zone}</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container">
        <div className="qr-landing__intro">
          <h1 className="qr-landing__title">
            Descubre experiencias náuticas <span className="hero__title--accent">exclusivas para vos</span>
          </h1>
          <p className="qr-landing__subtitle">
            Travesías seleccionadas especialmente para huéspedes de {hotel?.name || 'nuestro aliado'}. Reserva fácil, sin registro.
          </p>
        </div>

        {trips.length === 0 ? (
          <div className="dashboard__empty" style={{ marginTop: 'var(--space-8)' }}>
            <div className="dashboard__empty-icon"><Compass size={48} /></div>
            <h3>Proximamente</h3>
            <p>Pronto habrán travesías disponibles en esta zona.</p>
            <Link to="/explorar" className="btn btn--accent">Ver todas las travesías</Link>
          </div>
        ) : (
          <div className="search-grid" style={{ marginTop: 'var(--space-8)' }}>
            {trips.map(trip => (
              <Link key={trip.id} to={`/travesia/${trip.id}?qr=${code}`} className="trip-card card">
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
                    {trip.tags?.[0] && <span className="card__tag">{trip.tags[0]}</span>}
                  </div>
                </div>
                <div className="card__body">
                  <div className="trip-card__meta">
                    <span className="trip-card__location"><MapPin size={14} /> {trip.location}</span>
                    <span><Users size={14} /> {trip.capacity} pers.</span>
                  </div>
                  <h3 className="card__title">{trip.title}</h3>
                  <p className="trip-card__captain">
                    <Anchor size={13} /> Capitán {trip.captain?.full_name || 'Verificado'}
                  </p>
                </div>
                <div className="card__footer">
                  <div className="card__rating">
                    <Star size={14} fill="currentColor" /> —
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
        )}

        <div style={{ textAlign: 'center', padding: 'var(--space-10) 0' }}>
          <Link to="/explorar" className="btn btn--ghost btn--lg">
            Ver todas las travesías <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  )
}
