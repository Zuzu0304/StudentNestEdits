import { useEffect, useState } from 'react'
import { apiFetch, getToken, mediaUrl } from '../lib_api.js'
import { getStoredUser } from '../lib_auth.js'
import './AccommodationDetails.css'

function AccommodationDetails({ id }) {
  const [accommodation, setAccommodation] = useState(null)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [propertyError, setPropertyError] = useState('')
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setPropertyError('')
    setAccommodation(null)
    apiFetch(`/properties/${id}`)
      .then((data) => {
        if (cancelled) return
        const p = data.property
        if (!p) throw new Error('Property was not found.')
        const images = Array.isArray(p.images)
          ? p.images
              .map((image) => typeof image === 'string' ? { url: image, type: 'image' } : image)
              .filter((image) => image?.url)
          : []
        setAccommodation({
          providerId: p.provider_id,
          providerName: p.provider_name || 'Accommodation provider',
          id: p.id,
          name: p.title,
          location: [p.area, p.city].filter(Boolean).join(', '),
          area: p.area,
          price: `₦${Number(p.rent || 0).toLocaleString()} / year`,
          numericPrice: Number(p.rent || 0),
          serviceCharge: Number(p.service_charge || 0),
          agentFee: Number(p.agent_fee || 0),
          securityDeposit: Number(p.security_deposit || 0),
          totalCost: Number(p.total_cost || 0),
          type: String(p.property_type || '').replace(/-/g, ' '),
          rooms: Number(p.bedrooms || 1),
          availability: ({ available: 'Available now', reserved: 'Reserved', occupied: 'Occupied', unavailable: 'Unavailable' })[p.availability_status] || 'Unavailable',
          facilities: Array.isArray(p.amenities) ? p.amenities : [],
          verified: Boolean(p.is_verified),
          rating: Number(p.rating || 0),
          reviews: Number(p.review_count || 0),
          image: images.find((image) => image.type !== 'video')?.url || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=85',
          images,
          description: p.description || '',
        })
      })
      .catch((error) => {
        if (!cancelled) setPropertyError(error.message || 'Unable to load this property.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [id])
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false)
  const [showViewingForm, setShowViewingForm] = useState(false)
  const [viewingRequest, setViewingRequest] = useState({
    message: '',
    preferred_viewing_date: '',
    preferred_viewing_time: '',
  })
  const [viewingNotice, setViewingNotice] = useState('')
  const [sendingViewingRequest, setSendingViewingRequest] = useState(false)
  const [reviewsData,setReviewsData]=useState({reviews:[],summary:{count:0,average:null}})
  const [eligibleBooking,setEligibleBooking]=useState(null)
  const [reviewForm,setReviewForm]=useState({rating:0,title:'',comment:''})
  const [reviewNotice,setReviewNotice]=useState('')
  const loadReviews=()=>apiFetch(`/reviews/property/${id}`).then(d=>setReviewsData({reviews:d.reviews||[],summary:d.summary||{count:0,average:null}})).catch(()=>{})
  useEffect(()=>{ loadReviews() },[id])
  useEffect(() => {
    let cancelled = false
    const syncFavourite = async () => {
      if (!getToken() || getStoredUser()?.role !== 'student') {
        setSaved(false)
        return
      }
      try {
        const data = await apiFetch('/student/favourites')
        if (!cancelled) {
          setSaved((data.favourites || []).some((property) => String(property.id) === String(id)))
        }
      } catch (error) {
        if (!cancelled) console.error('Unable to load saved properties:', error)
      }
    }
    syncFavourite()
    window.addEventListener('studentnest-auth', syncFavourite)
    return () => {
      cancelled = true
      window.removeEventListener('studentnest-auth', syncFavourite)
    }
  }, [id])
  useEffect(()=>{
    if(getStoredUser()?.role !== 'student') return
    apiFetch('/reviews/mine').then(d=>{
      const match=(d.bookings||[]).find(b=>String(b.property_id)===String(id)&&!b.already_reviewed)
      setEligibleBooking(match||null)
    }).catch(()=>{})
  },[id])
  const submitReview=async(e)=>{
    e.preventDefault()
    if(!reviewForm.rating){ setReviewNotice('Choose a star rating first.'); return }
    try{
      const d=await apiFetch('/reviews',{method:'POST',body:JSON.stringify({property_id:eligibleBooking.property_id,booking_id:eligibleBooking.booking_id,rating:reviewForm.rating,title:reviewForm.title,comment:reviewForm.comment})})
      setReviewNotice(d.message)
      setEligibleBooking(null)
      await loadReviews()
    }catch(e){ setReviewNotice(e.message) }
  }
  const toggleSaved = async () => {
    if (getStoredUser()?.role !== 'student') {
      if (!getToken()) window.location.hash = 'login'
      else alert('Only student accounts can save properties.')
      return
    }
    try {
      if (saved) await apiFetch(`/student/favourites/${id}`, { method: 'DELETE' })
      else await apiFetch(`/student/favourites/${id}`, { method: 'POST' })
      setSaved((value) => !value)
      window.dispatchEvent(new Event('studentnest-favourites'))
    } catch (error) {
      alert(error.message)
    }
  }
  const submitViewingRequest = async (event) => {
    event.preventDefault()
    if (getStoredUser()?.role !== 'student') {
      if (!getToken()) window.location.hash = 'login'
      else alert('Only student accounts can request property viewings.')
      return
    }
    setSendingViewingRequest(true)
    setViewingNotice('')
    try {
      const result = await apiFetch('/student/inquiries', {
        method: 'POST',
        body: JSON.stringify({
          property_id: Number(accommodation.id),
          ...viewingRequest,
        }),
      })
      setViewingNotice(result.message || 'Viewing request sent to the provider.')
      setViewingRequest({
        message: '',
        preferred_viewing_date: '',
        preferred_viewing_time: '',
      })
      setShowViewingForm(false)
    } catch (error) {
      setViewingNotice(error.message)
    } finally {
      setSendingViewingRequest(false)
    }
  }
  const messageProvider = async () => { if(!getToken()){window.location.hash='login';return} try { const d=await apiFetch('/messages/conversations',{method:'POST',body:JSON.stringify({other_user_id:Number(accommodation.providerId),property_id:Number(accommodation.id),context_key:'property'})}); localStorage.setItem('studentnest_open_chat',JSON.stringify({conversationId:d.conversation?.id||null,otherUserId:Number(accommodation.providerId),propertyId:Number(accommodation.id)})); localStorage.setItem('studentnest_last_chat_context','property'); window.location.hash='student-dashboard'; } catch(e){ alert(e.message) } }

  const toMediaUrl = mediaUrl
  const gallery = accommodation?.images?.length
    ? accommodation.images
    : accommodation ? [{ url: accommodation.image, type: 'image' }] : []

  
  
  
  
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  
  
  useEffect(() => {
    if (!lightboxOpen) return

    function handleKeyDown(event) {
      if (event.key === 'Escape') setLightboxOpen(false)
      if (event.key === 'ArrowRight') setActiveIndex((i) => (i + 1) % gallery.length)
      if (event.key === 'ArrowLeft') setActiveIndex((i) => (i - 1 + gallery.length) % gallery.length)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxOpen, gallery.length])

  if (loading) {
    return <main className="details-page container"><p role="status">Loading live property details…</p></main>
  }
  if (propertyError || !accommodation) {
    return (
      <main className="details-page container">
        <section className="details-section" role="alert">
          <h1>Property unavailable</h1>
          <p>{propertyError || 'This property could not be found.'}</p>
          <a href="#accommodation" className="btn btn-outline-ink">Back to accommodations</a>
        </section>
      </main>
    )
  }

  const amenities = [...new Set([...accommodation.facilities, 'Good road access', 'Student-friendly location'])]

  return (
    <main className="details-page">
      <section className="details-hero container">
        <a href="#accommodation" className="details-back">← Back to accommodations</a>

        <div className="details-gallery">
          <button
            type="button"
            className="details-main-image"
            onClick={() => setLightboxOpen(true)}
            aria-label="View full-size photo"
          >
            {gallery[activeIndex]?.type==='video'?<video src={toMediaUrl(gallery[activeIndex].url)} controls playsInline />:<img src={toMediaUrl(gallery[activeIndex]?.url)} alt={accommodation.name} />}
            {accommodation.verified && <span className="details-verified">✓ Verified listing</span>}
            <span className="details-photo-count">
              🖼 {activeIndex + 1} / {gallery.length} · View all photos
            </span>
          </button>

          <div className="details-side-images">
            {gallery.map((image, index) => (
              <button
                type="button"
                key={`${image.url}-${index}`}
                className={`details-thumb ${index === activeIndex ? 'is-active' : ''}`}
                onClick={() => setActiveIndex(index)}
                aria-label={`Show photo ${index + 1} of ${gallery.length}`}
                aria-current={index === activeIndex}
              >
                {image.type==='video'?<video src={toMediaUrl(image.url)} muted playsInline />:<img src={toMediaUrl(image.url)} alt="" />}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="details-content container">
        <div className="details-main-column">
          <div className="details-title-row">
            <div>
              <p className="eyebrow">{accommodation.type}</p>
              <h1>{accommodation.name}</h1>
              <p className="details-location">⌖ {accommodation.location}</p><p className="details-provider-line">{accommodation.providerId ? <>Listed by <a href={`#provider-${accommodation.providerId}`}>{accommodation.providerName}</a></> : 'Sample listing · provider profile unavailable'}</p>
            </div>
            <button
              className={`details-save ${saved ? 'is-saved' : ''}`}
              onClick={toggleSaved}
              aria-label="Save accommodation"
            >
              {saved ? '♥ Saved' : '♡ Save'}
            </button>
          </div>

          <div className="details-stat-row">
            <span>★ {accommodation.rating} <small>({accommodation.reviews} reviews)</small></span>
            <span>•</span>
            <span>{accommodation.rooms} room{accommodation.rooms > 1 ? 's' : ''}</span>
            <span>•</span>
            <span className={accommodation.availability === 'Available now' ? 'available' : accommodation.availability === 'Reserved' ? 'reserved' : accommodation.availability === 'Occupied' ? 'occupied' : ''}>{accommodation.availability}</span>
          </div>

          <section className="details-section">
            <h2>About this accommodation</h2>
            <p>
              {accommodation.description || `${accommodation.name} is a student-friendly accommodation in ${accommodation.area}, designed for students who want a convenient place to live close to school and everyday essentials.`} Review the facilities below and message the listing provider to confirm availability before making any payment.
            </p>
          </section>

          <section className="details-section">
            <h2>What this place offers</h2>
            <div className="amenities-grid">
              {amenities.map((amenity) => (
                <div className="amenity" key={amenity}>
                  <span className="amenity-icon">✓</span>
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="details-section trust-section">
            <div>
              <span className="trust-icon">✓</span>
              <div>
                <h3>{accommodation.verified ? 'Verified by StudentNest' : 'Listing information provided by host'}</h3>
                <p>{accommodation.verified ? 'This listing has passed StudentNest verification checks.' : 'Always confirm the property and terms before making payment.'}</p>
              </div>
            </div>
          </section>

          <section className="details-section review-preview">
            <div className="section-heading-row">
              <h2>Student reviews</h2>
              <span>★ {reviewsData.summary.average ?? '—'} · {reviewsData.summary.count} reviews</span>
            </div>
            {reviewsData.reviews.length ? reviewsData.reviews.slice(0,3).map(r=><div className="review-card" key={r.id}><div className="review-avatar">{(r.student_name||'S').charAt(0).toUpperCase()}</div><div><strong>{r.student_name||'Student'}</strong><div>★ {r.rating}/5 {r.title&&<span> · {r.title}</span>}</div><p>{r.comment||'No written comment.'}</p><small>{new Date(r.created_at).toLocaleDateString()}</small></div></div>) : <div className="review-card"><div className="review-avatar">★</div><div><strong>No published reviews yet</strong><p>Be the first eligible student to share an experience after booking this property.</p></div></div>}

            {eligibleBooking && (
              <form className="review-write-card" onSubmit={submitReview}>
                <h3>You booked this property — share your experience</h3>
                <div className="star-picker" aria-label="Rating">
                  {[1,2,3,4,5].map(n => (
                    <button
                      type="button"
                      key={n}
                      className={reviewForm.rating >= n ? 'selected' : ''}
                      onClick={() => setReviewForm(v => ({ ...v, rating: n }))}
                      aria-label={`${n} star${n > 1 ? 's' : ''}`}
                    >★</button>
                  ))}
                </div>
                <input
                  placeholder="Review title (optional)"
                  value={reviewForm.title}
                  onChange={e => setReviewForm(v => ({ ...v, title: e.target.value }))}
                />
                <textarea
                  rows="4"
                  placeholder="Tell other students what you liked or what they should know…"
                  value={reviewForm.comment}
                  onChange={e => setReviewForm(v => ({ ...v, comment: e.target.value }))}
                />
                {reviewNotice && <p className="review-write-notice">{reviewNotice}</p>}
                <button type="submit" className="btn btn-primary">Submit review</button>
              </form>
            )}
            {!eligibleBooking && reviewNotice && <p className="review-write-notice">{reviewNotice}</p>}
          </section>
        </div>

        <aside className="details-booking-card">
          <p className="details-card-label">Starting from</p>
          <div className="details-price">{accommodation.price}</div>
          
          {accommodation.providerId && (
            <>
              <a className="btn btn-outline-ink details-contact" href={`#provider-${accommodation.providerId}`}>
                View provider profile
              </a>
              <button className="btn btn-primary details-contact" onClick={messageProvider}>
                Message provider
              </button>
              <button
                className="btn btn-outline-ink details-contact"
                onClick={() => {
                  if (getStoredUser()?.role !== 'student') {
                    if (!getToken()) window.location.hash = 'login'
                    else setViewingNotice('Only student accounts can request property viewings.')
                    return
                  }
                  setShowViewingForm((open) => !open)
                  setViewingNotice('')
                }}
              >
                Request a viewing
              </button>
            </>
          )}
          {viewingNotice && <p className="review-write-notice" role="status">{viewingNotice}</p>}
          {showViewingForm && (
            <form className="review-write-card" onSubmit={submitViewingRequest}>
              <h3>Request a property viewing</h3>
              <label>
                Message to provider
                <textarea
                  rows="3"
                  value={viewingRequest.message}
                  onChange={(event) => setViewingRequest((current) => ({ ...current, message: event.target.value }))}
                  required
                  maxLength={2000}
                />
              </label>
              <label>
                Preferred date
                <input
                  type="date"
                  value={viewingRequest.preferred_viewing_date}
                  onChange={(event) => setViewingRequest((current) => ({ ...current, preferred_viewing_date: event.target.value }))}
                />
              </label>
              <label>
                Preferred time
                <input
                  type="time"
                  value={viewingRequest.preferred_viewing_time}
                  onChange={(event) => setViewingRequest((current) => ({ ...current, preferred_viewing_time: event.target.value }))}
                />
              </label>
              <button type="submit" className="btn btn-primary" disabled={sendingViewingRequest}>
                {sendingViewingRequest ? 'Sending…' : 'Send viewing request'}
              </button>
            </form>
          )}
          <button className="btn btn-outline-ink details-contact" onClick={() => setShowPriceBreakdown(true)}>View total price</button>
          <p className="details-safety">🛡 Payments are protected through StudentNest after the provider approves payment eligibility.</p>
        </aside>
      </section>

      {lightboxOpen && (
        <div className="lightbox-backdrop" onClick={() => setLightboxOpen(false)}>
          <button className="lightbox-close" onClick={() => setLightboxOpen(false)} aria-label="Close">×</button>

          <button
            className="lightbox-nav lightbox-prev"
            aria-label="Previous photo"
            onClick={(e) => {
              e.stopPropagation()
              setActiveIndex((i) => (i - 1 + gallery.length) % gallery.length)
            }}
          >
            ‹
          </button>

          {gallery[activeIndex]?.type==='video' ? <video
            src={toMediaUrl(gallery[activeIndex]?.url)}
            controls playsInline
            className="lightbox-image"
            onClick={(e) => e.stopPropagation()}
          /> : <img
            src={toMediaUrl(gallery[activeIndex]?.url)}
            alt={`${accommodation.name} photo ${activeIndex + 1}`}
            className="lightbox-image"
            onClick={(e) => e.stopPropagation()}
          />}

          <button
            className="lightbox-nav lightbox-next"
            aria-label="Next photo"
            onClick={(e) => {
              e.stopPropagation()
              setActiveIndex((i) => (i + 1) % gallery.length)
            }}
          >
            ›
          </button>

          <span className="lightbox-count">{activeIndex + 1} / {gallery.length}</span>
        </div>
      )}

      {showPriceBreakdown && <PriceBreakdown accommodation={accommodation} onClose={()=>setShowPriceBreakdown(false)}/>}
    </main>
  )
}

function PriceBreakdown({accommodation,onClose}){
 const rows=[['Annual rent',accommodation.numericPrice],['Service charge',accommodation.serviceCharge],['Agent fee',accommodation.agentFee],['Security deposit',accommodation.securityDeposit]]
 const total=rows.reduce((sum,[,v])=>sum+Number(v||0),0)
 return <div className="details-modal-backdrop" onClick={onClose}><div className="details-modal price-breakdown-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={onClose}>×</button><p className="eyebrow">StudentNest · Cost breakdown</p><h2>{accommodation.name}</h2><p>Here is the full amount currently listed by the provider before you make a payment.</p><div className="price-breakdown-list">{rows.map(([label,value])=><div key={label}><span>{label}</span><strong>₦{Number(value||0).toLocaleString('en-NG')}</strong></div>)}<div className="price-breakdown-total"><span>Total acquisition cost</span><strong>₦{total.toLocaleString('en-NG')}</strong></div></div><button className="btn btn-primary" onClick={onClose}>Done</button></div></div>
}





export default AccommodationDetails
