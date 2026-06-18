import { useState, useEffect, useCallback } from 'react'
import { Tag, Plus, X, Save, Loader, Calendar, Percent, DollarSign } from 'lucide-react'
import supabase from '../../lib/supabase'
import useAuthStore from '../../stores/authStore'
import { useRefetchOnFocus } from '../../hooks/useRefetchOnFocus'

export default function ManageCoupons() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showHistoric, setShowHistoric] = useState(false)
  const [form, setForm] = useState({
    code: '', type: 'percentage', value: '', valid_from: '', valid_until: '', max_uses: 100,
  })

  useEffect(() => { fetchCoupons()
    const t = setTimeout(() => setLoading(false), 8000); return () => clearTimeout(t)
  }, [])

  const refetch = useCallback(() => { fetchCoupons() }, [])
  useRefetchOnFocus(refetch)

  const fetchCoupons = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false }).abortSignal(AbortSignal.timeout(6000))
      if (error) throw error
      setCoupons(data || [])
    } catch (err) {
      console.error("Error fetching coupons:", err)
    } finally {
      setLoading(false)
    }
  }

  // Helper: format date avoiding timezone offset (UTC midnight → Argentina = day before)
  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const d = dateStr.split('T')[0] // take only YYYY-MM-DD
    const [y, m, day] = d.split('-')
    return `${day}/${m}/${y}`
  }

  const getCouponStatus = (c) => {
    if (!c.is_active) return { text: 'Inactivo', className: 'status-badge--archived', isHistoric: true }
    if (c.max_uses && c.current_uses >= c.max_uses) return { text: 'Agotado', className: 'status-badge--archived', isHistoric: true }
    if (c.valid_until) {
      const now = new Date()
      const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const untilDate = new Date(c.valid_until)
      const untilDateOnly = new Date(untilDate.getFullYear(), untilDate.getMonth(), untilDate.getDate())
      if (untilDateOnly < todayDate) return { text: 'Vencido', className: 'status-badge--archived', isHistoric: true }
    }
    return { text: 'Activo', className: 'status-badge--published', isHistoric: false }
  }

  const handleCreate = async () => {
    if (!form.code || !form.value) return
    setSaving(true)

    // Check duplicate
    const codeUpper = form.code.toUpperCase()
    const { data: existing, error: checkError } = await supabase
      .from('coupons')
      .select('id')
      .eq('code', codeUpper)
      .limit(1)
      .abortSignal(AbortSignal.timeout(6000))

    if (existing && existing.length > 0) {
      alert("⚠️ Error: Ya existe un cupón con este código (incluso en históricos). Por favor usa otro nombre.")
      setSaving(false)
      return
    }

    const user = useAuthStore.getState().user

    // Append T12:00:00 to dates to prevent timezone rollback
    await supabase.from('coupons').insert({
      code: codeUpper,
      type: form.type,
      value: parseFloat(form.value),
      valid_from: form.valid_from ? `${form.valid_from}T12:00:00` : null,
      valid_until: form.valid_until ? `${form.valid_until}T12:00:00` : null,
      max_uses: parseInt(form.max_uses) || 100,
      created_by: user?.id,
    })

    setSaving(false)
    setShowForm(false)
    setForm({ code: '', type: 'percentage', value: '', valid_from: '', valid_until: '', max_uses: 100 })
    fetchCoupons()
  }

  const toggleActive = async (id, current) => {
    await supabase.from('coupons').update({ is_active: !current }).eq('id', id)
    fetchCoupons()
  }

  const updateField = (f, v) => setForm(p => ({ ...p, [f]: v }))

  return (
    <div className="dash-page">
      <div className="dash-pane">
        <div className="dash-pane__header">
          <div className="dash-pane__header-left">
            <h1 className="dash-pane__title">Cupones de Descuento</h1>
          </div>
          {!showForm && (
            <button className="btn btn--accent btn--sm" onClick={() => setShowForm(true)}>
              <Plus size={16} /> Nuevo Cupón
            </button>
          )}
        </div>

      {showForm && (
        <div className="item-card glass" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="item-card__header">
            <h3 className="item-card__title">Nuevo Cupón</h3>
            <button className="btn btn--ghost btn--sm" onClick={() => setShowForm(false)}><X size={14} /></button>
          </div>

          <div className="form-row">
            <div className="input-group">
              <label>Código *</label>
              <input className="input" placeholder="Ej: VERANO25" value={form.code} onChange={(e) => updateField('code', e.target.value.toUpperCase())} style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }} />
            </div>
            <div className="input-group">
              <label>Tipo</label>
              <select className="input" value={form.type} onChange={(e) => updateField('type', e.target.value)}>
                <option value="percentage">Porcentaje (%)</option>
                <option value="fixed">Monto Fijo ($)</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="input-group">
              <label>Valor * {form.type === 'percentage' ? '(%)' : '($)'}</label>
              <input className="input" type="number" min={0} placeholder={form.type === 'percentage' ? '25' : '5000'} value={form.value} onChange={(e) => updateField('value', e.target.value)} />
            </div>
            <div className="input-group">
              <label>Usos máximos</label>
              <input className="input" type="number" min={1} value={form.max_uses} onChange={(e) => updateField('max_uses', e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="input-group">
              <label><Calendar size={14} /> Válido desde</label>
              <input className="input" type="date" value={form.valid_from} onChange={(e) => updateField('valid_from', e.target.value)} />
            </div>
            <div className="input-group">
              <label><Calendar size={14} /> Válido hasta</label>
              <input className="input" type="date" value={form.valid_until} onChange={(e) => updateField('valid_until', e.target.value)} />
            </div>
          </div>

          <button className="btn btn--accent" onClick={handleCreate} disabled={saving} style={{ alignSelf: 'flex-end' }}>
            {saving ? <Loader size={16} className="spin" /> : <><Save size={16} /> Crear Cupón</>}
          </button>
        </div>
      )}

      {loading && <div className="protected-loading"><p>Cargando...</p></div>}

      {!loading && coupons.length === 0 && !showForm && (
        <div className="dashboard__empty">
          <div className="dashboard__empty-icon"><Tag size={48} /></div>
          <h3>Sin cupones</h3>
          <p>Crea tu primer cupón de descuento para atraer clientes.</p>
          <button className="btn btn--accent" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Crear cupón
          </button>
        </div>
      )}

      {/* Active Coupons Grid */}
      <div className="dashboard__grid">
        {coupons.filter(c => !getCouponStatus(c).isHistoric).map(c => (
          <div key={c.id} className="item-card glass">
            <div className="item-card__header">
              <div>
                <span className="coupon-card__code">{c.code}</span>
                <div className="coupon-card__value" style={{ marginTop: '8px' }}>
                  {c.type === 'percentage' ? (
                    <><Percent size={18} style={{ verticalAlign: '-3px' }} />{c.value}</>
                  ) : (
                    <><DollarSign size={18} style={{ verticalAlign: '-3px' }} />{c.value?.toLocaleString('es-AR')}</>
                  )}
                </div>
              </div>
              <span className={`status-badge ${getCouponStatus(c).className}`}>
                {getCouponStatus(c).text}
              </span>
            </div>

            <div className="coupon-card__usage">
              Usos: {c.current_uses} / {c.max_uses}
            </div>

            {(c.valid_from || c.valid_until) && (
              <div className="coupon-card__dates">
                {c.valid_from && `Desde: ${formatDate(c.valid_from)}`}
                {c.valid_from && c.valid_until && ' · '}
                {c.valid_until && `Hasta: ${formatDate(c.valid_until)}`}
              </div>
            )}

            <button className="btn btn--ghost btn--sm" onClick={() => toggleActive(c.id, c.is_active)} style={{ marginTop: 'auto' }}>
              {c.is_active ? 'Desactivar' : 'Activar'}
            </button>
          </div>
        ))}
      </div>

      {/* Collapsible Historic Coupons Section */}
      {coupons.filter(c => getCouponStatus(c).isHistoric).length > 0 && (
        <div style={{ marginTop: 'var(--space-8)', width: '100%' }}>
          <button 
            type="button"
            className="btn btn--outline" 
            onClick={() => setShowHistoric(!showHistoric)}
            style={{ width: '100%', justifyContent: 'space-between', display: 'flex', alignItems: 'center', padding: '12px 20px', borderRadius: 'var(--radius-xl)' }}
          >
            <span>📜 Ver Cupones Históricos ({coupons.filter(c => getCouponStatus(c).isHistoric).length})</span>
            <span style={{ fontSize: '12px' }}>{showHistoric ? 'Ocultar' : 'Mostrar'}</span>
          </button>
          
          {showHistoric && (
            <div className="dashboard__grid" style={{ marginTop: 'var(--space-4)', animation: 'fadeSlide 0.2s ease-out' }}>
              {coupons.filter(c => getCouponStatus(c).isHistoric).map(c => (
                <div key={c.id} className="item-card glass" style={{ opacity: 0.6 }}>
                  <div className="item-card__header">
                    <div>
                      <span className="coupon-card__code">{c.code}</span>
                      <div className="coupon-card__value" style={{ marginTop: '8px' }}>
                        {c.type === 'percentage' ? (
                          <><Percent size={18} style={{ verticalAlign: '-3px' }} />{c.value}</>
                        ) : (
                          <><DollarSign size={18} style={{ verticalAlign: '-3px' }} />{c.value?.toLocaleString('es-AR')}</>
                        )}
                      </div>
                    </div>
                    <span className={`status-badge ${getCouponStatus(c).className}`}>
                      {getCouponStatus(c).text}
                    </span>
                  </div>

                  <div className="coupon-card__usage">
                    Usos: {c.current_uses} / {c.max_uses}
                  </div>

                  {(c.valid_from || c.valid_until) && (
                    <div className="coupon-card__dates">
                      {c.valid_from && `Desde: ${formatDate(c.valid_from)}`}
                      {c.valid_from && c.valid_until && ' · '}
                      {c.valid_until && `Hasta: ${formatDate(c.valid_until)}`}
                    </div>
                  )}

                  <button className="btn btn--ghost btn--sm" onClick={() => toggleActive(c.id, c.is_active)} style={{ marginTop: 'auto' }}>
                    {c.is_active ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  )
}
