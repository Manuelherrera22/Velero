import React, { useState } from 'react'
import { useTripWizardStore } from '../../../../stores/useTripWizardStore'
import { Calendar as CalendarIcon, Clock, Info, Trash2 } from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'

const Step9Dates = () => {
  const { formData, updateFormData, hasBookings } = useTripWizardStore()
  
  const [selectedDates, setSelectedDates] = useState([])
  const [newDate, setNewDate] = useState({
    departure_time: '',
    arrival_time: '',
    price_per_person: formData.price_per_person || 0,
    full_boat_price: formData.full_boat_price || 0,
  })

  const handleAddDate = () => {
    if (!selectedDates || selectedDates.length === 0) return

    const newDates = []
    const durationDays = formData.duration_days || 1
    
    selectedDates.forEach((date, i) => {
      const curDep = new Date(date)
      const curArr = new Date(date)
      curArr.setDate(curArr.getDate() + (durationDays - 1))
      
      newDates.push({
        id: Date.now() + i,
        departure_date: curDep.toISOString().split('T')[0],
        departure_time: newDate.departure_time,
        arrival_date: curArr.toISOString().split('T')[0],
        arrival_time: newDate.arrival_time,
        price_per_person: newDate.price_per_person,
        full_boat_price: newDate.full_boat_price,
        blocked_spots: 0,
        available_spots: formData.max_passengers || 6
      })
    })

    updateFormData({
      custom_dates: [...formData.custom_dates, ...newDates]
    })

    setSelectedDates([])
  }

  const handleRemoveDate = (id) => {
    if (hasBookings) return;
    updateFormData({
      custom_dates: formData.custom_dates.filter(d => d.id !== id)
    })
  }

  const handleUpdateBlockedSpots = (id, newBlockedSpots) => {
    updateFormData({
      custom_dates: formData.custom_dates.map(d => 
        d.id === id ? { ...d, blocked_spots: parseInt(newBlockedSpots) || 0 } : d
      )
    })
  }

  return (
    <div className="step-container">
      
      <div className="step-header">
        <h2 className="step-title">
          Agregar fechas a la travesía
        </h2>
        <p className="step-subtitle">
          Selecciona en el calendario los días de salida, configura los horarios y añade las fechas.
        </p>
      </div>

      <div className="step-form">
        
        {hasBookings && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, marginBottom: 'var(--space-6)' }}>
            ⚠️ Esta travesía ya tiene reservas. Solo puedes modificar las plazas bloqueadas para mantener la disponibilidad real. No puedes añadir ni eliminar fechas.
          </div>
        )}

        {/* Date Ingestion UI */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-6)', paddingBottom: 'var(--space-4)', opacity: hasBookings ? 0.5 : 1, pointerEvents: hasBookings ? 'none' : 'auto' }}>
          
          {/* Calendar Picker */}
          <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'white', padding: 'var(--space-4)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <label className="form-group__label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', width: '100%', marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }}>
              1. Seleccionar días de salida
              <Info size={16} color="var(--text-muted)" />
            </label>
            <div style={{ transform: 'scale(0.95)', transformOrigin: 'top center' }}>
              <DayPicker
                mode="multiple"
                selected={selectedDates}
                onSelect={setSelectedDates}
                disabled={{ before: new Date() }}
              />
            </div>
          </div>

          {/* Times and Prices */}
          <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', backgroundColor: 'white', padding: 'var(--space-6)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            
            <div>
              <label className="form-group__label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', color: 'var(--text-primary)' }}>
                2. Configurar Horarios y Precios
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', display: 'block', fontWeight: 'bold' }}>Hora de Salida</label>
                  <div className="input-with-icon">
                    <Clock className="input-icon" size={16} />
                    <input 
                      type="time"
                      className="input-control"
                      style={{ paddingLeft: '36px' }}
                      value={newDate.departure_time}
                      onChange={(e) => setNewDate({ ...newDate, departure_time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', display: 'block', fontWeight: 'bold' }}>Hora de Llegada</label>
                  <div className="input-with-icon">
                    <Clock className="input-icon" size={16} />
                    <input 
                      type="time"
                      className="input-control"
                      style={{ paddingLeft: '36px' }}
                      value={newDate.arrival_time}
                      onChange={(e) => setNewDate({ ...newDate, arrival_time: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', display: 'block', fontWeight: 'bold' }}>Precio Pasajero</label>
                  <div className="input-with-icon">
                    <span className="input-icon" style={{ fontWeight: 'bold' }}>$</span>
                    <input 
                      type="number"
                      className="input-control"
                      style={{ paddingLeft: '36px', fontWeight: 'bold', fontSize: '16px' }}
                      value={newDate.price_per_person}
                      onChange={(e) => setNewDate({ ...newDate, price_per_person: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                
                <div className="form-group" style={{ marginBottom: 0, opacity: formData.allow_full_boat ? 1 : 0.4 }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', display: 'block', fontWeight: 'bold' }}>Precio Barco</label>
                  <div className="input-with-icon">
                    <span className="input-icon" style={{ fontWeight: 'bold' }}>$</span>
                    <input 
                      type="number"
                      disabled={!formData.allow_full_boat}
                      className="input-control"
                      style={{ paddingLeft: '36px', fontWeight: 'bold', fontSize: '16px' }}
                      value={newDate.full_boat_price}
                      onChange={(e) => setNewDate({ ...newDate, full_boat_price: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: 'var(--space-4)' }}>
              <button 
                className="btn btn--accent"
                style={{ height: '54px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '16px', fontWeight: 'bold' }}
                onClick={handleAddDate}
                disabled={!selectedDates || selectedDates.length === 0}
              >
                <CalendarIcon size={20} />
                {(!selectedDates || selectedDates.length === 0) 
                  ? 'Selecciona fechas en el calendario' 
                  : `Añadir ${selectedDates.length} fecha${selectedDates.length > 1 ? 's' : ''}`}
              </button>
            </div>

          </div>
        </div>

        {/* Table of added dates */}
        <div style={{ backgroundColor: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-6)', marginTop: 'var(--space-8)' }}>
          <h3 style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: 'var(--space-4)', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: 'var(--space-2)' }}>Fechas añadidas</h3>
          
          {formData.custom_dates.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-8) 0' }}>
              Aún no creaste fechas para esta travesía.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {formData.custom_dates.map(date => (
                <div key={date.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-4)', backgroundColor: 'rgba(0,0,0,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', transition: 'border-color 0.3s ease' }} className="date-row-hover">
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
                      <p style={{ fontWeight: 'bold', color: 'var(--color-primary-500)' }}>$ {date.price_per_person}</p>
                    </div>
                    {formData.allow_full_boat && (
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '2px' }}>Barco</p>
                        <p style={{ fontWeight: 'bold', color: 'var(--color-accent-500)' }}>$ {date.full_boat_price}</p>
                      </div>
                    )}
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '2px' }} title="Lugares que vendiste por tu cuenta y ya no están disponibles en Kailu">
                        Plazas Bloqueadas <Info size={12} style={{ display: 'inline', verticalAlign: 'middle' }}/>
                      </label>
                      <input 
                        type="number" 
                        min="0"
                        max={formData.max_passengers || 6}
                        value={date.blocked_spots || 0}
                        onChange={(e) => handleUpdateBlockedSpots(date.id, e.target.value)}
                        style={{ width: '60px', padding: '4px', textAlign: 'center', borderRadius: '4px', border: '1px solid var(--border-color)', fontWeight: 'bold' }}
                      />
                    </div>
                    {!hasBookings && (
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
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
      <style>{`
        .rdp-root {
          --rdp-accent-color: var(--color-accent-500);
          --rdp-accent-background-color: var(--color-accent-500);
        }
        .date-row-hover:hover {
          border-color: rgba(0, 180, 180, 0.4) !important;
          background-color: white !important;
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
