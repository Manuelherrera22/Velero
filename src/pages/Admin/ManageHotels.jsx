import { useState, useEffect } from 'react'
import { Building2, Plus, X, Save, Loader, MapPin, QrCode, Percent, Copy, Check, DollarSign, Download } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import supabase from '../../lib/supabase'

export default function ManageHotels() {
  const [hotels, setHotels] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  const [affiliates, setAffiliates] = useState([])
  const [qrHotelId, setQrHotelId] = useState(null)
  const [qrZoneName, setQrZoneName] = useState('')
  const [form, setForm] = useState({
    name: '', location: '', contact_email: '', contact_phone: '', 
    commission_percent: 10, commission_type: 'percentage', owner_id: ''
  })

  useEffect(() => { 
    fetchHotels() 
    fetchAffiliates()
  }, [])

  const fetchAffiliates = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, business_name, business_location, bank_alias, bank_holder')
        .eq('role', 'affiliate')
      if (error) throw error
      setAffiliates(data || [])
    } catch (err) {
      console.error("Error fetching affiliates:", err)
    }
  }

  const fetchHotels = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('hotels')
        .select('*, qr_codes(*)')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setHotels(data || [])
    } catch (err) {
      console.error("Error fetching hotels:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!form.name) return
    setSaving(true)
    const { error } = await supabase.from('hotels').insert({
      name: form.name,
      location: form.location,
      contact_email: form.contact_email || null,
      contact_phone: form.contact_phone || null,
      commission_percent: parseFloat(form.commission_percent) || 10,
      commission_type: form.commission_type || 'percentage',
      owner_id: form.owner_id || null,
    })
    
    if (error) {
      console.error("Error inserting hotel:", error)
      alert("Hubo un error al crear el aliado: " + error.message)
    }

    setSaving(false)
    setShowForm(false)
    setForm({ name: '', location: '', contact_email: '', contact_phone: '', commission_percent: 10, commission_type: 'percentage', owner_id: '' })
    fetchHotels()
    fetchAffiliates()
  }

  const submitQR = async (hotelId) => {
    if (!qrZoneName.trim()) return
    const hotelIdStr = String(hotelId)
    const code = `H${hotelIdStr.slice(0, 6).toUpperCase()}${Date.now().toString(36).toUpperCase()}`
    const { error } = await supabase.from('qr_codes').insert({
      hotel_id: hotelId,
      code,
      zone: qrZoneName.trim(),
      is_active: true,
    })
    
    if (error) {
      console.error("Error generating QR:", error)
      alert("Hubo un error al generar el QR: " + error.message)
    }
    
    setQrHotelId(null)
    setQrZoneName('')
    fetchHotels()
  }

  const copyQRLink = (code) => {
    const url = `${window.location.origin}/qr?code=${code}`
    navigator.clipboard.writeText(url)
    setCopiedId(code)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const downloadQR = (code) => {
    const canvas = document.getElementById(`qr-canvas-${code}`)
    if (canvas) {
      const url = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `Kailu-QR-${code}.png`
      link.href = url
      link.click()
    }
  }

  const updateField = (f, v) => setForm(p => ({ ...p, [f]: v }))

  const pendingAffiliates = affiliates.filter(aff => !hotels.some(h => h.owner_id === aff.id))

  return (
    <div className="dash-page">
      <div className="dash-pane">
        <div className="dash-pane__header">
          <div className="dash-pane__header-left">
            <h1 className="dash-pane__title">Aliados & QR</h1>
          </div>
          {!showForm && (
            <button className="btn btn--accent btn--sm" onClick={() => setShowForm(true)}>
              <Plus size={16} /> Nuevo Aliado
            </button>
          )}
        </div>

        {/* Pending Ally Registration Queue */}
        {!loading && pendingAffiliates.length > 0 && (
          <div className="item-card glass" style={{ marginBottom: 'var(--space-6)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
            <div className="item-card__header" style={{ marginBottom: 'var(--space-4)' }}>
              <h3 className="item-card__title" style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={18} /> Solicitudes de Registro Pendientes ({pendingAffiliates.length})
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pendingAffiliates.map(aff => (
                <div key={aff.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <strong style={{ fontSize: '15px', color: 'var(--text-primary)' }}>{aff.business_name || 'Negocio sin nombre'}</strong>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      <span><b>Responsable:</b> {aff.full_name}</span>
                      <span><b>Email:</b> {aff.email}</span>
                      {aff.business_location && <span><b>Ubicación:</b> {aff.business_location}</span>}
                      {aff.bank_alias && <span><b>Alias/CBU:</b> {aff.bank_alias} ({aff.bank_holder})</span>}
                    </div>
                  </div>
                  <button 
                    className="btn btn--accent btn--sm"
                    onClick={() => {
                      setForm({
                        name: aff.business_name || '',
                        location: aff.business_location || '',
                        contact_email: aff.email || '',
                        contact_phone: '',
                        commission_percent: 10,
                        commission_type: 'percentage',
                        owner_id: aff.id
                      })
                      setShowForm(true)
                    }}
                  >
                    Configurar y Aprobar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      {showForm && (
        <div className="item-card glass" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="item-card__header">
            <h3 className="item-card__title">Nuevo Aliado</h3>
            <button className="btn btn--ghost btn--sm" onClick={() => setShowForm(false)}><X size={14} /></button>
          </div>

          <div className="form-row">
            <div className="input-group">
              <label>Nombre del aliado *</label>
              <input className="input" placeholder="Ej: Hotel Faena, Agencia Norte" value={form.name} onChange={(e) => updateField('name', e.target.value)} />
            </div>
            <div className="input-group">
              <label>Ubicación</label>
              <input className="input" placeholder="Ej: Puerto Madero, CABA" value={form.location} onChange={(e) => updateField('location', e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="input-group">
              <label>Email de contacto</label>
              <input className="input" type="email" placeholder="aliado@ejemplo.com" value={form.contact_email} onChange={(e) => updateField('contact_email', e.target.value)} />
            </div>
            <div className="input-group">
              <label>Comisión</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select 
                  className="input" 
                  style={{ width: '80px' }} 
                  value={form.commission_type} 
                  onChange={(e) => updateField('commission_type', e.target.value)}
                >
                  <option value="percentage">%</option>
                  <option value="fixed">$</option>
                </select>
                <input 
                  className="input" 
                  type="number" 
                  min={0} 
                  max={form.commission_type === 'percentage' ? 100 : undefined}
                  placeholder={form.commission_type === 'percentage' ? '10' : '5000'}
                  value={form.commission_percent} 
                  onChange={(e) => updateField('commission_percent', e.target.value)} 
                  style={{ flex: 1 }}
                />
              </div>
            </div>
          </div>

          <div className="form-row" style={{ marginBottom: '16px' }}>
            <div className="input-group" style={{ width: '100%' }}>
              <label>Usuario Aliado (vincular al usuario registrado para que vea sus métricas)</label>
              <select className="input" value={form.owner_id} onChange={(e) => updateField('owner_id', e.target.value)}>
                <option value="">-- Seleccionar usuario registrado --</option>
                {affiliates.map(aff => (
                  <option key={aff.id} value={aff.id}>
                    {aff.full_name} ({aff.email})
                  </option>
                ))}
              </select>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '6px', lineHeight: '1.4' }}>
                <strong>Nota:</strong> Si no vinculas un usuario, el Aliado no podrá entrar a la plataforma, pero los escaneos de sus QRs se seguirán contabilizando a su nombre y podrás liquidar su comisión desde el panel de liquidaciones.
              </p>
            </div>
          </div>

          <button className="btn btn--accent" onClick={handleCreate} disabled={saving} style={{ alignSelf: 'flex-end' }}>
            {saving ? <Loader size={16} className="spin" /> : <><Save size={16} /> Crear Aliado</>}
          </button>
        </div>
      )}

      {loading && <div className="protected-loading"><p>Cargando...</p></div>}

      {!loading && hotels.length === 0 && !showForm && (
        <div className="dashboard__empty">
          <div className="dashboard__empty-icon"><Building2 size={48} /></div>
          <h3>Sin aliados registrados</h3>
          <p>Registrá un aliado para generar códigos QR y trackear escaneos.</p>
          <button className="btn btn--accent" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Registrar aliado
          </button>
        </div>
      )}

      <div className="dashboard__grid">
        {hotels.map(hotel => (
          <div key={hotel.id} className="item-card glass">
            <div className="item-card__header">
              <div>
                <h3 className="item-card__title">{hotel.name}</h3>
                <p className="item-card__subtitle">
                  <MapPin size={13} style={{ display: 'inline', verticalAlign: '-2px' }} /> {hotel.location || 'Sin ubicación'}
                </p>
              </div>
              <span className="coupon-card__code" style={{ fontSize: '11px' }}>
                {hotel.commission_type === 'percentage' ? <Percent size={12} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '2px' }} /> : '$'}{hotel.commission_percent}{hotel.commission_type === 'percentage' ? '%' : ''}
              </span>
            </div>

            {/* QR Codes */}
            <div style={{ fontSize: 'var(--text-sm)' }}>
              <p style={{ fontWeight: 600, marginBottom: '8px' }}>
                <QrCode size={14} style={{ verticalAlign: '-2px' }} /> Códigos QR ({hotel.qr_codes?.length || 0})
              </p>

              {hotel.qr_codes?.map(qr => (
                <div key={qr.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '4px', fontSize: '14px' }}>{qr.zone || 'General'}</span>
                    <span className="coupon-card__code" style={{ fontSize: '11px' }}>{qr.code}</span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginLeft: '8px' }}>
                      {qr.scan_count} scans
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <div style={{ display: 'none' }}>
                      <QRCodeCanvas 
                        id={`qr-canvas-${qr.code}`} 
                        value={`${window.location.origin}/qr?code=${qr.code}`} 
                        size={500} 
                        level={"H"} 
                        includeMargin={true}
                        fgColor="#0f172a"
                        imageSettings={{
                          src: "/logo-kailu.jpg",
                          height: 120,
                          width: 120,
                          excavate: true,
                        }}
                      />
                    </div>
                    <button className="btn btn--ghost btn--sm" onClick={() => downloadQR(qr.code)} style={{ padding: '4px 8px' }} title="Descargar QR">
                      <Download size={12} />
                    </button>
                    <button className="btn btn--ghost btn--sm" onClick={() => copyQRLink(qr.code)} style={{ padding: '4px 8px' }} title="Copiar Enlace">
                      {copiedId === qr.code ? <><Check size={12} /> Copiado</> : <><Copy size={12} /> Link</>}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {qrHotelId === hotel.id ? (
              <div style={{ marginTop: 'var(--space-3)', display: 'flex', gap: '8px', alignItems: 'center' }}>
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
                <button className="btn btn--accent btn--sm" onClick={() => submitQR(hotel.id)} style={{ height: '36px', whiteSpace: 'nowrap', padding: '0 12px' }}>Generar</button>
                <button className="btn btn--ghost btn--sm" onClick={() => { setQrHotelId(null); setQrZoneName('') }} style={{ height: '36px', padding: '0 8px' }}><X size={14} /></button>
              </div>
            ) : (
              <button className="btn btn--outline btn--sm" onClick={() => { setQrHotelId(hotel.id); setQrZoneName('') }} style={{ marginTop: 'var(--space-3)', width: '100%' }}>
                <QrCode size={14} /> Generar nuevo QR
              </button>
            )}
          </div>
        ))}
      </div>
      </div>
    </div>
  )
}

