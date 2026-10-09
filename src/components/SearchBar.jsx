import { useState } from 'react'
import './SearchBar.css'




function SearchBar() {
  const [location, setLocation] = useState('')
  const [type, setType] = useState('')
  const [budget, setBudget] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
  }

  return (
    <form className="searchbar" onSubmit={handleSubmit}>
      <div className="searchbar-field">
        <label htmlFor="location">
          <span className="searchbar-icon" aria-hidden="true">📍</span> Where?
        </label>
        <select id="location" value={location} onChange={(e) => setLocation(e.target.value)}>
          <option value="">Bauchi / ATBU / Yelwa…</option>
          <option value="yelwa">Yelwa</option>
          <option value="gwallameji">Gwallameji</option>
          <option value="dan-iya">Dan Iya</option>
          <option value="miri-road">Miri Road</option>
        </select>
      </div>

      <div className="searchbar-divider" aria-hidden="true" />

      <div className="searchbar-field">
        <label htmlFor="type">
          <span className="searchbar-icon" aria-hidden="true">🏠</span> What are you looking for?
        </label>
        <select id="type" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Self-contained / Room & parlour / Shared…</option>
          <option value="self-contain">Self-contained</option>
          <option value="room-parlour">Room & parlour</option>
          <option value="shared">Shared room</option>
          <option value="hostel">Hostel bedspace</option>
        </select>
      </div>

      <div className="searchbar-divider" aria-hidden="true" />

      <div className="searchbar-field">
        <label htmlFor="budget">
          <span className="searchbar-icon" aria-hidden="true">💰</span> Budget
        </label>
        <select id="budget" value={budget} onChange={(e) => setBudget(e.target.value)}>
          <option value="">Choose a price range</option>
          <option value="100000-200000">₦100,000 – ₦200,000</option>
          <option value="200000-300000">₦200,000 – ₦300,000</option>
          <option value="300000-400000">₦300,000 – ₦400,000</option>
          <option value="400000-500000">₦400,000 – ₦500,000</option>
          <option value="500000+">₦500,000+</option>
        </select>
      </div>

      <button type="submit" className="btn btn-primary searchbar-submit">
        Search
      </button>
    </form>
  )
}

export default SearchBar
