import './FeatureSection.css'

const FEATURES = [
  {
    title: 'Verified Listings',
    description: 'Every listing is checked before it goes up, so what you see is what actually exists.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    ),
  },
  {
    title: 'Save Time',
    description: "Compare rooms across Bauchi from your phone — no more visiting five houses in the sun.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Transparent Information',
    description: 'Real prices, real photos, and clear terms — before you ever contact the provider.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M8 9h8M8 13h8M8 17h5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Find Suitable Roommates',
    description: 'Match with other students looking to split rent and share a place near campus.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="9" cy="9" r="3" />
        <circle cx="17" cy="10" r="2.4" />
        <path d="M3.5 19c.7-3 3-4.6 5.5-4.6s4.8 1.6 5.5 4.6M14.8 14.8c2.1.2 3.7 1.6 4.2 3.9" strokeLinecap="round" />
      </svg>
    ),
  },
]

function FeatureSection() {
  return (
    <section className="features">
      <div className="container">
        <p className="eyebrow">Why StudentNest</p>
        <h2 className="features-heading">Built for students who can't afford a bad search.</h2>

        <div className="features-grid">
          {FEATURES.map((feature) => (
            <div className="feature-card" key={feature.title}>
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeatureSection
