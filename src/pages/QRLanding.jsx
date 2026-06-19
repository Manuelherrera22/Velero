import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Compass, MapPin, Star, Users, Anchor, ArrowRight, Sailboat, Waves } from 'lucide-react'
import supabase from '../lib/supabase'
import { withRetry } from '../utils/retry'
import { useRefetchOnFocus } from '../hooks/useRefetchOnFocus'
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

  const refetchQR = useCallback(() => { if (code) fetchQRData() }, [code])
  useRefetchOnFocus(refetchQR)

  const fetchQRData = async () => {
    setLoading(true)
    try {
      // Get QR code details
      const qr = await withRetry(async () => {
        const { data: d, error: e } = await supabase
          .from('qr_codes')
          .select('*, hotel:hotels!hotel_id(*, navigation_zone:navigation_zones!navigation_zone_id(name))')
          .eq('code', code)
          .eq('is_active', true)
          .single()
        if (e) throw e
        return d
      }, { label: 'fetchQR', maxRetries: 2 }).catch(() => null)

      if (!qr) {
        setLoading(false)
        return
      }

      setQrData(qr)
      setHotel(qr.hotel)

      // Increment scan count atomically
      try {
        await supabase.rpc('increment_scan_count', { qr_id: qr.id })
      } catch {
        // Fallback: manual increment if RPC doesn't exist
        supabase.from('qr_codes').update({ scan_count: (qr.scan_count || 0) + 1 }).eq('id', qr.id)
      }

      // Fetch trips matching the QR filters
      let query = supabase
        .from('trips')
        .select(`*, captain:profiles!captain_id(full_name, is_verified)`)
        .in('status', ['published', 'unlisted'])
        .order('created_at', { ascending: false })

      // Filter by hotel's navigation zone (most important filter)
      if (qr.hotel?.navigation_zone_id) {
        query = query.eq('navigation_zone_id', qr.hotel.navigation_zone_id)
      }

      if (qr.trip_filters?.length > 0) {
        query = query.overlaps('tags', qr.trip_filters)
      }

      const tripsData = await withRetry(async () => {
        const { data: d, error: e } = await query
        if (e) throw e
        return d
      }, { label: 'fetchQRTrips', maxRetries: 2 }).catch(() => [])

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
                {(hotel.navigation_zone?.name || qrData?.zone) && <p className="qr-hotel-header__zone">Zona: {hotel.navigation_zone?.name || qrData.zone}</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container">
        <div className="qr-landing__intro">
          <h1 className="qr-landing__title">
            Descubre experiencias náuticas <span className="qr-landing__accent">exclusivas para vos</span>
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
                    {trip.metadata?.discount_percentage > 0 && (
                      <span style={{ 
                        fontSize: '0.7rem', 
                        background: 'var(--color-accent-500)', 
                        color: 'white', 
                        padding: '2px 6px', 
                        borderRadius: '4px', 
                        fontWeight: 700, 
                        marginRight: '6px' 
                      }}>
                        -{trip.metadata.discount_percentage}%
                      </span>
                    )}
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 'normal', marginRight: '4px' }}>Desde</span>
                    {(() => {
                      const isFullBoatOnly = !(trip.price_per_person > 0) && (trip.full_boat_price > 0 || trip.allow_full_boat);
                      const basePrice = isFullBoatOnly ? trip.full_boat_price : trip.price_per_person;
                      const label = isFullBoatOnly ? '/barco' : '/persona';
                      
                      if (trip.metadata?.discount_percentage > 0) {
                        return (
                          <>
                            <span style={{ textDecoration: 'line-through', color: 'var(--text-tertiary)', fontSize: '0.85rem', marginRight: '4px' }}>
                              {formatPrice(basePrice, trip.currency)}
                            </span>
                            {formatPrice(Math.round(basePrice * (1 - trip.metadata.discount_percentage / 100)), trip.currency)}
                            <span>{label}</span>
                          </>
                        );
                      }
                      return (
                        <>
                          {formatPrice(basePrice, trip.currency)}
                          <span>{label}</span>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}


      </div>
    </div>
  )
}
