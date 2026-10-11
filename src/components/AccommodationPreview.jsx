import { useEffect, useState } from 'react'
import AccommodationCard from './AccommodationCard.jsx'
import mockAccommodations from '../data/mockAccommodations.js'
import { apiFetch } from '../lib_api.js'
import { normaliseApiProperty } from '../lib_properties.js'
import './AccommodationPreview.css'

function AccommodationPreview() {
  const [accommodations, setAccommodations] = useState(mockAccommodations)
  const [showingSamples, setShowingSamples] = useState(true)
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    let cancelled = false

    apiFetch('/properties')
      .then((data) => {
        if (cancelled) return
        const liveListings = (data.properties || [])
          .slice(0, 4)
          .map(normaliseApiProperty)
        if (liveListings.length) {
          setAccommodations(liveListings)
          setShowingSamples(false)
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setApiError(error.message || 'Unable to load live listings.')
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section id="accommodation" className="acc-preview">
      <div className="container">
        <div className="acc-preview-header">
          <div>
            <p className="eyebrow" role={apiError ? 'status' : undefined}>
              {apiError
                ? `Live listings unavailable: ${apiError}. Showing samples.`
                : showingSamples
                  ? 'Currently showing sample listings'
                  : 'Verified student accommodation'}
            </p>
            <h2>Popular Student Accommodation</h2>
          </div>
          <a href="#accommodation" className="btn btn-outline-ink acc-preview-link">
            View all
          </a>
        </div>

        <div className="acc-preview-grid">
          {accommodations.map((accommodation) => (
            <AccommodationCard key={accommodation.id} accommodation={accommodation} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default AccommodationPreview
