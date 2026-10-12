import { useEffect, useMemo, useState } from 'react'
import AccommodationCard from './AccommodationCard.jsx'
import { apiFetch } from '../lib_api.js'
import { normaliseApiProperty } from '../lib_properties.js'
import './Accommodation.css'

const INITIAL_FILTERS = {
  search: '',
  location: 'Any location',
  type: 'Any type',
  priceRange: 'Any price',
  rooms: 'Any rooms',
  availability: 'Any availability',
  facility: 'Any facility',
  sort: 'Recommended',
}

function Accommodation() {
  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const [showMoreFilters, setShowMoreFilters] = useState(false)
  const [accommodations, setAccommodations] = useState([])
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(() => {
      const params = new URLSearchParams()
      if (filters.search.trim()) params.set('q', filters.search.trim())
      if (filters.location !== 'Any location') params.set('area', filters.location)
      if (filters.type !== 'Any type') params.set('property_type', filters.type)
      if (filters.rooms !== 'Any rooms') params.set('bedrooms', filters.rooms)
      if (filters.priceRange !== 'Any price') {
        const [min, max] = String(filters.priceRange).split('-')
        if (min) params.set('min_rent', min.replace('+', ''))
        if (max) params.set('max_rent', max)
      }
      const query = params.toString()
    setLoading(true)
    apiFetch(`/properties${query ? `?${query}` : ''}`)
      .then((data) => {
        if (cancelled) return
        const items = (data.properties || []).map(normaliseApiProperty)
        setAccommodations(items)
        setApiError('')
      })
      .catch((error) => {
        if (!cancelled) {
          setAccommodations([])
          setApiError(error.message || 'Unable to load live listings.')
        }
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [filters.search, filters.location, filters.type, filters.priceRange, filters.rooms])

  const filteredAccommodations = useMemo(() => {
    const source = accommodations
    const results = source.filter((item) => {
      const availabilityMatch = filters.availability === 'Any availability' || item.availability === filters.availability
      const facilityMatch = filters.facility === 'Any facility' || item.facilities.includes(filters.facility)

      return availabilityMatch && facilityMatch
    })

    return [...results].sort((a, b) => {
      if (filters.sort === 'Price: Low to High') return a.numericPrice - b.numericPrice
      if (filters.sort === 'Price: High to Low') return b.numericPrice - a.numericPrice
      if (filters.sort === 'Newest') return b.id - a.id
      return Number(b.verified) - Number(a.verified)
    })
  }, [filters, accommodations])

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }))
  const clearFilters = () => setFilters(INITIAL_FILTERS)

  return (
    <main className="accommodation-page">
      <section className="accommodation-hero">
        <div className="container">
          <p className="eyebrow">StudentNest · Bauchi</p>
          <h1>Find a student home that works for you.</h1>
          <p className="accommodation-intro">
            Browse accommodation options around Bauchi and narrow your search by location, price, type and the things that matter to you.
          </p>

          <div className="accommodation-search-shell">
            <label className="accommodation-search">
              <span className="search-icon">⌕</span>
              <input
                type="search"
                value={filters.search}
                onChange={(event) => updateFilter('search', event.target.value)}
                placeholder="Search by accommodation, area or neighbourhood..."
                aria-label="Search accommodation"
              />
            </label>

            <div className="accommodation-filter-row">
              <select value={filters.location} onChange={(event) => updateFilter('location', event.target.value)} aria-label="Location">
                <option value="Any location">Choose a location</option>
                <option>Yelwa</option>
                <option>Gwallameji</option>
                <option>Miri</option>
                <option>Dan Iya</option>
              </select>
              <select value={filters.type} onChange={(event) => updateFilter('type', event.target.value)} aria-label="Accommodation type">
                <option value="Any type">Choose property type</option>
                <option value="self-contain">Self-contain</option>
                <option value="single-room">Single room</option>
                <option value="room-and-parlour">Room and parlour</option>
                <option value="flat">Flat</option>
                <option value="hostel">Hostel</option>
                <option value="duplex">Duplex</option>
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
              </select>
              <select value={filters.priceRange} onChange={(event) => updateFilter('priceRange', event.target.value)} aria-label="Maximum price">
                <option value="Any price">Choose a price range</option>
                <option value="100000-200000">₦100,000 – ₦200,000</option>
                <option value="200000-300000">₦200,000 – ₦300,000</option>
                <option value="300000-400000">₦300,000 – ₦400,000</option>
                <option value="400000-500000">₦400,000 – ₦500,000</option>
                <option value="500000+">₦500,000+</option>
              </select>
              <button className="btn btn-outline-ink filter-toggle" onClick={() => setShowMoreFilters((open) => !open)}>
                {showMoreFilters ? 'Hide filters' : 'More filters'}
              </button>
            </div>

            {showMoreFilters && (
              <div className="advanced-filters">
                <select value={filters.rooms} onChange={(event) => updateFilter('rooms', event.target.value)} aria-label="Rooms">
                  <option value="Any rooms">Choose number of rooms</option>
                  <option value="1">1 room</option>
                  <option value="2">2 rooms</option>
                </select>
                <select value={filters.availability} onChange={(event) => updateFilter('availability', event.target.value)} aria-label="Availability">
                  <option value="Any availability">Choose availability</option>
                  <option>Available now</option>
                  <option>Reserved</option>
                  <option>Occupied</option>
                  
                </select>
                <select value={filters.facility} onChange={(event) => updateFilter('facility', event.target.value)} aria-label="Facility">
                  <option value="Any facility">Choose a facility</option>
                  <option>Water</option>
                  <option>Electricity</option>
                  <option>Furnished</option>
                  <option>Security</option>
                </select>
                <button className="clear-filter" onClick={clearFilters}>Clear all</button>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="accommodation-results">
        <div className="container">
          <div className="results-header">
            <div>
              <p className="eyebrow">Browse listings</p>
              <h2>{filteredAccommodations.length} {filteredAccommodations.length === 1 ? 'home' : 'homes'} available</h2>
            </div>
            <label className="sort-control">
              <span>Sort by</span>
              <select value={filters.sort} onChange={(event) => updateFilter('sort', event.target.value)}>
                <option>Recommended</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Newest</option>
              </select>
            </label>
          </div>

          {loading ? (
            <div className="empty-results"><div className="empty-results-icon">⌂</div><h3>Loading verified homes…</h3><p>StudentNest is checking the live accommodation listings.</p></div>
          ) : filteredAccommodations.length > 0 ? (
            <div className="accommodation-grid">
              {filteredAccommodations.map((accommodation) => (
                <AccommodationCard key={accommodation.id} accommodation={accommodation} showMeta />
              ))}
            </div>
          ) : (
            <div className="empty-results">
              <div className="empty-results-icon">⌂</div>
              <h3>{apiError ? 'Live listings are unavailable.' : 'No homes match those filters.'}</h3>
              <p>{apiError ? `StudentNest could not load accommodation from the API: ${apiError}` : accommodations.length ? 'Try widening your location or price range, or clear the filters.' : 'No approved, verified properties are currently listed. Check back later.'}</p>
              <button className="btn btn-primary" onClick={clearFilters}>Show all homes</button>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

export default Accommodation
