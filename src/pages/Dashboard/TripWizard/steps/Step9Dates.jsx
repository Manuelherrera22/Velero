import React, { useState } from 'react'
import { useTripWizardStore } from '../../../../stores/useTripWizardStore'
import { Calendar, Clock, Info, Trash2 } from 'lucide-react'

const Step9Dates = () => {
  const { formData, updateFormData } = useTripWizardStore()
  
  const [newDate, setNewDate] = useState({
    departure_date: '',
    departure_time: '',
    arrival_date: '',
    arrival_time: '',
    price_per_person: formData.price_per_person || 0,
    full_boat_price: formData.full_boat_price || 0,
    repeat_days: 1
  })

  const handleAddDate = () => {
    if (!newDate.departure_date || !newDate.arrival_date) return

    const newDates = []
    const startDepDate = new Date(`${newDate.departure_date}T12:00:00`)
    const startArrDate = new Date(`${newDate.arrival_date}T12:00:00`)
    
    for (let i = 0; i < newDate.repeat_days; i++) {
      const curDep = new Date(startDepDate)
      curDep.setDate(curDep.getDate() + i)
      const curArr = new Date(startArrDate)
      curArr.setDate(curArr.getDate() + i)
      
      newDates.push({
        id: Date.now() + i,
        departure_date: curDep.toISOString().split('T')[0],
        departure_time: newDate.departure_time,
        arrival_date: curArr.toISOString().split('T')[0],
        arrival_time: newDate.arrival_time,
        price_per_person: newDate.price_per_person,
        full_boat_price: newDate.full_boat_price
      })
    }

    updateFormData({
      custom_dates: [...formData.custom_dates, ...newDates]
    })

    setNewDate({
      departure_date: '',
      departure_time: '',
      arrival_date: '',
      arrival_time: '',
      price_per_person: formData.price_per_person || 0,
      full_boat_price: formData.full_boat_price || 0,
      repeat_days: 1
    })
  }

  const handleRemoveDate = (id) => {
    updateFormData({
      custom_dates: formData.custom_dates.filter(d => d.id !== id)
    })
  }

  return (
    <div className="step-container">
      
      <div className="step-header">
        <h2 className="step-title">
          Agregar fechas a la travesía
        </h2>
        <p className="step-subtitle">
          Planifica en el calendario cuándo saldrás y, si lo deseas, ajusta precios especiales por fecha.
        </p>
      </div>

      <div className="step-form">
        
        {/* Date Ingestion Matrix */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
          
          {/* Salida */}
          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: 'var(--space-4)', borderRadius: 'var(--radius-xl)', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
            <label className="form-group__label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              Salida
              <Info size={16} color="var(--text-muted)" />
            </label>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <div className="input-with-icon" style={{ flex: 1 }}>
                <Calendar className="input-icon" size={16} />
                <input 
                  type="date"
                  className="input-control"
                  style={{ paddingLeft: '36px' }}
                  title="Fecha de salida"
                  value={newDate.departure_date}
                  onChange={(e) => setNewDate({ ...newDate, departure_date: e.target.value })}
                />
              </div>
              <div className="input-with-icon" style={{ width: '130px' }}>
                <Clock className="input-icon" size={16} />
                <input 
                  type="time"
                  className="input-control"
                  style={{ paddingLeft: '36px' }}
                  title="Hora de salida"
                  value={newDate.departure_time}
                  onChange={(e) => setNewDate({ ...newDate, departure_time: e.target.value })}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
              <span style={{ flex: 1, paddingLeft: '8px' }}>Día / Mes / Año</span>
              <span style={{ width: '130px', paddingLeft: '8px' }}>Hora (Ej: 09:00)</span>
            </div>
          </div>

          {/* Llegada */}
          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: 'var(--space-4)', borderRadius: 'var(--radius-xl)', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
            <label className="form-group__label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              Llegada
              <Info size={16} color="var(--text-muted)" />
            </label>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <div className="input-with-icon" style={{ flex: 1 }}>
                <Calendar className="input-icon" size={16} />
                <input 
                  type="date"
                  className="input-control"
                  style={{ paddingLeft: '36px' }}
                  title="Fecha de llegada"
                  value={newDate.arrival_date}
                  onChange={(e) => setNewDate({ ...newDate, arrival_date: e.target.value })}
                />
              </div>
              <div className="input-with-icon" style={{ width: '130px' }}>
                <Clock className="input-icon" size={16} />
                <input 
                  type="time"
                  className="input-control"
                  style={{ paddingLeft: '36px' }}
                  title="Hora de llegada"
                  value={newDate.arrival_time}
                  onChange={(e) => setNewDate({ ...newDate, arrival_time: e.target.value })}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
              <span style={{ flex: 1, paddingLeft: '8px' }}>Día / Mes / Año</span>
              <span style={{ width: '130px', paddingLeft: '8px' }}>Hora (Ej: 18:00)</span>
            </div>
          </div>

        </div>

        {/* Dynamic Pricing and Submit for Date */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', alignItems: 'flex-end', paddingTop: 'var(--space-2)' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-group__label" style={{ fontSize: '12px' }}>Precio por Pasajero</label>
            <input 
              type="number"
              className="input-control"
              style={{ fontWeight: 'bold', fontSize: '18px' }}
              value={newDate.price_per_person}
              onChange={(e) => setNewDate({ ...newDate, price_per_person: parseFloat(e.target.value) || 0 })}
            />
          </div>
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-group__label" style={{ fontSize: '12px', opacity: formData.allow_full_boat ? 1 : 0.5 }}>Precio Barco Entero</label>
            <input 
              type="number"
              disabled={!formData.allow_full_boat}
              className="input-control"
              style={{ fontWeight: 'bold', fontSize: '18px', opacity: formData.allow_full_boat ? 1 : 0.5 }}
              value={newDate.full_boat_price}
              onChange={(e) => setNewDate({ ...newDate, full_boat_price: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-group__label" style={{ fontSize: '12px', color: 'var(--color-accent-500)' }}>Repetir (Días Seguidos)</label>
            <input 
              type="number"
              min="1"
              max="30"
              className="input-control"
              style={{ fontWeight: 'bold', fontSize: '18px', borderColor: 'var(--color-accent-500)' }}
              value={newDate.repeat_days}
              onChange={(e) => setNewDate({ ...newDate, repeat_days: parseInt(e.target.value) || 1 })}
              title="Añadir esta misma travesía durante varios días consecutivos automáticamente."
            />
          </div>

          <button 
            className="btn btn--accent"
            style={{ height: '48px', padding: '0 var(--space-4)' }}
            onClick={handleAddDate}
            disabled={!newDate.departure_date || !newDate.arrival_date}
          >
            Añadir esta fecha
          </button>
        </div>

        {/* Table of added dates */}
        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-6)', marginTop: 'var(--space-8)' }}>
          <h3 style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: 'var(--space-4)', color: 'rgba(255, 255, 255, 0.8)', borderBottom: '1px solid var(--border-color)', paddingBottom: 'var(--space-2)' }}>Fechas añadidas</h3>
          
          {formData.custom_dates.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.4)', padding: 'var(--space-8) 0' }}>
              Aún no creaste fechas para esta travesía.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {formData.custom_dates.map(date => (
                <div key={date.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-4)', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', transition: 'border-color 0.3s ease' }} className="date-row-hover">
                  <div style={{ flex: '1 1 300px', marginBottom: 'var(--space-4)' }} className="date-info-container">
                    <p style={{ fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: 'var(--space-1)' }}>
                      Del {date.departure_date} al {date.arrival_date}
                    </p>
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                      Salida: {date.departure_time || '--:--'} | Llegada: {date.arrival_time || '--:--'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)' }}>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '2px' }}>Pasajero</p>
                      <p style={{ fontWeight: 'bold', color: 'var(--color-primary-500)' }}>€ {date.price_per_person}</p>
                    </div>
                    {formData.allow_full_boat && (
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '2px' }}>Barco</p>
                        <p style={{ fontWeight: 'bold', color: 'var(--color-accent-500)' }}>€ {date.full_boat_price}</p>
                      </div>
                    )}
                    <button 
                      onClick={() => handleRemoveDate(date.id)}
                      className="date-remove-btn"
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: 'rgba(239, 68, 68, 0.6)',
                        padding: '8px',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        opacity: 0,
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Trash2 size={20}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
      <style>{`
        .date-row-hover:hover {
          border-color: rgba(0, 180, 180, 0.4) !important;
        }
        .date-row-hover:hover .date-remove-btn {
          opacity: 1 !important;
        }
        .date-remove-btn:hover {
          color: var(--color-error-500) !important;
          background-color: rgba(239, 68, 68, 0.1) !important;
        }
        @media (min-width: 768px) {
          .date-info-container {
            margin-bottom: 0 !important;
          }
        }
      `}</style>
    </div>
  )
}

export default Step9Dates
