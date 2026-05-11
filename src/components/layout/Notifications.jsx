import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Bell, ShieldAlert, BookOpen, AlertCircle, Ship } from 'lucide-react'
import supabase from '../../lib/supabase'
import useAuthStore from '../../stores/authStore'

export default function Notifications() {
  const { profile, user } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)

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
    const notifs = []

    if (profile?.role === 'admin') {
      // Check pending trips
      const { count: pendingTrips } = await supabase
        .from('trips')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      if (pendingTrips > 0) {
        notifs.push({
          id: 'admin-trips',
          title: 'Travesías Pendientes',
          message: `Hay ${pendingTrips} travesía(s) esperando revisión.`,
          icon: <Ship size={16} />,
          link: '/admin/travesias',
          color: 'var(--color-accent-400)'
        })
      }

      // Check unverified users
      const { count: unverifiedUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'publisher')
        .eq('is_verified', false)

      if (unverifiedUsers > 0) {
        notifs.push({
          id: 'admin-users',
          title: 'Capitanes sin verificar',
          message: `Tienes ${unverifiedUsers} capitán(es) pendientes de verificación.`,
          icon: <ShieldAlert size={16} />,
          link: '/admin/usuarios',
          color: 'var(--color-coral-400)'
        })
      }
    } else if (profile?.role === 'publisher') {
      // Check pending bookings for this captain
      // We need to find trips owned by this captain, then bookings for those trips
      const { data: myTrips } = await supabase
        .from('trips')
        .select('id')
        .eq('captain_id', user.id)

      if (myTrips && myTrips.length > 0) {
        const tripIds = myTrips.map(t => t.id)
        const { count: pendingBookings } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .in('trip_id', tripIds)
          .eq('status', 'pending')

        if (pendingBookings > 0) {
          notifs.push({
            id: 'capt-bookings',
            title: 'Reservas Pendientes',
            message: `Tienes ${pendingBookings} reserva(s) esperando tu confirmación.`,
            icon: <BookOpen size={16} />,
            link: '/dashboard/reservas',
            color: 'var(--color-success)'
          })
        }
      }
    }

    setNotifications(notifs)
    setLoading(false)
  }

  const unreadCount = notifications.length

  if (!profile || (profile.role !== 'admin' && profile.role !== 'publisher')) {
    return null
  }

  return (
    <div className="notifications" ref={dropdownRef} style={{ position: 'relative' }}>
      <button 
        className="notifications__btn"
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) fetchNotifications()
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
        <div className="header__dropdown glass animate-fade-in" style={{ width: '300px', right: '-10px', top: '100%', padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '14px' }}>Notificaciones</strong>
            <button onClick={fetchNotifications} style={{ background: 'none', border: 'none', color: 'var(--color-accent-400)', fontSize: '12px', cursor: 'pointer' }}>Actualizar</button>
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
              notifications.map(notif => (
                <Link 
                  key={notif.id} 
                  to={notif.link} 
                  className="notification-item"
                  onClick={() => setIsOpen(false)}
                  style={{ 
                    display: 'flex', 
                    gap: '12px', 
                    padding: '16px', 
                    borderBottom: '1px solid var(--border-color)',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'background 0.2s ease'
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
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 600 }}>{notif.title}</h4>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{notif.message}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
