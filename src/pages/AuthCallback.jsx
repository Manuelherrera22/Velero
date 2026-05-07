import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '../lib/supabase'
import { Loader } from 'lucide-react'

/**
 * Auth Callback — Handles magic link / OAuth redirect
 * Processes the hash fragment and redirects to the appropriate page
 */
export default function AuthCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('Verificando tu identidad...')

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
          const isRecovery = new URLSearchParams(window.location.search).get('type') === 'recovery'

          // Success — redirect
          setStatus('¡Listo! Redirigiendo...')
          setTimeout(() => {
            if (isRecovery) {
              navigate('/perfil?recover=true', { replace: true })
            } else {
              navigate('/mis-viajes', { replace: true })
            }
          }, 500)
          return
        }

        // No hash tokens — try getting existing session
        const { data: { session } } = await supabase.auth.getSession()

        if (session) {
          navigate('/mis-viajes', { replace: true })
        } else {
          navigate('/login', { replace: true })
        }
      } catch (err) {
        console.error('Auth callback exception:', err)
        navigate('/login', { replace: true })
      }
    }

    // Small delay to ensure the hash is available
    setTimeout(handleCallback, 100)
  }, [navigate])

  return (
    <div className="protected-loading">
      <Loader size={32} className="spin" />
      <p>{status}</p>
    </div>
  )
}
