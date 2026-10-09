import './ProviderCTA.css'

function ProviderCTA() {
  return (
    <section id="list-property" className="provider">
      <div className="container provider-inner">
        <div>
          <p className="eyebrow">For landlords &amp; property owners</p>
          <h2>Have an accommodation to rent?</h2>
          <p className="provider-text">
            Reach students who are actively searching right now. List your rooms, flats or
            hostel spaces and let StudentNest bring serious inquiries to you — not the other way around.
          </p>
        </div>
        <a href="#provider-dashboard" className="btn btn-primary provider-btn">List Your Property</a>
      </div>
    </section>
  )
}

export default ProviderCTA
