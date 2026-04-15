import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '../lib/supabase'
import { Loader } from 'lucide-react'

/**
 * Auth Callback — Handles magic link redirect from Supabase
 * This page processes the auth token from the URL and redirects to home
 */
export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase auto-processes the hash fragment
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Auth callback error:', error)
          navigate('/login', { replace: true })
          return
        }

        if (session) {
          // Successfully authenticated
          navigate('/', { replace: true })
        } else {
          navigate('/login', { replace: true })
        }
      } catch (err) {
        console.error('Auth callback exception:', err)
        navigate('/login', { replace: true })
      }
    }

    handleCallback()
  }, [navigate])

  return (
    <div className="protected-loading">
      <Loader size={32} className="spin" />
      <p>Verificando tu identidad...</p>
    </div>
  )
}
