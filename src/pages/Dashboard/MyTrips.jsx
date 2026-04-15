import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, MoreVertical, Compass, AlertCircle } from 'lucide-react'
import useTripStore from '../../stores/tripStore'

export default function MyTrips() {
  const { trips, loading, fetchMyTrips } = useTripStore()
  const navigate = useNavigate()
  
  // State for the Delete Modal
  const [tripToDelete, setTripToDelete] = useState(null)
  
  // State for the Dropdown menus
  const [activeMenuId, setActiveMenuId] = useState(null)

  useEffect(() => { 
    fetchMyTrips() 
  }, [])

  // Close dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null)
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', month: '2-digit', year: '2-digit' 
    })
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    // TODO: implement Supabase deletion
    console.log('Eliminando', tripToDelete)
    setTripToDelete(null)
    setActiveMenuId(null)
  }

  return (
    <div className="w-full h-full p-2 md:p-8 overflow-y-auto">
      
      {/* Container simulating the big white pane of Bluhar */}
      <div className="bg-background rounded-3xl p-6 md:p-10 shadow-lg border border-border/40 min-h-[70vh]">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary text-primary-content rounded-full flex items-center justify-center">
              <Compass className="w-7 h-7" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Travesías
            </h1>
          </div>
          
          <button onClick={() => navigate('/dashboard/travesias/nueva')} className="btn btn-primary rounded-xl">
            Crear una travesía
          </button>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <span className="loading loading-spinner loading-lg text-primary mb-4"></span>
            <p className="font-medium animate-pulse">Cargando flotas...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && trips.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-border/80 rounded-2xl bg-secondary/10">
            <Compass className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-bold text-foreground/80 mb-2">Aún no creaste travesías</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">Tus aventuras náuticas aparecerán aquí ordenadas para que puedas gestionarlas fácilmente.</p>
            <button onClick={() => navigate('/dashboard/travesias/nueva')} className="btn btn-outline btn-primary rounded-full px-8">
              Crear mi primera travesía
            </button>
          </div>
        )}

        {/* The Data Table */}
        {!loading && trips.length > 0 && (
          <div className="overflow-x-auto w-full pb-32">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-border/60 text-xs font-bold text-foreground/80 tracking-wider uppercase">
                  <th className="py-4 pl-4 pr-2">Travesía</th>
                  <th className="py-4 px-2">Estado</th>
                  <th className="py-4 px-2 hidden md:table-cell">Pendientes</th>
                  <th className="py-4 px-2 hidden sm:table-cell">Modificado</th>
                  <th className="py-4 px-2 hidden lg:table-cell">Creado</th>
                  <th className="py-4 px-2 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {trips.map((trip, idx) => {
                  const isEven = idx % 2 === 0
                  
                  // Bluhar uses colored pills for status
                  const isPublished = trip.status === 'published'
                  const statusBg = isPublished ? 'bg-success/20 text-success-content border-success/30' : 'bg-warning/20 text-warning-content border-warning/30'
                  const statusText = isPublished ? 'Publicada' : 'En Revisión'

                  return (
                    <tr key={trip.id} className={`hover:bg-secondary/40 transition-colors ${isEven ? 'bg-secondary/10' : ''}`}>
                      
                      {/* Travesía */}
                      <td className="py-5 pl-4 pr-2 max-w-[200px] truncate">
                        <Link to={`/travesia/${trip.id}`} className="font-semibold text-foreground/90 hover:text-primary hover:underline underline-offset-4 decoration-primary/30 transition-all">
                          {trip.title}
                        </Link>
                      </td>
                      
                      {/* Estado */}
                      <td className="py-5 px-2 font-medium">
                        <span className={`px-3 py-1 text-xs rounded-full border ${statusBg} inline-block font-semibold shadow-sm`}>
                          {statusText}
                        </span>
                      </td>

                      {/* Pendientes */}
                      <td className="py-5 px-2 hidden md:table-cell text-muted-foreground font-medium">
                        -
                      </td>

                      {/* Modificado */}
                      <td className="py-5 px-2 hidden sm:table-cell text-muted-foreground text-sm font-medium">
                        {formatDate(trip.updated_at)}
                      </td>

                      {/* Creado */}
                      <td className="py-5 px-2 hidden lg:table-cell text-muted-foreground text-sm font-medium">
                        {formatDate(trip.created_at)}
                      </td>

                      {/* Acciones */}
                      <td className="py-5 px-2 text-center relative">
                        <div className="inline-block text-left">
                          <button 
                            className="btn btn-ghost btn-circle btn-sm hover:bg-border transition-colors text-foreground"
                            onClick={(e) => {
                              e.stopPropagation()
                              setActiveMenuId(activeMenuId === trip.id ? null : trip.id)
                            }}
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>

                          {/* Dropdown Popover */}
                          {activeMenuId === trip.id && (
                            <div 
                              className="absolute right-8 top-10 w-48 bg-background border border-border shadow-xl rounded-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-200"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button className="w-full text-left px-5 py-3 text-sm font-medium hover:bg-secondary/50 transition-colors">
                                Copiar
                              </button>
                              <button 
                                className="w-full text-left px-5 py-3 text-sm font-medium hover:bg-secondary/50 transition-colors"
                                onClick={() => navigate(`/dashboard/travesias/${trip.id}/editar`)}
                              >
                                Editar
                              </button>
                              <button className="w-full text-left px-5 py-3 text-sm font-medium hover:bg-secondary/50 transition-colors">
                                Editar fecha y hora
                              </button>
                              <button 
                                className="w-full text-left px-5 py-3 text-sm font-medium hover:bg-error/10 hover:text-error transition-colors"
                                onClick={() => {
                                  setTripToDelete(trip)
                                  setActiveMenuId(null)
                                }}
                              >
                                Eliminar
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DE ELIMINACIÓN */}
      {tripToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-background border border-border shadow-2xl rounded-3xl max-w-sm w-full p-8 relative flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
            
            <div className="w-16 h-16 rounded-full border-2 border-error/50 flex items-center justify-center mb-6">
              <AlertCircle className="w-8 h-8 text-error" />
            </div>

            <h3 className="text-xl font-bold text-foreground mb-4">
              Estás por eliminar esta travesía
            </h3>
            
            <p className="text-muted-foreground text-sm font-medium mb-8">
              ¿Deseas eliminar esta travesía de forma permanente? Esta acción no se puede deshacer.
            </p>

            <div className="w-full space-y-3">
              <button 
                onClick={() => setTripToDelete(null)}
                className="btn btn-primary w-full h-12 rounded-xl text-sm"
              >
                Me arrepentí, no quiero eliminar
              </button>
              <button 
                onClick={handleDelete}
                className="btn w-full h-12 rounded-xl bg-error/90 hover:bg-error text-error-content text-sm shadow-md shadow-error/20"
              >
                Quiero eliminar esta travesía
              </button>
            </div>
            
          </div>
        </div>
      )}

    </div>
  )
}
