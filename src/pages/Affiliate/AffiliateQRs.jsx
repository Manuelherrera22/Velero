import { useState, useEffect, useCallback, useRef } from 'react'
import { QrCode, Plus, Check, Copy, Loader, MapPin, Download, X } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import supabase from '../../lib/supabase'
import useAuthStore from '../../stores/authStore'
import { useRefetchOnFocus } from '../../hooks/useRefetchOnFocus'

export default function AffiliateQRs() {
  const [hotels, setHotels] = useState([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState(null)
  const [generatingFor, setGeneratingFor] = useState(null)
  const [qrHotelId, setQrHotelId] = useState(null)
  const [qrZoneName, setQrZoneName] = useState('')

  const creatingHotelRef = useRef(false)

  useEffect(() => {
    fetchHotelsAndQRs()
  }, [])

  const refetch = useCallback(() => { fetchHotelsAndQRs() }, [])
  useRefetchOnFocus(refetch)

  const fetchHotelsAndQRs = async () => {
    try {
      const user = useAuthStore.getState().user
      const profile = useAuthStore.getState().profile
      if (!user) return

      let { data } = await supabase
        .from('hotels')
        .select('*, qr_codes(*)')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .abortSignal(AbortSignal.timeout(6000))

      // Auto-create hotel for affiliate if none exists (once only)
      if ((!data || data.length === 0) && profile?.role === 'affiliate' && !creatingHotelRef.current) {
        creatingHotelRef.current = true
        const hotelName = profile.business_name || profile.full_name || 'Mi Negocio'
        const hotelLocation = profile.business_location || profile.location || ''
        
        const { data: newHotel, error: createErr } = await supabase
          .from('hotels')
          .insert({
            name: hotelName,
            location: hotelLocation,
            owner_id: user.id,
            commission_percent: 0,
            commission_type: 'pending',
            navigation_zone_id: profile.navigation_zone_id || null,
          })
          .select('*, qr_codes(*)')
          .single()

        if (!createErr && newHotel) {
          data = [newHotel]
        } else {
          console.error('Error auto-creating hotel:', createErr)
        }
      }

      setHotels(data || [])
    } catch (err) {
      console.error('Error fetching QRs:', err)
    } finally {
      setLoading(false)
    }
  }

  const submitQR = async (hotelId) => {
    if (!qrZoneName.trim()) return

    setGeneratingFor(hotelId)
    try {
      const code = `A${hotelId.slice(0, 5).toUpperCase()}${Date.now().toString(36).toUpperCase()}`
      const { error } = await supabase.from('qr_codes').insert({
        hotel_id: hotelId,
        code,
        zone: qrZoneName.trim(),
        is_active: true,
      })
      if (error) {
        console.error('QR creation error:', error)
        alert('Hubo un error al generar el código QR. ' + (error.message || ''))
        return
      }
      setQrHotelId(null)
      setQrZoneName('')
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

  const downloadQR = (code) => {
    const canvas = document.getElementById(`qr-canvas-${code}`)
    if (!canvas) return
    const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream")
    let downloadLink = document.createElement("a")
    downloadLink.href = pngUrl
    downloadLink.download = `kailu-qr-${code}.png`
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
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
                <span className="coupon-card__code" style={{ fontSize: '11px', background: hotel.commission_type === 'pending' ? 'rgba(156, 163, 175, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: hotel.commission_type === 'pending' ? '#9ca3af' : '#f59e0b', borderColor: hotel.commission_type === 'pending' ? 'rgba(156, 163, 175, 0.2)' : 'rgba(245, 158, 11, 0.2)' }}>
                  {hotel.commission_type === 'pending' 
                    ? 'Comisión: Pendiente de asignación' 
                    : `Comisión: ${hotel.commission_type === 'percentage' ? '' : '$'}${hotel.commission_percent}${hotel.commission_type === 'percentage' ? '%' : ''}`}
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
                    <div key={qr.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ flex: '1 1 auto', minWidth: '150px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <QrCode size={16} style={{ color: 'var(--color-accent-400)' }}/>
                          <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)' }}>{qr.zone || 'General'}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>
                          ID: {qr.code}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-primary-400)', marginTop: '4px', fontWeight: 500 }}>
                          {qr.scan_count} escaneos totales
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'none' }}>
                          <QRCodeCanvas 
                            id={`qr-canvas-${qr.code}`} 
                            value={`${window.location.origin}/qr?code=${qr.code}`} 
                            size={1024}
                            level={"H"}
                            includeMargin={true}
                            bgColor={"#ffffff"}
                            fgColor={"#0f172a"}
                            imageSettings={{
                              src: "/logo-azul.png",
                              height: 120,
                              width: 120,
                              excavate: true,
                            }}
                          />
                        </div>
                        <button className="btn btn--ghost btn--sm" onClick={() => downloadQR(qr.code)} style={{ padding: '6px 12px' }}>
                          <Download size={14} /> Descargar
                        </button>
                        <button className="btn btn--ghost btn--sm" onClick={() => copyQRLink(qr.code)} style={{ padding: '6px 12px' }}>
                          {copiedId === qr.code ? <><Check size={14} /> Copiado</> : <><Copy size={14} /> Link</>}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {qrHotelId === hotel.id ? (
              <div style={{ marginTop: 'var(--space-5)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input 
                  className="input" 
                  style={{ height: '36px', fontSize: '13px', padding: '4px 8px' }} 
                  placeholder="Ej: Recepción, Habitación 101" 
                  value={qrZoneName} 
                  onChange={(e) => setQrZoneName(e.target.value)} 
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      submitQR(hotel.id)
                    }
                  }}
                  autoFocus
                />
                <button className="btn btn--accent btn--sm" onClick={() => submitQR(hotel.id)} disabled={generatingFor === hotel.id} style={{ height: '36px', whiteSpace: 'nowrap', padding: '0 12px' }}>
                  {generatingFor === hotel.id ? <Loader size={14} className="spin" /> : 'Generar'}
                </button>
                <button className="btn btn--ghost btn--sm" onClick={() => { setQrHotelId(null); setQrZoneName('') }} style={{ height: '36px', padding: '0 8px' }}><X size={14} /></button>
              </div>
            ) : (
              <button 
                className="btn btn--outline btn--sm" 
                onClick={() => { setQrHotelId(hotel.id); setQrZoneName('') }} 
                disabled={generatingFor === hotel.id}
                style={{ marginTop: 'var(--space-5)', width: '100%' }}
              >
                <Plus size={14} /> Generar nuevo QR
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
