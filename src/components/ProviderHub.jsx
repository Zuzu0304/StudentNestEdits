import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { apiFetch, mediaUrl } from '../lib_api.js'
import { getStoredUser } from '../lib_auth.js'
import ChatCenter from './ChatCenter.jsx'
import './ProviderHub.css'

const EMPTY = {
  title: '',
  description: '',
  address: '',
  area: 'Yelwa',
  city: 'Bauchi',
  state: 'Bauchi',
  property_type: 'self-contain',
  property_subtype: '',
  rent: '',
  service_charge: '',
  agent_fee: '',
  security_deposit: '',
  bedrooms: '1',
  bathrooms: '1',
  amenities: [],
  media: [],
}

const AMENITIES = [
  'Water',
  'Electricity',
  'Security',
  'Prepaid meter',
  'Borehole',
  'Parking',
  'Furnished',
  'Wardrobe',
  'Kitchen',
  'Private toilet',
  'Private bathroom',
  'Internet/Wi-Fi',
  'Good network',
  'Tiled floor',
  'POP ceiling',
  'Fence',
  '24/7 access',
  'Generator',
  'Solar power',
  'Air conditioning',
]

const money = (n) =>
  `₦${Number(n || 0).toLocaleString('en-NG')}`

export default function ProviderHub() {
  const [tab, setTab] = useState('overview')
  const [properties, setProperties] = useState([])
  const [bookings, setBookings] = useState([])
  const [inquiries, setInquiries] = useState([])
  const [account, setAccount] = useState(null)
  const [payments, setPayments] = useState([])
  const [unreadMessages, setUnreadMessages] = useState(0)

  const [form, setForm] = useState(EMPTY)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)

  const flash = (message) => {
    setNotice(message)

    setTimeout(() => {
      setNotice('')
    }, 3500)
  }

  const load = useCallback(
    async ({ showLoading = true, refreshAccount = true } = {}) => {
      if (showLoading) {
        setLoading(true)
      }

      try {
        const [propertiesData, bookingsData, inquiriesData, accountData, paymentsData] =
          await Promise.all([
            apiFetch('/properties/provider/mine'),
            apiFetch('/bookings/provider'),
            apiFetch('/student/provider/inquiries'),
            apiFetch('/payments/provider/bank-account'),
            apiFetch('/payments/mine'),
          ])

        setProperties(propertiesData.properties || [])
        setBookings(bookingsData.bookings || [])
        setInquiries(inquiriesData.inquiries || [])
        setPayments(paymentsData.transactions || [])

        if (refreshAccount) {
          setAccount(accountData.bank_accounts?.[0] || null)
        }
      } catch (error) {
        flash(error.message)
      } finally {
        if (showLoading) {
          setLoading(false)
        }
      }
    },
    [],
  )

  useEffect(() => {
    load()

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        load({
          showLoading: false,
          refreshAccount: false,
        })
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [load])

  useEffect(() => {
    let cancelled=false
    const refreshUnread=async()=>{try{const d=await apiFetch('/notifications/unread-count');if(!cancelled)setUnreadMessages(Number(d.unread_count||0))}catch{if(!cancelled)setUnreadMessages(0)}}
    refreshUnread()
    const timer=setInterval(refreshUnread,8000)
    return()=>{cancelled=true;clearInterval(timer)}
  },[])

  const stats = useMemo(
    () => ({
      total: properties.length,

      pending: properties.filter(
        (property) => property.listing_status === 'pending',
      ).length,

      approved: properties.filter(
        (property) => property.listing_status === 'approved',
      ).length,

    }),
    [properties, bookings, inquiries],
  )

  const save = async (event) => {
    event.preventDefault()

    try {
      if (form.media.some((item) => item?.localId)) {
        throw new Error(
          'Please wait for all selected photos and videos to finish uploading.',
        )
      }

      const body = {
        ...form,

        rent: Number(form.rent),

        service_charge: Number(
          form.service_charge || 0,
        ),

        agent_fee: Number(
          form.agent_fee || 0,
        ),

        security_deposit: Number(
          form.security_deposit || 0,
        ),

        bedrooms: Number(
          form.bedrooms || 0,
        ),

        bathrooms: Number(
          form.bathrooms || 0,
        ),

        amenities: form.amenities,

        images: form.media,
      }

      const data = editing
        ? await apiFetch(`/properties/${editing}`, {
            method: 'PUT',
            body: JSON.stringify(body),
          })
        : await apiFetch('/properties', {
            method: 'POST',
            body: JSON.stringify(body),
          })

      flash(data.message || 'Property saved as draft.')

      setShowForm(false)
      setEditing(null)

      setForm({
        ...EMPTY,
        amenities: [],
        media: [],
      })

      await load()
    } catch (error) {
      flash(error.message)
    }
  }

  const edit = (property) => {
    if (!['draft', 'rejected'].includes(property.listing_status)) {
      flash('Only draft or rejected listings can be edited.')
      return
    }

    setEditing(property.id)

    setForm({
      ...EMPTY,
      ...property,

      amenities: Array.isArray(property.amenities)
        ? property.amenities
        : [],

      media: Array.isArray(property.images)
        ? property.images.map((media) =>
            typeof media === 'string'
              ? {
                  url: media,
                  type: 'image',
                }
              : media,
          )
        : [],
    })

    setShowForm(true)
    setTab('properties')
  }

  const submit = async (id) => {
    try {
      const data = await apiFetch(
        `/properties/${id}/submit`,
        {
          method: 'POST',
        },
      )

      flash(data.message)

      load()
    } catch (error) {
      flash(error.message)
    }
  }

  const respondBooking = async (
    id,
    decision,
  ) => {
    try {
      const data = await apiFetch(
        `/bookings/${id}/respond`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            decision,
          }),
        },
      )

      flash(data.message)

      load()
    } catch (error) {
      flash(error.message)
    }
  }

  const respondInquiry = async (
    inquiry,
    action,
    response,
    appointmentDate,
    appointmentTime,
  ) => {
    try {
      const data = await apiFetch(
        `/student/provider/inquiries/${inquiry.id}/respond`,
        {
          method: 'PATCH',

          body: JSON.stringify({
            action,
            response,
            appointment_date: appointmentDate,
            appointment_time: appointmentTime,
          }),
        },
      )

      flash(data.message)

      load()
    } catch (error) {
      flash(error.message)
    }
  }

  const saveBank = async (event) => {
    event.preventDefault()

    try {
      const data = await apiFetch(
        '/payments/provider/bank-account',
        {
          method: 'POST',
          body: JSON.stringify(account),
        },
      )

      flash(data.message)

      setAccount(data.account || account)
    } catch (error) {
      flash(error.message)
    }
  }

  return (
    <main className="provider-page">
      <div className="provider-shell">

        {/* HEADER */}
        <header className="provider-header">
          <div>
            <p className="eyebrow">
              StudentNest · Provider space
            </p>

            <h1>
              Manage your properties.
            </h1>

            <p>
              Everything you need to list accommodation
              and respond to students.
            </p>
          </div>

          <button
            className="provider-primary blue"
            onClick={() => {
              setEditing(null)
              setForm({
                ...EMPTY,
                amenities: [],
                media: [],
              })
              setShowForm(true)
              setTab('properties')
            }}
          >
            ＋ Add property
          </button>
        </header>

        {/* NOTICE */}
        {notice && (
          <div className="provider-notice">
            {notice}
          </div>
        )}

        {/* TABS */}
        <div className="provider-tabs">
          {[
            ['overview', 'Overview'],
            ['properties', 'My Properties'],
            ['messages', 'Messages'],
            ['payments', 'Payments'],
            ['payout', 'Payout details'],
          ].map(([value, label]) => (
            <button
              key={value}
              className={tab === value ? 'active' : ''}
              onClick={() => setTab(value)}
            >
              {label}{value === 'messages' && unreadMessages > 0 && <span className='provider-message-badge'>{unreadMessages > 99 ? '99+' : unreadMessages}</span>}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="provider-panel">
            Loading your provider space…
          </div>
        ) : (
          <>
            {tab === 'overview' && (
              <Overview
                stats={stats}
                properties={properties}
                bookings={bookings}
                inquiries={inquiries}
                onTab={setTab}
              />
            )}

            {tab === 'properties' && (
              <Properties
                properties={properties}
                onAdd={() => {
                  setEditing(null)
                  setForm({
                    ...EMPTY,
                    amenities: [],
                    media: [],
                  })
                  setShowForm(true)
                }}
                onEdit={edit}
                onSubmit={submit}
                onDelete={async (id) => {
                  try {
                    await apiFetch(
                      `/properties/${id}`,
                      {
                        method: 'DELETE',
                      },
                    )

                    flash(
                      'Property deleted.',
                    )

                    load()
                  } catch (error) {
                    flash(error.message)
                  }
                }}
              />
            )}

            {tab === 'messages' && <ChatCenter title='Provider messages'/>}

            {tab === 'payments' && (
              <Payments
                payments={payments}
              />
            )}

            {tab === 'payout' && (
              <Payout
                account={
                  account || {
                    account_name: '',
                    account_number: '',
                    bank_name: '',
                  }
                }
                setAccount={setAccount}
                onSave={saveBank}
              />
            )}
          </>
        )}
      </div>

      {/* PROPERTY MODAL */}
      {showForm && (
        <PropertyForm
          form={form}
          setForm={setForm}
          editing={!!editing}
          onClose={() => setShowForm(false)}
          onSubmit={save}
        />
      )}
    </main>
  )
}


/* =========================================================
   OVERVIEW
========================================================= */

function Overview({
  stats,
  properties,
  bookings,
  inquiries,
  onTab,
}) {
  const upcoming = bookings
    .filter(
      (booking) =>
        booking.appointment_date &&
        [
          'pending_student_confirmation',
          'approved',
          'payment_pending',
          'paid',
          'active',
        ].includes(booking.status),
    )
    .sort(
      (a, b) =>
        String(a.appointment_date).localeCompare(
          String(b.appointment_date),
        ) ||
        String(a.appointment_time || '').localeCompare(
          String(b.appointment_time || ''),
        ),
    )
    .slice(0, 3)

  return (
    <>
      <div className="provider-stats">
        <Stat
          label="Listings"
          value={stats.total}
        />

        <Stat
          label="Pending approval"
          value={stats.pending}
        />

        <Stat
          label="Published"
          value={stats.approved}
        />

        <Stat
          label="Needs attention"
          value={inquiries.length + bookings.filter(b=>b.status==='pending_provider').length}
        />
      </div>

      {upcoming.length > 0 && (
        <section className="provider-panel appointment-reminder">
          <div className="provider-panel-title">
            <div>
              <h2>
                Upcoming viewing appointments
              </h2>

              <p>
                Reminder: keep these times
                available for students.
              </p>
            </div>
          </div>

          {upcoming.map((booking) => (
            <div
              className="provider-row"
              key={`appointment-${booking.id}`}
            >
              <div>
                <strong>
                  {booking.property_title}
                </strong>

                <span>
                  {booking.student_name}
                  {' · '}
                  {String(
                    booking.appointment_date,
                  ).slice(0, 10)}
                  {' at '}
                  {String(
                    booking.appointment_time || '',
                  ).slice(0, 5)}
                </span>
              </div>

              <Status
                value={booking.status}
              />
            </div>
          ))}
        </section>
      )}

      <div className="provider-grid">

        {/* RECENT PROPERTIES */}
        <section className="provider-panel">
          <div className="provider-panel-title">
            <h2>
              Recent properties
            </h2>

            <button
              onClick={() =>
                onTab('properties')
              }
            >
              View all →
            </button>
          </div>

          {properties
            .slice(0, 4)
            .map((property) => (
              <div
                className="provider-row"
                key={property.id}
              >
                <div>
                  <strong>
                    {property.title}
                  </strong>

                  <span>
                    {property.area},{' '}
                    {property.city}
                  </span>
                </div>

                <Status
                  value={
                    property.listing_status
                  }
                />
              </div>
            ))}
        </section>

        <section className="provider-panel">
          <div className="provider-panel-title"><div><h2>Messages & activity</h2><p>Keep conversations, appointment proposals and payment approvals in Messages.</p></div><button onClick={()=>onTab('messages')}>Open messages →</button></div>
          <p className="panel-copy">{inquiries.length || bookings.length ? 'You have recent student activity. Open Messages to respond and manage appointments.' : 'No new activity yet.'}</p>
        </section>
      </div>
    </>
  )
}


/* =========================================================
   PROPERTIES
========================================================= */

function Properties({
  properties,
  onAdd,
  onEdit,
  onSubmit,
  onDelete,
}) {
  return (
    <section className="provider-panel">
      <div className="provider-panel-title">
        <div>
          <h2>
            My Properties
          </h2>

          <p>
            New listings start as drafts.
            Submit when the details and
            media are ready.
          </p>
        </div>

        <button
          className="provider-primary blue"
          onClick={onAdd}
        >
          ＋ Add property
        </button>
      </div>

      {properties.map((property) => (
        <article
          className="provider-property"
          key={property.id}
        >
          <div>
            <h3>
              {property.title}
            </h3>

            <p>
              {property.address}
              {' · '}
              {property.area},{' '}
              {property.city}
            </p>

            <strong>
              {money(property.rent)}
              {' / year'}
            </strong>

            <div className="provider-tags">
              <Status
                value={
                  property.listing_status
                }
              />

              {property.is_verified && (
                <span className="tag verified">
                  ✓ Verified
                </span>
              )}

              <span className="tag">
                {String(
                  property.verification_status ||
                    'not submitted',
                ).replace(/_/g, ' ')}
              </span>

              {property.availability_status ===
                'occupied' && (
                <span className="tag status-occupied">
                  Occupied
                </span>
              )}
            </div>
          </div>

          <div className="provider-actions">
            {['draft', 'rejected'].includes(property.listing_status) && (
              <button onClick={() => onEdit(property)}>
                Edit
              </button>
            )}

            {[
              'draft',
              'rejected',
            ].includes(
              property.listing_status,
            ) && (
              <button
                className="blue-outline"
                onClick={() =>
                  onSubmit(property.id)
                }
              >
                Submit for inspection
              </button>
            )}

            {[
              'draft',
              'rejected',
            ].includes(
              property.listing_status,
            ) && (
              <button
                className="danger"
                onClick={() =>
                  onDelete(property.id)
                }
              >
                Delete
              </button>
            )}
          </div>
        </article>
      ))}

      {!properties.length && (
        <p>
          No properties yet. Add your
          first listing.
        </p>
      )}
    </section>
  )
}


/* =========================================================
   PAYMENTS
========================================================= */

function Payments({ payments }) {
  const statusCopy = (t) => {
    if (['funds_protected', 'inspection_pending', 'confirmed'].includes(t.status)) {
      return {
        tone: 'pending',
        text: `${t.student_name} has paid for ${t.property_title}. Payment pending approval.`,
      }
    }
    if (t.status === 'released') {
      return {
        tone: 'success',
        text: `Payment for ${t.property_title} has been sent to your account.`,
      }
    }
    if (t.status === 'disputed') {
      return {
        tone: 'pending',
        text: `${t.student_name} raised a complaint about ${t.property_title}. Under StudentNest investigation.`,
      }
    }
    if (t.status === 'refunded') {
      return {
        tone: 'muted',
        text: `Payment for ${t.property_title} was refunded to the student.`,
      }
    }
    return {
      tone: 'muted',
      text: `${t.student_name} started a payment for ${t.property_title}.`,
    }
  }

  const visible = payments.filter((t) =>
    !['pending_payment', 'payment_processing'].includes(t.status),
  )

  return (
    <div className="provider-panel">
      <div className="provider-panel-title">
        <div>
          <h2>Payments from students</h2>
          <p>
            Every protected payment on your properties, and whether StudentNest
            has released it to you yet.
          </p>
        </div>
      </div>

      {!visible.length && (
        <p>No payments yet.</p>
      )}

      {visible.map((t) => {
        const copy = statusCopy(t)

        return (
          <article className={`provider-payment-row tone-${copy.tone}`} key={t.id}>
            <div>
              <strong>{t.student_name}</strong>
              {t.student_phone && <span> · {t.student_phone}</span>}
              <p>{copy.text}</p>
            </div>
            <div className="provider-payment-amount">
              <strong>{money(t.total_amount)}</strong>
              {t.status === 'released' && t.provider_payout_amount != null && (
                <span>
                  You received {money(t.provider_payout_amount)} after{' '}
                  {money(t.platform_commission_amount)} StudentNest commission
                </span>
              )}
              {['funds_protected', 'inspection_pending', 'confirmed'].includes(
                t.status,
              ) && <span>Awaiting admin release</span>}
            </div>
          </article>
        )
      })}
    </div>
  )
}


/* =========================================================
   PAYOUT
========================================================= */

function Payout({
  account,
  setAccount,
  onSave,
}) {
  const [saved, setSaved] =
    useState(false)

  const submit = async (event) => {
    await onSave(event)
    setSaved(true)
  }

  return (
    <section className="provider-panel">

      <div className="provider-panel-title">
        <div>
          <span className="eyebrow">
            Provider Space · Payments
          </span>

          <h2>
            Payment details
          </h2>

          <p>
            Your payout account is updated
            immediately and can be changed
            whenever you need.
          </p>
        </div>
      </div>

      {saved ? (
        <div className="form-success-screen">
          <div className="success-icon">
            ✓
          </div>

          <h3>
            Payment details updated
            successfully
          </h3>

          <p>
            Your provider payout information
            is now saved.
          </p>

          <button
            type="button"
            onClick={() =>
              setSaved(false)
            }
          >
            Edit payment details
          </button>
        </div>
      ) : (
        <form
          className="provider-form"
          onSubmit={submit}
        >
          <label>
            Account name

            <input
              value={
                account.account_name || ''
              }
              onChange={(event) =>
                setAccount({
                  ...account,
                  account_name:
                    event.target.value,
                })
              }
              required
            />
          </label>

          <label>
            Account number

            <input
              value={
                account.account_number || ''
              }
              onChange={(event) =>
                setAccount({
                  ...account,
                  account_number:
                    event.target.value,
                })
              }
              inputMode="numeric"
              required
            />
          </label>

          <label>
            Bank name

            <input
              value={
                account.bank_name || ''
              }
              onChange={(event) =>
                setAccount({
                  ...account,
                  bank_name:
                    event.target.value,
                })
              }
              required
            />
          </label>

          <button className="provider-primary blue">
            Save payment details
          </button>
        </form>
      )}
    </section>
  )
}


/* =========================================================
   PROPERTY FORM
========================================================= */

function PropertyForm({
  form,
  setForm,
  editing,
  onClose,
  onSubmit,
}) {
  const fileRef = useRef()

  const [uploading, setUploading] =
    useState(false)

  const [error, setError] =
    useState('')

  const pick = async (event) => {
    const files = Array.from(
      event.target.files || [],
    )

    if (!files.length) {
      return
    }

    const localMedia = files.map(
      (file, index) => ({
        url: URL.createObjectURL(file),

        type: file.type.startsWith(
          'video/',
        )
          ? 'video'
          : 'image',

        localId: `${Date.now()}-${index}`,
      }),
    )

    setError('')
    setUploading(true)

    // Show previews immediately
    setForm((current) => ({
      ...current,
      media: [
        ...current.media,
        ...localMedia,
      ],
    }))

    try {
      const formData = new FormData()

      files.forEach((file) => {
        formData.append(
          'media',
          file,
        )
      })

      const data = await apiFetch(
        '/profile/property-media',
        {
          method: 'POST',
          body: formData,
        },
      )

      // Remove temporary blob URLs
      // and replace them with backend URLs
      setForm((current) => ({
        ...current,

        media: [
          ...current.media.filter(
            (item) =>
              !localMedia.some(
                (local) =>
                  local.localId ===
                  item.localId,
              ),
          ),

          ...(data.media || []),
        ],
      }))

      localMedia.forEach((item) => {
        URL.revokeObjectURL(item.url)
      })
    } catch (uploadError) {
      setError(
        uploadError.message,
      )

      // Remove failed uploads
      setForm((current) => ({
        ...current,

        media: current.media.filter(
          (item) =>
            !localMedia.some(
              (local) =>
                local.localId ===
                item.localId,
            ),
        ),
      }))
    } finally {
      setUploading(false)

      event.target.value = ''
    }
  }

  const toggleAmenity = (amenity) => {
    setForm((current) => ({
      ...current,

      amenities:
        current.amenities.includes(
          amenity,
        )
          ? current.amenities.filter(
              (item) =>
                item !== amenity,
            )
          : [
              ...current.amenities,
              amenity,
            ],
    }))
  }

  const removeMedia = (index) => {
    setForm((current) => ({
      ...current,

      media: current.media.filter(
        (_, mediaIndex) =>
          mediaIndex !== index,
      ),
    }))
  }

  return (
    <div className="provider-modal-backdrop">

      <form
        className="provider-modal provider-form property-modal-form"
        onSubmit={onSubmit}
      >

        {/* MODAL HEADER */}
        <div className="provider-panel-title">
          <div>
            <span className="eyebrow">
              {editing
                ? 'Update listing'
                : 'New listing'}
            </span>

            <h2>
              {editing
                ? 'Edit property'
                : 'Add property'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* PROPERTY FIELDS */}
        <div className="provider-form-grid">

          <Field
            label="Property title"
            value={form.title}
            onChange={(value) =>
              setForm({
                ...form,
                title: value,
              })
            }
            required
          />

          <Field
            label="Description"
            value={form.description}
            onChange={(value) =>
              setForm({
                ...form,
                description: value,
              })
            }
            textarea
            required
          />

          <Field
            label="Full address"
            value={form.address}
            onChange={(value) =>
              setForm({
                ...form,
                address: value,
              })
            }
            required
          />

          <Field
            label="Area"
            value={form.area}
            onChange={(value) =>
              setForm({
                ...form,
                area: value,
              })
            }
            required
          />

          <Field
            label="City"
            value={form.city}
            onChange={(value) =>
              setForm({
                ...form,
                city: value,
              })
            }
            required
          />

          <label>
            Property type

            <select
              value={
                form.property_type
              }
              onChange={(event) =>
                setForm({
                  ...form,
                  property_type:
                    event.target.value,
                })
              }
            >
              {[
                'self-contain',
                'single-room',
                'room-and-parlour',
                'flat',
                'hostel',
                'duplex',
                'apartment',
                'house',
              ].map((type) => (
                <option
                  key={type}
                  value={type}
                >
                  {type}
                </option>
              ))}
            </select>
          </label>

          <Field
            label="Annual rent"
            type="number"
            value={form.rent}
            onChange={(value) =>
              setForm({
                ...form,
                rent: value,
              })
            }
            required
          />

          <Field
            label="Service charge"
            type="number"
            value={form.service_charge}
            onChange={(value) =>
              setForm({
                ...form,
                service_charge: value,
              })
            }
          />

          <Field
            label="Agent fee"
            type="number"
            value={form.agent_fee}
            onChange={(value) =>
              setForm({
                ...form,
                agent_fee: value,
              })
            }
          />

          <Field
            label="Security deposit"
            type="number"
            value={form.security_deposit}
            onChange={(value) =>
              setForm({
                ...form,
                security_deposit: value,
              })
            }
          />

          <Field
            label="Bedrooms"
            type="number"
            value={form.bedrooms}
            onChange={(value) =>
              setForm({
                ...form,
                bedrooms: value,
              })
            }
          />

          <Field
            label="Bathrooms"
            type="number"
            value={form.bathrooms}
            onChange={(value) =>
              setForm({
                ...form,
                bathrooms: value,
              })
            }
          />

          {/* AMENITIES */}
          <div className="amenity-picker wide">

            <div className="picker-label">
              <span>
                Amenities
              </span>

              <small>
                Select everything available
              </small>
            </div>

            <div className="amenity-chips">
              {AMENITIES.map(
                (amenity) => (
                  <button
                    type="button"
                    key={amenity}
                    className={
                      form.amenities.includes(
                        amenity,
                      )
                        ? 'selected'
                        : ''
                    }
                    onClick={() =>
                      toggleAmenity(
                        amenity,
                      )
                    }
                  >
                    {form.amenities.includes(
                      amenity,
                    )
                      ? '✓ '
                      : ''}

                    {amenity}
                  </button>
                ),
              )}
            </div>
          </div>

          {/* MEDIA UPLOADER */}
          <div className="media-uploader wide">

            <div className="picker-label">
              <div>
                <span>
                  Property photos &
                  videos
                </span>

                <small>
                  Upload multiple images
                  or videos. You can
                  review them before
                  saving.
                </small>
              </div>

              <button
                type="button"
                className="media-upload-button"
                onClick={() =>
                  fileRef.current?.click()
                }
                disabled={uploading}
              >
                {uploading
                  ? 'Uploading…'
                  : '＋ Upload images & videos'}
              </button>
            </div>

            <input
              ref={fileRef}
              hidden
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
              multiple
              onChange={pick}
            />

            {error && (
              <p className="upload-error">
                {error}
              </p>
            )}

            {/* MEDIA PREVIEWS */}
            <div className="media-preview-grid">
              {form.media.map(
                (media, index) => (
                  <div
                    className="media-preview"
                    key={`${media.url}-${index}`}
                  >
                    {media.type ===
                    'video' ? (
                      <video
                        src={mediaUrl(
                          media.url,
                        )}
                        controls
                      />
                    ) : (
                      <img
                        src={mediaUrl(
                          media.url,
                        )}
                        alt={`Property preview ${
                          index + 1
                        }`}
                        onError={(event) => {
                          console.error(
                            'Failed to load property image:',
                            media.url,
                          )
                        }}
                      />
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        removeMedia(index)
                      }
                      aria-label="Remove media"
                    >
                      ×
                    </button>
                  </div>
                ),
              )}
            </div>

            {!form.media.length && (
              <div className="media-empty">
                No media selected yet.
                Add clear photos and,
                if useful, a short
                walkthrough video.
              </div>
            )}
          </div>
        </div>

        {/* FORM ACTIONS */}
        <div className="provider-form-actions">

          <button
            type="button"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={uploading}
            className="provider-primary blue"
          >
            {uploading
              ? 'Finish uploading first…'
              : 'Upload property'}
          </button>
        </div>

        <p className="draft-note">
          Your property is saved as a
          draft first. It will not appear
          publicly until StudentNest
          inspection and admin approval
          are complete.
        </p>
      </form>
    </div>
  )
}


/* =========================================================
   FIELD
========================================================= */

function Field({
  label,
  value,
  onChange,
  required,
  type = 'text',
  textarea = false,
}) {
  return (
    <label>
      {label}

      {textarea ? (
        <textarea
          value={value || ''}
          onChange={(event) =>
            onChange(
              event.target.value,
            )
          }
          required={required}
        />
      ) : (
        <input
          type={type}
          value={value ?? ''}
          onChange={(event) =>
            onChange(
              event.target.value,
            )
          }
          required={required}
        />
      )}
    </label>
  )
}


/* =========================================================
   STAT
========================================================= */

function Stat({
  label,
  value,
}) {
  return (
    <div className="provider-stat">
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  )
}


/* =========================================================
   STATUS
========================================================= */

function Status({ value }) {
  return (
    <span
      className={`tag status-${String(
        value || '',
      ).replace(/_/g, '-')}`}
    >
      {String(value || '').replace(
        /_/g,
        ' ',
      )}
    </span>
  )
}