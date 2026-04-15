import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Star, Send, CheckCircle, ArrowLeft, Loader, Sailboat } from 'lucide-react'
import supabase from '../lib/supabase'
import useAuthStore from '../stores/authStore'
import './Review.css'

export default function Review() {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [booking, setBooking] = useState(null)
  const [trip, setTrip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [existingReview, setExistingReview] = useState(null)

  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')

  useEffect(() => {
    fetchBooking()
  }, [bookingId])

  const fetchBooking = async () => {
    setLoading(true)
    
    const { data: bookingData } = await supabase
      .from('bookings')
      .select(`*, trip:trips!trip_id(id, title, location, captain_id)`)
      .eq('id', bookingId)
      .single()

    if (bookingData) {
      setBooking(bookingData)
      setTrip(bookingData.trip)

      // Check if already reviewed
      const { data: review } = await supabase
        .from('reviews')
        .select('*')
        .eq('booking_id', bookingId)
        .single()

      if (review) {
        setExistingReview(review)
        setRating(review.rating)
        setComment(review.comment || '')
      }
    }

    setLoading(false)
  }

  const handleSubmit = async () => {
    if (rating === 0) return
    setSubmitting(true)

    const reviewData = {
      trip_id: trip.id,
      booking_id: bookingId,
      reviewer_id: user?.id || null,
      rating,
      comment: comment.trim() || null,
    }

    const { error } = await supabase.from('reviews').upsert(reviewData, { onConflict: 'booking_id' })

    if (!error) {
      setSubmitted(true)
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="protected-loading">
        <Loader size={32} className="spin" />
        <p>Cargando...</p>
      </div>
    )
  }

  if (!booking || !trip) {
    return (
      <div className="review-page">
        <div className="container container--narrow" style={{ textAlign: 'center', padding: 'var(--space-24) 0' }}>
          <Sailboat size={48} style={{ color: 'var(--text-tertiary)' }} />
          <h2 style={{ marginTop: 'var(--space-4)' }}>Reserva no encontrada</h2>
          <Link to="/" className="btn btn--accent" style={{ marginTop: 'var(--space-4)' }}>Volver al inicio</Link>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="review-page">
        <div className="container container--narrow">
          <div className="review-success animate-fade-in">
            <CheckCircle size={64} style={{ color: 'var(--color-success)' }} />
            <h1>¡Gracias por tu opinión!</h1>
            <p>Tu calificación ayuda a otros viajeros y al capitán a mejorar la experiencia.</p>
            <div className="review-success__stars">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} size={28} fill={s <= rating ? 'var(--color-accent-400)' : 'none'} stroke={s <= rating ? 'var(--color-accent-400)' : 'var(--text-tertiary)'} />
              ))}
            </div>
            <Link to="/" className="btn btn--accent btn--lg" style={{ marginTop: 'var(--space-6)' }}>
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="review-page">
      <div className="container container--narrow">
        <Link to="/" className="trip-detail__back">
          <ArrowLeft size={18} /> Volver
        </Link>

        <div className="review-card glass animate-fade-in">
          <div className="review-card__header">
            <Sailboat size={32} style={{ color: 'var(--color-accent-400)' }} />
            <h1>¿Cómo fue tu experiencia?</h1>
            <p className="review-card__trip-name">{trip.title}</p>
            <p className="review-card__trip-location">{trip.location}</p>
          </div>

          {existingReview && (
            <div className="review-card__existing">
              Ya dejaste una reseña. Podés actualizarla:
            </div>
          )}

          {/* Star Rating */}
          <div className="review-stars">
            <p className="review-stars__label">Tu calificación</p>
            <div className="review-stars__row">
              {[1, 2, 3, 4, 5].map(s => (
                <button
                  key={s}
                  className="review-stars__btn"
                  onClick={() => setRating(s)}
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                >
                  <Star
                    size={36}
                    fill={(hoverRating || rating) >= s ? 'var(--color-accent-400)' : 'none'}
                    stroke={(hoverRating || rating) >= s ? 'var(--color-accent-400)' : 'var(--text-tertiary)'}
                  />
                </button>
              ))}
            </div>
            <p className="review-stars__text">
              {rating === 1 && 'No me gustó'}
              {rating === 2 && 'Podría mejorar'}
              {rating === 3 && 'Estuvo bien'}
              {rating === 4 && 'Muy buena'}
              {rating === 5 && '¡Increíble!'}
            </p>
          </div>

          {/* Comment */}
          <div className="input-group">
            <label>Contanos tu experiencia (opcional)</label>
            <textarea
              className="input"
              rows={4}
              placeholder="¿Qué es lo que más te gustó? ¿Qué mejorarías?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <button
            className="btn btn--accent btn--lg review-card__submit"
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
          >
            {submitting ? (
              <><Loader size={18} className="spin" /> Enviando...</>
            ) : (
              <><Send size={18} /> Enviar Calificación</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
