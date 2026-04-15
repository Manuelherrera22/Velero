import { useState, useEffect } from 'react'
import { Building2, Plus, X, Save, Loader, MapPin, QrCode, Percent, Copy, Check } from 'lucide-react'
import supabase from '../../lib/supabase'

export default function ManageHotels() {
  const [hotels, setHotels] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  const [form, setForm] = useState({
    name: '', location: '', contact_email: '', contact_phone: '', commission_percent: 10,
  })

  useEffect(() => { fetchHotels() }, [])

  const fetchHotels = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('hotels')
      .select('*, qr_codes(*)')
      .order('created_at', { ascending: false })
    setHotels(data || [])
    setLoading(false)
  }

  const handleCreate = async () => {
    if (!form.name) return
    setSaving(true)
    await supabase.from('hotels').insert({
      name: form.name,
      location: form.location,
      contact_email: form.contact_email || null,
      contact_phone: form.contact_phone || null,
      commission_percent: parseFloat(form.commission_percent) || 10,
    })
    setSaving(false)
    setShowForm(false)
    setForm({ name: '', location: '', contact_email: '', contact_phone: '', commission_percent: 10 })
    fetchHotels()
  }

  const generateQR = async (hotelId) => {
    const code = `H${hotelId.slice(0, 6).toUpperCase()}${Date.now().toString(36).toUpperCase()}`
    await supabase.from('qr_codes').insert({
      hotel_id: hotelId,
      code,
      is_active: true,
    })
    fetchHotels()
  }

  const copyQRLink = (code) => {
    const url = `${window.location.origin}/qr?code=${code}`
    navigator.clipboard.writeText(url)
    setCopiedId(code)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const updateField = (f, v) => setForm(p => ({ ...p, [f]: v }))

  return (
    <div>
      <div className="dashboard__header">
        <h1 className="dashboard__title">Hoteles & QR</h1>
        {!showForm && (
          <button className="btn btn--accent btn--sm" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Nuevo Hotel
          </button>
        )}
      </div>

      {showForm && (
        <div className="item-card glass" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="item-card__header">
            <h3 className="item-card__title">Nuevo Hotel</h3>
            <button className="btn btn--ghost btn--sm" onClick={() => setShowForm(false)}><X size={14} /></button>
          </div>

          <div className="form-row">
            <div className="input-group">
              <label>Nombre *</label>
              <input className="input" placeholder="Ej: Hotel Faena" value={form.name} onChange={(e) => updateField('name', e.target.value)} />
            </div>
            <div className="input-group">
              <label>Ubicación</label>
              <input className="input" placeholder="Ej: Puerto Madero, CABA" value={form.location} onChange={(e) => updateField('location', e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="input-group">
              <label>Email de contacto</label>
              <input className="input" type="email" placeholder="hotel@ejemplo.com" value={form.contact_email} onChange={(e) => updateField('contact_email', e.target.value)} />
            </div>
            <div className="input-group">
              <label>Comisión (%)</label>
              <input className="input" type="number" min={0} max={100} value={form.commission_percent} onChange={(e) => updateField('commission_percent', e.target.value)} />
            </div>
          </div>

          <button className="btn btn--accent" onClick={handleCreate} disabled={saving} style={{ alignSelf: 'flex-end' }}>
            {saving ? <Loader size={16} className="spin" /> : <><Save size={16} /> Crear Hotel</>}
          </button>
        </div>
      )}

      {loading && <div className="protected-loading"><p>Cargando...</p></div>}

      {!loading && hotels.length === 0 && !showForm && (
        <div className="dashboard__empty">
          <div className="dashboard__empty-icon"><Building2 size={48} /></div>
          <h3>Sin hoteles</h3>
          <p>Registrá un hotel para generar códigos QR y trackear escaneos.</p>
          <button className="btn btn--accent" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Registrar hotel
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
                <Percent size={12} /> {hotel.commission_percent}%
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
                    <span className="coupon-card__code" style={{ fontSize: '11px' }}>{qr.code}</span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginLeft: '8px' }}>
                      {qr.scan_count} scans
                    </span>
                  </div>
                  <button className="btn btn--ghost btn--sm" onClick={() => copyQRLink(qr.code)} style={{ padding: '4px 8px' }}>
                    {copiedId === qr.code ? <><Check size={12} /> Copiado</> : <><Copy size={12} /> Link</>}
                  </button>
                </div>
              ))}
            </div>

            <button className="btn btn--outline btn--sm" onClick={() => generateQR(hotel.id)} style={{ marginTop: 'var(--space-3)' }}>
              <QrCode size={14} /> Generar nuevo QR
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
