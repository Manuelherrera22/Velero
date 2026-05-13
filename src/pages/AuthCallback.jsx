import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '../lib/supabase'
import { Loader, CheckCircle } from 'lucide-react'

/**
 * Auth Callback — Handles magic link / OAuth redirect
 * Processes the hash fragment and redirects to the appropriate page
 */
export default function AuthCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('Verificando tu identidad...')
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // First, check if there's a hash fragment with tokens
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')

        if (accessToken && refreshToken) {
          // Set the session manually from hash fragment
          setStatus('Iniciando sesión...')
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (error) {
            console.error('Auth set session error:', error)
            setStatus('Error al verificar. Redirigiendo...')
            setTimeout(() => navigate('/login', { replace: true }), 1500)
            return
          }

          // Check if this is a password recovery link
          const isRecovery = new URLSearchParams(window.location.search).get('type') === 'recovery' || hashParams.get('type') === 'recovery'
          const isSignup = hashParams.get('type') === 'signup'

          if (isRecovery) {
            setStatus('Redirigiendo a tu perfil...')
            setTimeout(() => navigate('/perfil?recover=true', { replace: true }), 1000)
            return
          }

          if (isSignup) {
            // Email verification — show success message, then redirect to role-based panel
            setVerified(true)
            setStatus('¡Tu cuenta fue verificada exitosamente!')

            // Fetch user profile to determine role
            const { data: { user } } = await supabase.auth.getUser()
            let redirectTo = '/mis-viajes'

            if (user) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

              if (profile?.role === 'publisher') {
                redirectTo = '/dashboard'
              } else if (profile?.role === 'affiliate') {
                redirectTo = '/afiliado'
              } else if (profile?.role === 'admin') {
                redirectTo = '/admin'
              }
            }

            setTimeout(() => navigate(redirectTo, { replace: true }), 2500)
            return
          }

          // General sign-in
          setStatus('¡Listo! Redirigiendo...')
          setTimeout(() => navigate('/mis-viajes', { replace: true }), 1000)
          return
        }

        // No hash tokens — try getting existing session
        const { data: { session } } = await supabase.auth.getSession()

        if (session) {
          setStatus('¡Sesión activa! Redirigiendo...')
          setTimeout(() => navigate('/mis-viajes', { replace: true }), 1000)
        } else {
          setStatus('Redirigiendo a inicio de sesión...')
          setTimeout(() => navigate('/login', { replace: true }), 1000)
        }
      } catch (err) {
        console.error('Auth callback exception:', err)
        navigate('/login', { replace: true })
      }
    }

    // Small delay to ensure the hash is available
    setTimeout(handleCallback, 500)
  }, [navigate])

  return (
    <div className="protected-loading" style={{ flexDirection: 'column', gap: '16px', minHeight: '60vh' }}>
      {verified ? (
        <>
          <div style={{ 
            width: '72px', height: '72px', borderRadius: '50%', 
            background: 'rgba(16, 185, 129, 0.1)', border: '2px solid rgba(16, 185, 129, 0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#10B981', animation: 'fadeIn 0.5s ease-out'
          }}>
            <CheckCircle size={36} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            ¡Cuenta verificada!
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>{status}</p>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', margin: 0 }}>Redirigiendo a tu panel...</p>
        </>
      ) : (
        <>
          <Loader size={32} className="spin" />
          <p>{status}</p>
        </>
      )}
    </div>
  )
}
