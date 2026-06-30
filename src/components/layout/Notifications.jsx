import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Bell, ShieldAlert, BookOpen, AlertCircle, Ship, CalendarCheck, Check } from 'lucide-react'
import supabase from '../../lib/supabase'
import useAuthStore from '../../stores/authStore'

/**
 * Notifications dropdown.
 * 
 * Notifications are computed from live DB counts (pending bookings, unverified users, etc.)
 * A notification is considered "read" when the user has seen the same count before.
 * If the count changes (e.g., new booking arrives), the notification becomes "unread" again.
 * 
 * Read state is stored in localStorage keyed by notification ID + count.
 */
export default function Notifications() {
  const profile = useAuthStore((s) => s.profile)
  const user = useAuthStore((s) => s.user)
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)

  // Read state helpers
  const getReadKey = (notifId, count) => `notif_read_${user?.id}_${notifId}_${count}`
  
  const isRead = (notifId, count) => {
    try { return localStorage.getItem(getReadKey(notifId, count)) === '1' } catch { return false }
  }

  const markAsRead = useCallback((notifId, count) => {
    try { localStorage.setItem(getReadKey(notifId, count), '1') } catch {}
  }, [user?.id])

  const markAllAsRead = useCallback(() => {
    notifications.forEach(n => markAsRead(n.id, n.count))
    // Force re-render to update badge
    setNotifications([...notifications])
  }, [notifications, markAsRead])

  useEffect(() => {
    if (profile) {
      fetchNotifications()
    }
  }, [profile])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      await Promise.race([
        _fetchNotificationsInner(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 6000))
      ])
    } catch {
      // Timeout or error — just show no notifications
    }
    setLoading(false)
  }

  const _fetchNotificationsInner = async () => {
    const notifs = []

    if (profile?.role === 'admin') {
      const { count: pendingTrips } = await supabase
        .from('trips')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .abortSignal(AbortSignal.timeout(5000))

      if (pendingTrips > 0) {
        notifs.push({
          id: 'admin-trips',
          title: 'Travesías Pendientes',
          message: `Hay ${pendingTrips} travesía(s) esperando revisión.`,
          icon: <Ship size={16} />,
          link: '/admin/revisar',
          color: 'var(--color-accent-400)',
          count: pendingTrips
        })
      }

      const { count: unverifiedUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'publisher')
        .eq('is_verified', false)
        .abortSignal(AbortSignal.timeout(5000))

      if (unverifiedUsers > 0) {
        notifs.push({
          id: 'admin-users',
          title: 'Capitanes sin verificar',
          message: `Tienes ${unverifiedUsers} capitán(es) pendientes de verificación.`,
          icon: <ShieldAlert size={16} />,
          link: '/admin/usuarios',
          color: 'var(--color-coral-400)',
          count: unverifiedUsers
        })
      }
    } else if (profile?.role === 'publisher') {
      const { data: myTrips } = await supabase
        .from('trips')
        .select('id')
        .eq('captain_id', user.id)
        .abortSignal(AbortSignal.timeout(5000))

      if (myTrips && myTrips.length > 0) {
        const tripIds = myTrips.map(t => t.id)
        
        const { count: pendingBookings } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .in('trip_id', tripIds)
          .eq('status', 'pending')
          .abortSignal(AbortSignal.timeout(5000))

        if (pendingBookings > 0) {
          notifs.push({
            id: 'capt-bookings',
            title: 'Reservas Pendientes',
            message: `Tienes ${pendingBookings} reserva(s) esperando tu confirmación.`,
            icon: <BookOpen size={16} />,
            link: '/dashboard/reservas',
            color: 'var(--color-success)',
            count: pendingBookings
          })
        }

        const { count: confirmedBookings } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .in('trip_id', tripIds)
          .in('status', ['confirmed', 'completed'])
          .abortSignal(AbortSignal.timeout(5000))

        if (confirmedBookings > 0) {
          notifs.push({
            id: 'capt-confirmed-bookings',
            title: 'Reservas Confirmadas',
            message: `Tienes ${confirmedBookings} reserva(s) confirmada(s) / completada(s).`,
            icon: <CalendarCheck size={16} />,
            link: '/dashboard/reservas',
            color: 'var(--color-accent-400)',
            count: confirmedBookings
          })
        }
      }
    }

    setNotifications(notifs)
  }

  // Only count notifications that haven't been seen with this exact count
  const unreadCount = notifications.filter(n => !isRead(n.id, n.count)).length

  if (!profile || (profile.role !== 'admin' && profile.role !== 'publisher')) {
    return null
  }

  return (
    <div className="notifications" ref={dropdownRef} style={{ position: 'relative' }}>
      <button 
        className="notifications__btn"
        onClick={() => {
          const opening = !isOpen
          setIsOpen(opening)
          if (opening) {
            fetchNotifications()
          } else {
            // When closing the dropdown, mark all current notifications as read
            markAllAsRead()
          }
        }}
        aria-label="Notificaciones"
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          padding: '8px',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          transition: 'all 0.2s ease'
        }}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '4px',
            right: '6px',
            width: '8px',
            height: '8px',
            backgroundColor: 'var(--color-error)',
            borderRadius: '50%',
            border: '2px solid var(--bg-primary)'
          }}></span>
        )}
      </button>

      {isOpen && (
        <div className="header__dropdown glass animate-fade-in notifications__dropdown" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '14px' }}>Notificaciones</strong>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead} 
                  title="Marcar todas como leídas"
                  style={{ background: 'none', border: 'none', color: 'var(--color-success)', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Check size={14} /> Leídas
                </button>
              )}
              <button onClick={fetchNotifications} style={{ background: 'none', border: 'none', color: 'var(--color-accent-400)', fontSize: '12px', cursor: 'pointer' }}>Actualizar</button>
            </div>
          </div>
          
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>
                Cargando...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-tertiary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={24} style={{ opacity: 0.5 }} />
                <p style={{ fontSize: '13px', margin: 0 }}>No hay notificaciones nuevas</p>
              </div>
            ) : (
              notifications.map(notif => {
                const read = isRead(notif.id, notif.count)
                return (
                  <Link 
                    key={notif.id} 
                    to={notif.link} 
                    className="notification-item"
                    onClick={() => {
                      markAsRead(notif.id, notif.count)
                      setIsOpen(false)
                    }}
                    style={{ 
                      display: 'flex', 
                      gap: '12px', 
                      padding: '16px', 
                      borderBottom: '1px solid var(--border-color)',
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'background 0.2s ease, opacity 0.2s ease',
                      opacity: read ? 0.5 : 1,
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '50%', 
                      background: `${notif.color}20`, 
                      color: notif.color,
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {notif.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 600 }}>{notif.title}</h4>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{notif.message}</p>
                    </div>
                    {read && (
                      <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-tertiary)' }}>
                        <Check size={14} />
                      </div>
                    )}
                  </Link>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
