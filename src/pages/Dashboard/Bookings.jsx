import { useEffect, useCallback } from 'react'
import { CalendarCheck, MapPin, User, Phone, Ship, CheckCircle2 } from 'lucide-react'
import useBookingStore from '../../stores/bookingStore'
import useAuthStore from '../../stores/authStore'
import { useRefetchOnFocus } from '../../hooks/useRefetchOnFocus'

export default function Bookings() {
  const { bookings, isLoadingBookings: loading, fetchCaptainBookings } = useBookingStore()
  const { profile } = useAuthStore()

  useEffect(() => {
    fetchCaptainBookings()
  }, [])

  const refetch = useCallback(() => { fetchCaptainBookings() }, [fetchCaptainBookings])
  useRefetchOnFocus(refetch)

  const statusLabels = {
    pending: 'Pendiente',
    confirmed: 'Confirmada',
    cancelled: 'Cancelada',
    completed: 'Completada',
    refunded: 'Reembolsada',
  }

  // Captain's commission rate (default 20%)
  const commissionRate = profile?.captain_commission_rate ?? 20

  const formatMoney = (val) => `$${Number(val || 0).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

  /**
   * Calculate captain-facing amounts for a booking.
   * The captain should NEVER see the 3% service fee — that's the client's charge.
   * 
   * Pago Total: show experience value, Kailu commission, and net to captain.
   * Anticipo: show experience value, advance paid online, and remaining balance to collect.
   */
  const getCaptainAmounts = (booking) => {
    // Experience value = subtotal - discount (without 3% fee, without addons counted separately)
    const experienceValue = (booking.subtotal || 0) - (booking.discount || 0)
    
    // Kailu commission
    const commissionAmount = experienceValue * (commissionRate / 100)
    
    // Net to captain (what they actually receive/collect)
    const captainNet = experienceValue - commissionAmount

    // Check if advance payment
    const isAdvance = booking.trip?.requires_full_payment === false
    const depositPercent = isAdvance
      ? ((booking.trip?.deposit_percentage !== undefined && booking.trip?.deposit_percentage !== null)
        ? parseFloat(booking.trip.deposit_percentage) / 100
        : 0.20)
      : 1.0

    // What was paid online (advance portion of the experience, not including fee)
    const advancePaid = experienceValue * depositPercent

    // Remaining balance for captain to collect directly
    const remainingBalance = isAdvance ? (captainNet - 0) : 0
    // Actually: the captain collects the remaining from the client directly
    // Remaining = total experience - advance paid online
    const remainingToCollect = isAdvance ? (experienceValue - advancePaid) : 0

    return {
      experienceValue,
      commissionAmount,
      captainNet,
      isAdvance,
      advancePaid,
      remainingToCollect,
    }
  }

  return (
    <div>
      <div className="dashboard__header">
        <h1 className="dashboard__title">Reservas</h1>
      </div>

      {loading && <div className="protected-loading"><p>Cargando...</p></div>}

      {!loading && bookings.length === 0 && (
        <div className="dashboard__empty">
          <div className="dashboard__empty-icon"><CalendarCheck size={48} /></div>
          <h3>Sin reservas aún</h3>
          <p>Cuando los viajeros reserven tus travesías, las verás aquí.</p>
        </div>
      )}

      <div className="dashboard__grid">
        {bookings.map(booking => {
          const amounts = getCaptainAmounts(booking)
          
          return (
            <div key={booking.id} className="item-card glass">
              <div className="item-card__header">
                <div>
                  <h3 className="item-card__title">{booking.trip?.title || 'Travesía'}</h3>
                  <p className="item-card__subtitle">
                    <MapPin size={13} style={{ display: 'inline', verticalAlign: '-2px' }} /> {booking.trip?.location}
                    {booking.trip?.boat?.name && (
                      <span style={{ marginLeft: '12px' }}>
                        <Ship size={13} style={{ display: 'inline', verticalAlign: '-2px' }} /> {booking.trip.boat.name}
                      </span>
                    )}
                  </p>
                </div>
                {booking.status === 'confirmed' ? (
                  <span className="status-badge status-badge--success" style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'transparent', color: 'var(--color-success-500)', border: 'none', padding: 0 }}>
                    <CheckCircle2 size={24} />
                  </span>
                ) : (
                  <span className={`status-badge status-badge--${booking.status}`}>
                    {statusLabels[booking.status] || booking.status}
                  </span>
                )}
              </div>

              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {booking.trip_date && (
                  <span>
                    <CalendarCheck size={13} style={{ verticalAlign: '-2px' }} />{' '}
                    {new Date(booking.trip_date.date + 'T12:00:00').toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })} · {booking.trip_date.start_time}hs
                  </span>
                )}

                {/* Guest or user info */}
                {booking.user ? (
                  <>
                    <span><User size={13} style={{ verticalAlign: '-2px' }} /> {booking.user.full_name || 'Sin nombre'}</span>
                    {booking.user.phone && (
                      <span>
                        <Phone size={13} style={{ verticalAlign: '-2px' }} />{' '}
                        <a href={`https://wa.me/${booking.user.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary-500)', textDecoration: 'none' }}>
                          {booking.user.phone}
                        </a>
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    {booking.guest_name && <span><User size={13} style={{ verticalAlign: '-2px' }} /> {booking.guest_name} (invitado)</span>}
                    {booking.guest_phone && (
                      <span>
                        <Phone size={13} style={{ verticalAlign: '-2px' }} />{' '}
                        <a href={`https://wa.me/${booking.guest_phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary-500)', textDecoration: 'none' }}>
                          {booking.guest_phone}
                        </a>
                      </span>
                    )}
                  </>
                )}
              </div>

              {/* Passengers / mode */}
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {booking.metadata?.bookingMode === 'private' 
                  ? `Velero Privado (hasta ${booking.metadata?.capacity || booking.quantity})` 
                  : `${booking.quantity} persona${booking.quantity > 1 ? 's' : ''}`}
              </div>

              {/* Passenger details (names + documents) */}
              {booking.metadata?.passengers?.length > 0 && (
                <div style={{ 
                  marginTop: '8px', 
                  padding: '8px 12px', 
                  backgroundColor: 'rgba(148, 163, 184, 0.06)', 
                  borderRadius: '8px', 
                  fontSize: 'var(--text-xs)',
                  borderLeft: '3px solid var(--color-primary-500)'
                }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', fontSize: 'var(--text-sm)' }}>
                    Pasajeros
                  </div>
                  {booking.metadata.passengers.map((p, i) => (
                    <div key={i} style={{ 
                      display: 'flex', justifyContent: 'space-between', 
                      padding: '3px 0',
                      borderBottom: i < booking.metadata.passengers.length - 1 ? '1px solid rgba(148, 163, 184, 0.1)' : 'none'
                    }}>
                      <span style={{ color: 'var(--text-primary)' }}>{p.name || `Pasajero ${i + 1}`}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {p.id_type === 'passport' ? 'Pasaporte' : 'DNI'}: {p.id_number || '—'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Captain financial breakdown */}
              <div style={{ 
                marginTop: '8px', 
                padding: '10px 12px', 
                backgroundColor: 'rgba(38, 198, 198, 0.06)', 
                borderRadius: '8px', 
                fontSize: 'var(--text-sm)',
                borderLeft: '3px solid var(--color-accent-400)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>Valor experiencia</span>
                  <span style={{ color: 'var(--text-primary)' }}>{formatMoney(amounts.experienceValue)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-coral-400)', marginTop: '2px' }}>
                  <span>Comisión Kailu ({commissionRate}%)</span>
                  <span>-{formatMoney(amounts.commissionAmount)}</span>
                </div>

                {amounts.isAdvance && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    <span>Anticipo online</span>
                    <span>{formatMoney(amounts.advancePaid)}</span>
                  </div>
                )}

                <div style={{ 
                  display: 'flex', justifyContent: 'space-between', 
                  marginTop: '6px', paddingTop: '6px', 
                  borderTop: '1px solid rgba(148, 163, 184, 0.15)',
                  fontWeight: 700, fontFamily: 'var(--font-heading)'
                }}>
                  <span style={{ color: 'var(--text-primary)' }}>
                    {amounts.isAdvance ? 'Saldo a cobrar' : 'Cobrarás'}
                  </span>
                  <span style={{ color: 'var(--color-accent-400)' }}>
                    {amounts.isAdvance 
                      ? formatMoney(amounts.remainingToCollect) 
                      : formatMoney(amounts.captainNet)}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
