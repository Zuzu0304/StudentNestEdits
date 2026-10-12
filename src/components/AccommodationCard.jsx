import { useEffect, useState } from 'react'
import { apiFetch, getToken } from '../lib_api.js'
import { getStoredUser } from '../lib_auth.js'
import './AccommodationCard.css'

function AccommodationCard({ accommodation, showMeta = false }) {
  const { name, location, price, type, verified, image, rating, reviews, availability } = accommodation
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    const syncSaved = async () => {
      if (!getToken() || getStoredUser()?.role !== 'student') {
        setSaved(false)
        return
      }
      try {
        const data = await apiFetch('/student/favourites')
        if (!cancelled) {
          setSaved((data.favourites || []).some((property) => String(property.id) === String(accommodation.id)))
        }
      } catch (error) {
        if (!cancelled) console.error('Unable to load saved properties:', error)
      }
    }
    syncSaved()
    window.addEventListener('studentnest-auth', syncSaved)
    window.addEventListener('studentnest-favourites', syncSaved)
    return () => {
      cancelled = true
      window.removeEventListener('studentnest-auth', syncSaved)
      window.removeEventListener('studentnest-favourites', syncSaved)
    }
  }, [accommodation.id])

  const toggle = async (event) => {
    event.preventDefault()
    if (getStoredUser()?.role !== 'student') {
      if (!getToken()) window.location.hash = 'login'
      else alert('Only student accounts can save properties.')
      return
    }
    setBusy(true)
    try {
      if (saved) {
        await apiFetch(`/student/favourites/${accommodation.id}`, { method: 'DELETE' })
      } else {
        await apiFetch(`/student/favourites/${accommodation.id}`, { method: 'POST' })
      }
      setSaved(!saved)
      window.dispatchEvent(new Event('studentnest-favourites'))
    } catch (error) {
      alert(error.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className="acc-card">
      <div className="acc-card-image">
        <img src={image} alt={name} />
        {verified && <span className="acc-card-badge">✓ Verified</span>}
        <button
          disabled={busy}
          className={`acc-card-favourite ${saved ? 'is-saved' : ''}`}
          onClick={toggle}
          aria-label={`${saved ? 'Remove' : 'Save'} ${name}`}
        >
          {saved ? '♥' : '♡'}
        </button>
      </div>
      <div className="acc-card-body">
        <div className="acc-card-top">
          <h3>{name}</h3>
          <span className="acc-card-price">{price}</span>
        </div>
        <p className="acc-card-location">⌖ {location}</p>
        <div className="acc-card-tags">
          <span className="acc-card-type">{type}</span>
          {showMeta && (
            <span className={`acc-card-availability ${availability === 'Available now' ? 'is-available' : availability === 'Reserved' ? 'is-reserved' : availability === 'Occupied' ? 'is-occupied' : ''}`}>
              {availability}
            </span>
          )}
        </div>
        {showMeta && (
          <div className="acc-card-rating">
            <span>★ {rating}</span>
            <span>{reviews} reviews</span>
          </div>
        )}
        <a href={`#accommodation-${accommodation.id}`} className="btn btn-outline-ink acc-card-cta">
          View Details
        </a>
      </div>
    </article>
  )
}

export default AccommodationCard
