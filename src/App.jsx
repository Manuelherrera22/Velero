import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import useAuthStore from './stores/authStore'
import Landing from './pages/Landing'
import Search from './pages/Search'
import TripDetail from './pages/TripDetail'
import Checkout from './pages/Checkout'
import Login from './pages/Login'
import Profile from './pages/Profile'
import AuthCallback from './pages/AuthCallback'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'
import QRLanding from './pages/QRLanding'
import Review from './pages/Review'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import ProtectedRoute from './components/layout/ProtectedRoute'

function App() {
  const initialize = useAuthStore((s) => s.initialize)

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/explorar" element={<Search />} />
          <Route path="/travesia/:id" element={<TripDetail />} />
          <Route path="/checkout/:id" element={<Checkout />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/qr" element={<QRLanding />} />
          <Route path="/review/:bookingId" element={<Review />} />

          {/* Protected routes */}
          <Route path="/perfil" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />

          {/* Captain dashboard */}
          <Route path="/dashboard/*" element={
            <ProtectedRoute requiredRole="publisher">
              <Dashboard />
            </ProtectedRoute>
          } />

          {/* Admin panel */}
          <Route path="/admin/*" element={
            <ProtectedRoute requiredRole="admin">
              <Admin />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
