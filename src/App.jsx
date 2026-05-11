import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import useAuthStore from './stores/authStore'
import Landing from './pages/Landing'
import Search from './pages/Search'
import TripDetail from './pages/TripDetail'
import Checkout from './pages/Checkout'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import MyTrips from './pages/MyTrips'
import AuthCallback from './pages/AuthCallback'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'
import AffiliateDashboard from './pages/Affiliate'
import QRLanding from './pages/QRLanding'
import Review from './pages/Review'
import Terms from './pages/Terms'
import Cookies from './pages/Cookies'
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
          <Route path="/registro" element={<Register />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/qr" element={<QRLanding />} />
          <Route path="/review/:bookingId" element={<Review />} />
          <Route path="/terminos" element={<Terms />} />
          <Route path="/cookies" element={<Cookies />} />

          {/* Protected routes */}
          <Route path="/perfil" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />

          <Route path="/mis-viajes" element={
            <ProtectedRoute>
              <MyTrips />
            </ProtectedRoute>
          } />

          {/* Captain dashboard */}
          <Route path="/dashboard/*" element={
            <ProtectedRoute requiredRole="publisher">
              <Dashboard />
            </ProtectedRoute>
          } />

          {/* Affiliate panel */}
          <Route path="/afiliado/*" element={
            <ProtectedRoute requiredRole="affiliate">
              <AffiliateDashboard />
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
