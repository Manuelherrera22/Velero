import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search as SearchIcon, MapPin, Compass, Star, Clock, Anchor, Users } from 'lucide-react'
import useTripStore from '../stores/tripStore'
import './Search.css'

export default function Search() {
  const { trips, tags, loading, fetchTrips, fetchTags } = useTripStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTag, setActiveTag] = useState('Todos')

  useEffect(() => {
    fetchTags()
    fetchTrips()
  }, [])

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
                    {formatPrice(trip.price_per_person, trip.currency)}
                    <span>/persona</span>
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
