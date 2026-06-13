import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search as SearchIcon, MapPin, Compass, Star, Clock, Anchor, Users } from 'lucide-react'
import useTripStore from '../stores/tripStore'
import './Search.css'

export default function Search() {
  const { trips, tags, isLoadingTrips: loading, fetchTrips, fetchTags } = useTripStore()
  const [searchParams] = useSearchParams()
  const urlSearch = searchParams.get('search') || ''

  const [searchQuery, setSearchQuery] = useState(urlSearch)
  const [activeTag, setActiveTag] = useState('Todos')

  useEffect(() => {
    window.scrollTo(0, 0)
    fetchTags()
    if (urlSearch) {
      setSearchQuery(urlSearch)
      fetchTrips({ search: urlSearch })
    } else {
      fetchTrips()
    }
  }, [urlSearch])

  const handleSearch = () => {
    const filters = {}
    if (searchQuery) filters.search = searchQuery
    if (activeTag !== 'Todos') filters.tag = activeTag
    fetchTrips(filters)
  }

  const handleTagClick = (tagName) => {
    setActiveTag(tagName)
    const filters = {}
    if (searchQuery) filters.search = searchQuery
    if (tagName !== 'Todos') filters.tag = tagName
    fetchTrips(filters)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch()
  }

  const formatPrice = (price, currency) => {
    if (currency === 'EUR') return `€${price}`
    if (currency === 'USD') return `US$${price}`
    return `$${price?.toLocaleString('es-AR')}`
  }

  const getImageUrl = (trip) => {
    if (trip.images?.length > 0) return trip.images[0]
    return null
  }

  const allTags = ['Todos', ...tags.map(t => t.name)]

  return (
    <div className="search-page">
      <div className="container">
        <div className="search-header">
          <h1 className="search-header__title">Explorar Travesías</h1>
          <p className="search-header__subtitle">
            Descubre experiencias únicas en el agua
          </p>
        </div>

        <div className="search-bar glass">
          <SearchIcon size={20} className="search-bar__icon" />
          <input
            type="text"
            className="search-bar__input"
            placeholder="Buscar por destino, nombre o capitán..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="btn btn--accent btn--sm" onClick={handleSearch}>
            Buscar
          </button>
        </div>

        <div className="search-tags">
          {allTags.map((tag) => (
            <button
              key={tag}
              className={`search-tag ${activeTag === tag ? 'search-tag--active' : ''}`}
              onClick={() => handleTagClick(tag)}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="search-results">
          <p className="search-results__count">
            {loading ? 'Buscando...' : `${trips.length} travesía${trips.length !== 1 ? 's' : ''} encontrada${trips.length !== 1 ? 's' : ''}`}
          </p>

          {!loading && trips.length === 0 && (
            <div className="dashboard__empty" style={{ marginTop: 'var(--space-8)' }}>
              <div className="dashboard__empty-icon"><Compass size={48} /></div>
              <h3>No encontramos travesías</h3>
              <p>Prueba cambiando los filtros o el texto de búsqueda.</p>
            </div>
          )}

          <div className="search-grid">
            {trips.map((trip) => (
              <Link key={trip.id} to={`/travesia/${trip.id}`} className="trip-card card">
                <div className="trip-card__image-wrap">
                  {getImageUrl(trip) ? (
                    <img src={getImageUrl(trip)} alt={trip.title} className="card__image" />
                  ) : (
                    <div className="trip-card__image-placeholder">
                      <Compass size={40} />
                      <span>{trip.location}</span>
                    </div>
                  )}
                  <div className="trip-card__overlay">
                    {trip.tags?.[0] && <span className="card__tag">{trip.tags[0]}</span>}
                  </div>
                </div>
                <div className="card__body">
                  <div className="trip-card__meta">
                    <span className="trip-card__location"><MapPin size={14} /> {trip.location}</span>
                    <span className="trip-card__duration"><Users size={14} /> {trip.capacity} pers.</span>
                  </div>
                  <h3 className="card__title">{trip.title}</h3>
                  <p className="trip-card__captain">
                    <Anchor size={13} /> Capitán {trip.captain?.full_name || 'Verificado'}
                  </p>
                </div>
                <div className="card__footer">
                  <div className="card__rating">
                    <Star size={14} fill="currentColor" />
                    {trip.avgRating || '—'}
                  </div>
                  <div className="card__price">
                    {trip.metadata?.discount_percentage > 0 && (
                      <span style={{ 
                        fontSize: '0.7rem', 
                        background: 'var(--color-accent-500)', 
                        color: 'white', 
                        padding: '2px 6px', 
                        borderRadius: '4px', 
                        fontWeight: 700, 
                        marginRight: '6px' 
                      }}>
                        -{trip.metadata.discount_percentage}%
                      </span>
                    )}
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 'normal', marginRight: '4px' }}>Desde</span>
                    {(() => {
                      const isFullBoatOnly = !(trip.price_per_person > 0) && (trip.full_boat_price > 0 || trip.allow_full_boat);
                      const basePrice = isFullBoatOnly ? trip.full_boat_price : trip.price_per_person;
                      const label = isFullBoatOnly ? '/barco' : '/persona';
                      
                      if (trip.metadata?.discount_percentage > 0) {
                        return (
                          <>
                            <span style={{ textDecoration: 'line-through', color: 'var(--text-tertiary)', fontSize: '0.85rem', marginRight: '4px' }}>
                              {formatPrice(basePrice, trip.currency)}
                            </span>
                            {formatPrice(Math.round(basePrice * (1 - trip.metadata.discount_percentage / 100)), trip.currency)}
                            <span>{label}</span>
                          </>
                        );
                      }
                      return (
                        <>
                          {formatPrice(basePrice, trip.currency)}
                          <span>{label}</span>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
