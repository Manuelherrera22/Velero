import { useState, useEffect } from 'react'
import { QrCode, Plus, Check, Copy, Loader, MapPin } from 'lucide-react'
import supabase from '../../lib/supabase'

export default function AffiliateQRs() {
  const [hotels, setHotels] = useState([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState(null)
  const [generatingFor, setGeneratingFor] = useState(null)

  useEffect(() => {
    fetchHotelsAndQRs()
  }, [])

  const fetchHotelsAndQRs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('hotels')
        .select('*, qr_codes(*)')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })

      setHotels(data || [])
    } catch (err) {
      console.error('Error fetching QRs:', err)
    } finally {
      setLoading(false)
    }
  }

  const generateQR = async (hotelId) => {
    setGeneratingFor(hotelId)
    try {
      const code = `A${hotelId.slice(0, 5).toUpperCase()}${Date.now().toString(36).toUpperCase()}`
      const { error } = await supabase.from('qr_codes').insert({
        hotel_id: hotelId,
        code,
        is_active: true,
      })
      if (error) {
        console.error('QR creation error:', error)
        alert('Hubo un error al generar el código QR. ' + (error.message || ''))
        return
      }
      await fetchHotelsAndQRs()
    } catch (err) {
      console.error(err)
      alert('Error de conexión al generar QR.')
    } finally {
      setGeneratingFor(null)
    }
  }

  const copyQRLink = (code) => {
    const url = `${window.location.origin}/qr?code=${code}`
    navigator.clipboard.writeText(url)
    setCopiedId(code)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (loading) {
    return <div className="protected-loading"><p>Cargando tus códigos QR...</p></div>
  }

  if (hotels.length === 0) {
    return (
      <div className="dashboard__empty">
        <div className="dashboard__empty-icon"><QrCode size={48} /></div>
        <h3>No se encontraron negocios asociados</h3>
        <p>Tu cuenta no tiene un negocio configurado. Contactá a soporte para solucionarlo.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="dashboard__header">
        <h1 className="dashboard__title">Mis Códigos QR</h1>
      </div>

      <div className="dashboard__grid">
        {hotels.map(hotel => (
          <div key={hotel.id} className="item-card glass">
            <div className="item-card__header" style={{ marginBottom: 'var(--space-4)' }}>
              <div>
                <h3 className="item-card__title">{hotel.name}</h3>
                <p className="item-card__subtitle">
                  <MapPin size={13} style={{ display: 'inline', verticalAlign: '-2px' }} /> {hotel.location || 'Sin ubicación'}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="coupon-card__code" style={{ fontSize: '11px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
                  Comisión: {hotel.commission_percent}%
                </span>
              </div>
            </div>

            {/* QR Codes list */}
            <div style={{ fontSize: 'var(--text-sm)' }}>
              <p style={{ fontWeight: 600, marginBottom: '12px', color: 'var(--text-secondary)' }}>
                QRs Generados ({hotel.qr_codes?.length || 0})
              </p>

              {hotel.qr_codes?.length === 0 ? (
                <p style={{ color: 'var(--text-tertiary)', fontSize: '12px', fontStyle: 'italic' }}>
                  No has generado ningún código QR todavía.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {hotel.qr_codes?.map(qr => (
                    <div key={qr.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <QrCode size={14} style={{ color: 'var(--color-accent-400)' }}/>
                          <span style={{ fontWeight: 600, letterSpacing: '1px' }}>{qr.code}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                          {qr.scan_count} escaneos totales
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn--ghost btn--sm" onClick={() => copyQRLink(qr.code)} style={{ padding: '6px 12px' }}>
                          {copiedId === qr.code ? <><Check size={14} /> Copiado</> : <><Copy size={14} /> Link</>}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button 
              className="btn btn--outline btn--sm" 
              onClick={() => generateQR(hotel.id)} 
              disabled={generatingFor === hotel.id}
              style={{ marginTop: 'var(--space-5)', width: '100%' }}
            >
              {generatingFor === hotel.id ? <Loader size={14} className="spin" /> : <><Plus size={14} /> Generar nuevo QR</>}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
