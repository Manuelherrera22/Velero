import React, { useState } from 'react'
import { useTripWizardStore } from '../../../../stores/useTripWizardStore'
import { Calendar as CalendarIcon, Clock, Info, Trash2, Lock, Unlock } from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'

const Step9Dates = () => {
  const { formData, updateFormData, hasBookings } = useTripWizardStore()
  
  const [selectedDates, setSelectedDates] = useState([])
  const [showBlockedSpots, setShowBlockedSpots] = useState(false)
  const [newDate, setNewDate] = useState({
    departure_time: '',
    arrival_time: '',
    price_per_person: formData.price_per_person || 0,
    full_boat_price: formData.full_boat_price || 0,
  })

  const durationDays = formData.duration_days || 1

  // Helper: generate all dates in a range (inclusive)
  const getDatesInRange = (start, end) => {
    const dates = []
    const current = new Date(start)
    const last = new Date(end)
    while (current <= last) {
      dates.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    return dates
  }

  // When duration > 1: user clicks ONE date, system auto-selects N consecutive days
  const handleSingleClickAutoRange = (date) => {
    if (!date) {
      setSelectedDates([])
      return
    }
    // Generate durationDays consecutive dates starting from the clicked date
    const range = []
    for (let i = 0; i < durationDays; i++) {
      const d = new Date(date)
      d.setDate(d.getDate() + i)
      range.push(d)
    }
    setSelectedDates(range)
  }

  // For duration=1: multiple mode
  const handleMultiSelect = (dates) => {
    setSelectedDates(dates || [])
  }

  const handleAddDate = () => {
    if (!selectedDates || selectedDates.length === 0) return

    const newDates = []
    
    if (durationDays > 1) {
      // In auto-range mode: create ONE trip entry spanning all selected days
      const sortedDates = [...selectedDates].sort((a, b) => a - b)
      const departure = sortedDates[0]
      const arrival = sortedDates[sortedDates.length - 1]
      
      newDates.push({
        id: Date.now(),
        departure_date: departure.toISOString().split('T')[0],
        departure_time: newDate.departure_time,
        arrival_date: arrival.toISOString().split('T')[0],
        arrival_time: newDate.arrival_time,
        price_per_person: formData.allow_individual_booking !== false ? newDate.price_per_person : 0,
        full_boat_price: formData.allow_full_boat ? newDate.full_boat_price : 0,
        blocked_spots: 0,
        available_spots: formData.max_passengers || 6,
        all_dates: sortedDates.map(d => d.toISOString().split('T')[0])
      })
    } else {
      // For 1-day trips: each selected date = one entry
      selectedDates.forEach((date, i) => {
        const curDep = new Date(date)
        newDates.push({
          id: Date.now() + i,
          departure_date: curDep.toISOString().split('T')[0],
          departure_time: newDate.departure_time,
          arrival_date: curDep.toISOString().split('T')[0],
          arrival_time: newDate.arrival_time,
          price_per_person: formData.allow_individual_booking !== false ? newDate.price_per_person : 0,
          full_boat_price: formData.allow_full_boat ? newDate.full_boat_price : 0,
          blocked_spots: 0,
          available_spots: formData.max_passengers || 6
        })
      })
    }

    updateFormData({
      custom_dates: [...formData.custom_dates, ...newDates]
    })

    setSelectedDates([])
  }

  const handleRemoveDate = (id) => {
    const dateObj = formData.custom_dates.find(d => d.id === id);
    const dateHasBookings = dateObj && dateObj.available_spots < (formData.max_passengers || 6);

    if (dateHasBookings) {
      alert("No puedes eliminar esta fecha porque ya tiene reservas. Si necesitas reprogramar o cancelarla por mal tiempo o fuerza mayor, comunícate con nosotros escribiendo a soporte@kailu.travel o por WhatsApp para coordinar con los pasajeros.");
      return;
    }
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

  const formatDateShort = (dateStr) => {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  }

  const formatDateLong = (dateStr) => {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }

  const formatPrice = (value) => {
    return Number(value || 0).toLocaleString('es-AR')
  }

  return (
    <div className="step-container">
      
      <div className="step-header">
        <h2 className="step-title">
          Agregar fechas a la travesía
        </h2>
        <p className="step-subtitle">
          {durationDays > 1 
            ? `Hacé clic en el día de zarpe y el sistema marcará automáticamente los ${durationDays} días de la travesía.`
            : 'Selecciona en el calendario los días de salida, configura los horarios y añade las fechas.'
          }
        </p>
      </div>

      <div className="step-form">
        
        {hasBookings && (
          <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#d97706', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, marginBottom: 'var(--space-6)' }}>
            ⚠️ Esta travesía ya tiene reservas. Puedes agregar nuevas fechas o modificar las plazas bloqueadas, pero no eliminar fechas existentes.
          </div>
        )}

        {/* Date Ingestion UI */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-6)', paddingBottom: 'var(--space-4)' }}>
          
          {/* Calendar Picker */}
          <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'white', padding: 'var(--space-4)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <label className="form-group__label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', width: '100%', marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }}>
              1. Seleccionar días de salida
              <Info size={16} color="var(--text-muted)" />
            </label>

            {durationDays > 1 && (
              <div style={{ backgroundColor: 'rgba(0, 180, 180, 0.05)', border: '1px solid rgba(0, 180, 180, 0.2)', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', color: 'var(--color-primary-700)', marginBottom: 'var(--space-4)', width: '100%', textAlign: 'left' }}>
                <strong>Travesía de {durationDays} días:</strong> Hacé clic en el <b>día de zarpe</b>. El sistema marcará automáticamente los {durationDays} días consecutivos.
              </div>
            )}

            <div style={{ transform: 'scale(0.95)', transformOrigin: 'top center' }}>
              {durationDays > 1 ? (
                <DayPicker
                  mode="single"
                  selected={selectedDates[0] || undefined}
                  onSelect={handleSingleClickAutoRange}
                  disabled={[{ before: new Date() }]}
                  modifiers={{
                    rangeHighlight: selectedDates
                  }}
                  modifiersStyles={{
                    rangeHighlight: {
                      backgroundColor: 'rgba(0, 180, 180, 0.15)',
                      borderRadius: '4px'
                    }
                  }}
                />
              ) : (
                <DayPicker
                  mode="multiple"
                  selected={selectedDates}
                  onSelect={handleMultiSelect}
                  disabled={[{ before: new Date() }]}
                />
              )}
            </div>

            {selectedDates.length > 0 && (
              <div style={{ width: '100%', padding: '10px 12px', backgroundColor: 'rgba(0, 180, 180, 0.08)', borderRadius: '8px', fontSize: '13px', color: 'var(--color-primary-700)', marginTop: 'var(--space-2)' }}>
                <strong>✅ {durationDays > 1 ? 'Secuencia seleccionada:' : `${selectedDates.length} fecha${selectedDates.length > 1 ? 's' : ''} seleccionada${selectedDates.length > 1 ? 's' : ''}:`}</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                  {selectedDates.map((d, i) => (
                    <span key={i} style={{ 
                      display: 'inline-block', 
                      padding: '2px 8px', 
                      backgroundColor: 'rgba(0, 180, 180, 0.15)', 
                      borderRadius: '4px', 
                      fontSize: '12px',
                      fontWeight: 600
                    }}>
                      {d.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </span>
                  ))}
                </div>
              </div>
            )}
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
                <div className="form-group" style={{ marginBottom: 0, opacity: formData.allow_individual_booking !== false ? 1 : 0.4 }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', display: 'block', fontWeight: 'bold' }}>Precio Pasajero</label>
                  <div className="input-with-icon">
                    <span className="input-icon" style={{ fontWeight: 'bold' }}>$</span>
                    <input 
                      type="number"
                      disabled={formData.allow_individual_booking === false}
                      className="input-control"
                      style={{ paddingLeft: '36px', fontWeight: 'bold', fontSize: '16px' }}
                      value={formData.allow_individual_booking !== false ? newDate.price_per_person : 0}
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
                      value={formData.allow_full_boat ? newDate.full_boat_price : 0}
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
                  ? 'Primero elige un día en el calendario' 
                  : durationDays > 1
                    ? `Añadir travesía (${selectedDates.length} días)`
                    : `Añadir ${selectedDates.length} fecha${selectedDates.length > 1 ? 's' : ''}`}
              </button>
            </div>

          </div>
        </div>

        {/* Table of added dates */}
        <div style={{ backgroundColor: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-6)', marginTop: 'var(--space-8)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--border-color)', paddingBottom: 'var(--space-2)' }}>
            <h3 style={{ fontWeight: 'bold', fontSize: '18px', color: 'var(--text-primary)' }}>Fechas añadidas</h3>
            
            {formData.custom_dates.length > 0 && (
              <button 
                onClick={() => setShowBlockedSpots(!showBlockedSpots)}
                className="btn btn--ghost btn--sm"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: showBlockedSpots ? 'var(--color-accent-500)' : 'var(--text-muted)' }}
              >
                {showBlockedSpots ? <Lock size={14} /> : <Unlock size={14} />}
                {showBlockedSpots ? 'Ocultar plazas bloqueadas' : 'Gestionar plazas bloqueadas'}
              </button>
            )}
          </div>
          
          {formData.custom_dates.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-8) 0' }}>
              Aún no creaste fechas para esta travesía.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {formData.custom_dates.map(date => (
                <div key={date.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-4)', backgroundColor: 'rgba(0,0,0,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', transition: 'border-color 0.3s ease' }} className="date-row-hover">
                  <div style={{ flex: '1 1 300px', marginBottom: 'var(--space-2)' }} className="date-info-container">
                    {date.departure_date === date.arrival_date ? (
                      <p style={{ fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: 'var(--space-1)' }}>
                        📅 {formatDateLong(date.departure_date)}
                      </p>
                    ) : (
                      <div style={{ marginBottom: 'var(--space-1)' }}>
                        <p style={{ fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '11px', padding: '1px 6px', backgroundColor: 'rgba(0, 180, 180, 0.15)', borderRadius: '4px', color: 'var(--color-primary-700)', fontWeight: 700 }}>ZARPE</span>
                          {formatDateLong(date.departure_date)} {date.departure_time ? `a las ${date.departure_time}hs` : ''}
                        </p>
                        <p style={{ fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                          <span style={{ fontSize: '11px', padding: '1px 6px', backgroundColor: 'rgba(245, 158, 11, 0.15)', borderRadius: '4px', color: '#b45309', fontWeight: 700 }}>REGRESO</span>
                          {formatDateLong(date.arrival_date)} {date.arrival_time ? `a las ${date.arrival_time}hs` : ''}
                        </p>
                      </div>
                    )}
                    {/* Show all dates in sequence */}
                    {date.all_dates && date.all_dates.length > 2 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                        {date.all_dates.map((d, i) => (
                          <span key={i} style={{ 
                            fontSize: '11px', 
                            padding: '2px 8px', 
                            backgroundColor: i === 0 ? 'rgba(0, 180, 180, 0.15)' : i === date.all_dates.length - 1 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(0, 0, 0, 0.05)', 
                            borderRadius: '4px', 
                            color: i === 0 ? 'var(--color-primary-700)' : i === date.all_dates.length - 1 ? '#b45309' : 'var(--text-secondary)',
                            fontWeight: 500
                          }}>
                            Día {i + 1}: {formatDateShort(d)}
                          </span>
                        ))}
                      </div>
                    )}
                    {date.departure_date === date.arrival_date && (
                      <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        ⛵ Salida: {date.departure_time || '--:--'}hs | 🏠 Regreso: {date.arrival_time || '--:--'}hs
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)' }}>
                    {formData.allow_individual_booking !== false && (
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '2px' }}>Por persona</p>
                        <p style={{ fontWeight: 'bold', color: 'var(--color-primary-500)', fontSize: '16px' }}>$ {formatPrice(date.price_per_person)}</p>
                      </div>
                    )}
                    {formData.allow_full_boat && (
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '2px' }}>Barco completo</p>
                        <p style={{ fontWeight: 'bold', color: 'var(--color-accent-500)', fontSize: '16px' }}>$ {formatPrice(date.full_boat_price)}</p>
                      </div>
                    )}
                    {showBlockedSpots && (
                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '2px' }} title="Lugares que vendiste por tu cuenta y ya no están disponibles en Kailu">
                          Bloqueadas <Info size={12} style={{ display: 'inline', verticalAlign: 'middle' }}/>
                        </label>
                        <input 
                          type="number" 
                          min="0"
                          max={formData.max_passengers || 6}
                          value={date.blocked_spots || 0}
                          disabled={date.available_spots < (formData.max_passengers || 6)}
                          onChange={(e) => handleUpdateBlockedSpots(date.id, e.target.value)}
                          style={{ width: '60px', padding: '4px', textAlign: 'center', borderRadius: '4px', border: '1px solid var(--border-color)', fontWeight: 'bold', opacity: (date.available_spots < (formData.max_passengers || 6)) ? 0.6 : 1 }}
                        />
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
        .rdp-root {
          --rdp-accent-color: var(--color-accent-500);
          --rdp-accent-background-color: var(--color-accent-500);
        }
        .date-row-hover:hover {
          border-color: rgba(0, 180, 180, 0.4) !important;
          background-color: white !important;
        }
        .date-remove-btn {
          opacity: 1 !important;
        }
        @media (min-width: 768px) {
          .date-remove-btn {
            opacity: 0 !important;
          }
          .date-row-hover:hover .date-remove-btn {
            opacity: 1 !important;
          }
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
      `}
      </style>
    </div>
  )
}

export default Step9Dates
