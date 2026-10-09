import SearchBar from './SearchBar.jsx'
import './Hero.css'

function Hero() {
  return (
    <section id="home" className="hero">
      <div className="container hero-inner">
        <div className="hero-copy">
          <p className="eyebrow">Student accommodation · Bauchi</p>
          <h1 className="hero-headline">
            Find a place that feels like <span>home.</span>
          </h1>
          <p className="hero-subtext">
            Discover verified student accommodation around Bauchi without wasting
            days searching.
          </p>

          <div className="hero-actions">
            <a href="#accommodation" className="btn btn-primary">Find Accommodation</a>
            <a href="#list-property" className="btn btn-secondary hero-btn-dark">List an Accommodation</a>
          </div>

          <div className="hero-search">
            <SearchBar />
          </div>

          {}
          <div className="hero-stat">
            <div className="hero-stat-avatars" aria-hidden="true">
              <img
                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=80&q=80"
                alt=""
              />
              <img
                src="https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=crop&w=80&q=80"
                alt=""
              />
              <img
                src="https://images.unsplash.com/photo-1531891437562-4301cf35b7e4?auto=format&fit=crop&w=80&q=80"
                alt=""
              />
            </div>
            <p className="hero-stat-text">
              <strong>1,240+ students</strong> have found accommodation through us
            </p>
          </div>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="hero-photo hero-photo-a">
            <img
              src="https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=500&q=80"
              alt=""
            />
          </div>
          <div className="hero-photo hero-photo-b">
            <img
              src="https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=500&q=80"
              alt=""
            />
          </div>
          <div className="hero-stamp">
            <span>VERIFIED<br />LISTING</span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
