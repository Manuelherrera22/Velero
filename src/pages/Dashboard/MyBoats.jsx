import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, MoreVertical, Ship, AlertCircle } from 'lucide-react'
import useBoatStore from '../../stores/boatStore'

export default function MyBoats() {
  const { boats, loading, fetchMyBoats, deleteBoat } = useBoatStore()
  
  const [boatToDelete, setBoatToDelete] = useState(null)
  const [activeMenuId, setActiveMenuId] = useState(null)

  useEffect(() => { 
    fetchMyBoats() 
  }, [])

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

  const handleDelete = async (e) => {
    e.stopPropagation()
    // Trigger the zustand delete
    await deleteBoat(boatToDelete.id)
    setBoatToDelete(null)
    setActiveMenuId(null)
  }

  return (
    <div className="w-full h-full p-2 md:p-8 overflow-y-auto">
      
      {/* Principal Pane */}
      <div className="bg-background rounded-3xl p-6 md:p-10 shadow-lg border border-border/40 min-h-[70vh]">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center">
              <Ship className="w-7 h-7" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Embarcaciones agregadas
            </h1>
          </div>
          
          <button className="btn btn-primary rounded-xl">
            Agregar una embarcación
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <span className="loading loading-spinner loading-lg text-primary mb-4"></span>
            <p className="font-medium animate-pulse">Cargando flota...</p>
          </div>
        )}

        {/* Empty */}
        {!loading && boats.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-border/80 rounded-2xl bg-secondary/10">
            <Ship className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-bold text-foreground/80 mb-2">Sin embarcaciones</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">Agrega tu primera embarcación para poder publicarla en futuras travesías.</p>
            <button className="btn btn-outline btn-primary rounded-full px-8">
              Crear mi embarcación
            </button>
          </div>
        )}

        {/* Data Table */}
        {!loading && boats.length > 0 && (
          <div className="overflow-x-auto w-full pb-32">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-border/60 text-xs font-bold text-foreground/80 tracking-wider uppercase">
                  <th className="py-4 pl-4 pr-2">Alias de la Embarcación</th>
                  <th className="py-4 px-2 hidden sm:table-cell">Creado</th>
                  <th className="py-4 px-2 hidden md:table-cell">Modificado</th>
                  <th className="py-4 px-2 text-right pr-6">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {boats.map((boat, idx) => {
                  const isEven = idx % 2 === 0

                  return (
                    <tr key={boat.id} className={`hover:bg-secondary/40 transition-colors ${isEven ? 'bg-secondary/10' : ''}`}>
                      
                      <td className="py-5 pl-4 pr-2 text-foreground/90 font-semibold max-w-[200px] truncate">
                        {boat.name}
                        {boat.manufacturer && <span className="block text-xs font-normal text-muted-foreground">{boat.manufacturer} {boat.model}</span>}
                      </td>

                      <td className="py-5 px-2 hidden sm:table-cell text-muted-foreground text-sm font-medium">
                        {formatDate(boat.created_at)}
                      </td>

                      <td className="py-5 px-2 hidden md:table-cell text-muted-foreground text-sm font-medium">
                        {formatDate(boat.updated_at)}
                      </td>

                      {/* Desktop actions (Bluhar uses inline actions for boats, but we can do both) */}
                      <td className="py-5 px-2 text-right pr-6">
                        <div className="hidden lg:flex items-center justify-end gap-4 text-sm font-medium">
                          <button className="text-primary hover:text-accent transition-colors">Copiar</button>
                          <button className="text-primary hover:text-accent transition-colors">Editar</button>
                          <button 
                            className="text-primary hover:text-error transition-colors"
                            onClick={(e) => {
                              e.stopPropagation()
                              setBoatToDelete(boat)
                            }}
                          >
                            Eliminar
                          </button>
                        </div>

                        {/* Mobile dropdown fallback */}
                        <div className="inline-block text-left lg:hidden relative">
                          <button 
                            className="btn btn-ghost btn-circle btn-sm hover:bg-border transition-colors text-foreground"
                            onClick={(e) => {
                              e.stopPropagation()
                              setActiveMenuId(activeMenuId === boat.id ? null : boat.id)
                            }}
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>

                          {activeMenuId === boat.id && (
                            <div 
                              className="absolute right-8 top-10 w-48 bg-background border border-border shadow-xl rounded-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-200 text-left"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button className="w-full text-left px-5 py-3 text-sm font-medium hover:bg-secondary/50">Copiar</button>
                              <button className="w-full text-left px-5 py-3 text-sm font-medium hover:bg-secondary/50">Editar</button>
                              <button 
                                className="w-full text-left px-5 py-3 text-sm font-medium hover:bg-error/10 hover:text-error"
                                onClick={() => {
                                  setBoatToDelete(boat)
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

      {/* Delete Confirmation Modal */}
      {boatToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-background border border-border shadow-2xl rounded-3xl max-w-sm w-full p-8 relative flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
            
            <div className="w-16 h-16 rounded-full border-2 border-error/50 flex items-center justify-center mb-6">
              <AlertCircle className="w-8 h-8 text-error" />
            </div>

            <h3 className="text-xl font-bold text-foreground mb-4">
              Estás por eliminar esta embarcación
            </h3>
            
            <p className="text-muted-foreground text-sm font-medium mb-8">
              Si eliminas <strong>{boatToDelete.name}</strong>, esta no podrá ser asignada a futuras travesías.
            </p>

            <div className="w-full space-y-3">
              <button 
                onClick={() => setBoatToDelete(null)}
                className="btn btn-primary w-full h-12 rounded-xl text-sm"
              >
                No, mantener embarcación
              </button>
              <button 
                onClick={handleDelete}
                className="btn w-full h-12 rounded-xl bg-error/90 hover:bg-error text-error-content text-sm shadow-md shadow-error/20"
              >
                Eliminar definitivamente
              </button>
            </div>
            
          </div>
        </div>
      )}

    </div>
  )
}
