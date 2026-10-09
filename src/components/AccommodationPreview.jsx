import AccommodationCard from './AccommodationCard.jsx'
import mockAccommodations from '../data/mockAccommodations.js'
import './AccommodationPreview.css'

function AccommodationPreview() {
  return (
    <section id="accommodation" className="acc-preview">
      <div className="container">
        <div className="acc-preview-header">
          <div>
            <p className="eyebrow">Currently showing sample listings</p>
            <h2>Popular Student Accommodation</h2>
          </div>
          <a href="#accommodation" className="btn btn-outline-ink acc-preview-link">
            View all
          </a>
        </div>

        <div className="acc-preview-grid">
          {mockAccommodations.map((accommodation) => (
            <AccommodationCard key={accommodation.id} accommodation={accommodation} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default AccommodationPreview
