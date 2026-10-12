# StudentNest API and frontend integration guide

This guide documents the Express API currently mounted by `backend/src/server.js`, its frontend base URL, authentication, route purposes, and the backend modules/data each route uses. The production API is hosted at `https://studentnesteditsbackend.onrender.com`; use the complete Render URLs shown in the route tables when calling it directly.

## Base URL and frontend request helper

The frontend should make API calls through `src/lib_api.js` (`apiFetch`):

- Production API base URL: `https://studentnesteditsbackend.onrender.com/api`.
- The shared frontend API helper uses `VITE_API_URL` if configured; otherwise it defaults to the production Render API base URL above.
- `apiFetch('/properties')` requests `https://studentnesteditsbackend.onrender.com/api/properties`.
- For frontend hosting/build systems, set `VITE_API_URL` to `https://studentnesteditsbackend.onrender.com/api` if you want to configure the hosted API explicitly. Set the Render backend's `CLIENT_ORIGIN` to your frontend's exact origin to allow browser requests.
- To use a local backend instead, set `VITE_API_URL=http://localhost:5000/api`; alternatively, set it to `/api` to use the Vite proxy. The backend defaults to port `5000`.
- JSON request bodies are sent with `Content-Type: application/json`. When the body is `FormData`, do not set that header manually; the browser must set the multipart boundary.
- The helper reads the token from `localStorage` key `studentnest_token` and, when one exists, attaches it to the HTTP `Authorization` header using the `Bearer` scheme. Do not send a token in query parameters.
- Use `mediaUrl(value)` from `src/lib_api.js` for backend media paths such as `/uploads/image.jpg`; it converts the relative path to the backend origin.

The Render service was checked on October 11, 2026: `GET https://studentnesteditsbackend.onrender.com/` returned the StudentNest API status, and `GET https://studentnesteditsbackend.onrender.com/api/health` returned HTTP 200 with the database connected. This is an observed check, not a guarantee of future availability.

### Copy/paste frontend calls

The route tables below show the complete Render URLs. In application code, pass the portion after `/api` to `apiFetch`; it joins that path to the configured Render base URL and automatically adds the saved bearer token:

```js
import { apiFetch, mediaUrl } from './lib_api.js'

const login = await apiFetch('/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password }),
})
localStorage.setItem('studentnest_token', login.token)

const { properties } = await apiFetch('/properties')
const imageSrc = properties[0]?.images?.[0]
  ? mediaUrl(properties[0].images[0])
  : ''
```

For uploads, send `FormData` without setting `Content-Type` yourself; the helper/browser supplies the multipart boundary:

```js
const form = new FormData()
form.append('media', file)
const upload = await apiFetch('/profile/property-media', {
  method: 'POST',
  body: form,
})
```

The backend accepts `GET`, `POST`, `PATCH`, `PUT`, `DELETE`, and `OPTIONS`, and allows `Content-Type` and `Authorization` headers. JSON request bodies are limited to 1 MB. A successful response is generally JSON with `success: true`; errors generally include `success: false` and a `message`. Auth failures are `401`, role failures `403`, missing records `404`, validation errors `400`, and conflicting workflow states `409`. Every response includes an `X-Request-Id` header.

## Authentication and access

Routes marked **Public** do not require a token. **Authenticated** routes require an active, unexpired, non-revoked JWT session. Other routes additionally require the listed role (`student`, `provider`, `inspector`, or `admin`). For protected calls, send the saved JWT in the `Authorization` header with the `Bearer` scheme.

Registration and login return a JWT. The auth middleware verifies the JWT and checks its corresponding row in `auth_sessions` and the active user record on each protected request. Logout revokes that server-side session.

The frontend stores the token and user under `studentnest_token` and `studentnest_user`. After login or registration, it requests `/auth/me` and uses the returned user for the dashboard role. On reload, the app verifies any stored token against `/auth/me` before showing protected dashboards. A `401` clears the local session. Logout calls `/auth/logout` and clears local credentials even if the server cannot be reached; the UI reports when server-side logout could not be confirmed.

The login screen calls `/auth/forgot-password` and includes a reset-token form at `#reset-password` (or `#reset-password?token=...`). The backend currently does not send reset emails: in development it logs the token, while production requires an email-delivery integration. After successful `/auth/reset-password`, the frontend clears local credentials and returns to login.

## Route index

`{id}`, `{propertyId}`, and similar path segments are route parameters. Unless noted otherwise, request data for `POST`, `PUT`, and `PATCH` routes is JSON.

### Root and service health

**Backend:** `backend/src/server.js`, `backend/src/routes/health.js`

| Method and path | Access | What it does / backend integration |
|---|---|---|
| `GET https://studentnesteditsbackend.onrender.com/` | Public | API identity/status response (`StudentNest API`). |
| `GET https://studentnesteditsbackend.onrender.com/api/health` | Public | Tests the MySQL connection using the shared database config; returns `503` if the database is disconnected. |
| `GET https://studentnesteditsbackend.onrender.com/uploads/*` | Public static media | Serves uploaded files from `UPLOAD_DIR` (default `./uploads`), including property, profile, student-post, marketplace, and inspection media. Use the returned `/uploads/...` path with `mediaUrl`. |

### Authentication

**Backend:** `backend/src/routes/auth.js`; mounted at `/api/auth`. All `/api/auth/*` endpoints share a limit of 60 requests per 15 minutes.

| Method and path | Access | What it does / backend integration |
|---|---|---|
| `POST https://studentnesteditsbackend.onrender.com/api/auth/register` | Public | Creates a student or provider account; hashes the password; inserts a user and auth session; provider registration also saves its payout account. Body: `fullName`, `email`, `password`, optional `phone`, `role`, and `institution` for students; provider registration also requires `bank_name`, `account_name`, and `account_number`. Returns `user` and `token`. |
| `POST https://studentnesteditsbackend.onrender.com/api/auth/login` | Public | Checks email/password, rejects inactive users, creates an auth session, and returns `user` and `token`. Body: `email`, `password`. |
| `GET https://studentnesteditsbackend.onrender.com/api/auth/me` | Authenticated | Returns the current public user from the validated JWT session. |
| `POST https://studentnesteditsbackend.onrender.com/api/auth/logout` | Authenticated | Revokes the current `auth_sessions` row. The frontend clears local credentials after the request, including when the server cannot be reached. |
| `POST https://studentnesteditsbackend.onrender.com/api/auth/forgot-password` | Public | Starts password recovery and returns a non-enumerating response whether or not the email exists. In development the reset token is logged by the backend; connect an email delivery service before relying on email recovery in production. Body: `email`. |
| `POST https://studentnesteditsbackend.onrender.com/api/auth/reset-password` | Public, reset token required | Hashes the supplied reset token, changes the password, marks the token used, and revokes that user's active sessions. Body: `token`, `newPassword` (at least 8 characters). |

### Accommodation properties

**Backend:** `backend/src/routes/properties.js`; mounted at `/api/properties`. Property data is stored in `properties` and joined with provider records in `users`.

| Method and path | Access | What it does / backend integration |
|---|---|---|
| `GET https://studentnesteditsbackend.onrender.com/api/properties` | Public | Lists approved, verified properties. Optional query filters: `area`, `city`, `property_type`, `min_rent`, `max_rent`, `bedrooms` (minimum), and `q` (searches title, description, area, address). |
| `GET https://studentnesteditsbackend.onrender.com/api/properties/provider/mine` | Provider | Lists the signed-in provider's own listings, including drafts and moderation status. |
| `GET https://studentnesteditsbackend.onrender.com/api/properties/provider/{providerId}` | Public | Returns an active provider summary and that provider's approved, verified listings. |
| `GET https://studentnesteditsbackend.onrender.com/api/properties/inspection/{id}` | Inspector | Loads property details for inspection, including listings not yet publicly approved. |
| `GET https://studentnesteditsbackend.onrender.com/api/properties/{id}` | Public | Returns one approved, verified property. |
| `POST https://studentnesteditsbackend.onrender.com/api/properties` | Provider | Creates a property draft and calculates `total_cost`. Body fields include `title`, `description`, `address`, `area`, `city`, `property_type`, `rent`; optional fields include state/postal code, subtype, fees, room counts, `amenities` and `images`. |
| `PUT https://studentnesteditsbackend.onrender.com/api/properties/{id}` | Owning provider | Updates a draft/rejected listing and recalculates the total. Pending or approved listings cannot be changed through this route. |
| `DELETE https://studentnesteditsbackend.onrender.com/api/properties/{id}` | Owning provider | Deletes only a draft or rejected listing. |
| `POST https://studentnesteditsbackend.onrender.com/api/properties/{id}/submit` | Owning provider | Moves a complete draft/rejected listing to pending inspection; it then enters inspection and admin moderation workflows. |

Property type accepted by the backend includes `self-contain`, `single-room`, `room-and-parlour`, `flat`, `hostel`, `duplex`, `apartment`, and `house`. Property `images` can be stored as uploaded media URLs; upload media first with the profile media route below.

### Notifications

**Backend:** `backend/src/routes/notifications.js`; mounted at `/api/notifications`. Notifications are stored in `notifications`, scoped to the authenticated user, and are created by several workflows such as inquiries, bookings, roommate/takeover contacts, and payments.

| Method and path | Access | What it does / backend integration |
|---|---|---|
| `GET https://studentnesteditsbackend.onrender.com/api/notifications` | Authenticated | Lists the current user's notifications. Optional `limit` query parameter is clamped to 1–100 (default 30); response includes `unread_count` for the returned rows. |
| `GET https://studentnesteditsbackend.onrender.com/api/notifications/unread-count` | Authenticated | Returns the current user's total unread count. |
| `PATCH https://studentnesteditsbackend.onrender.com/api/notifications/{id}/read` | Authenticated | Marks one of the current user's notifications as read. |
| `PATCH https://studentnesteditsbackend.onrender.com/api/notifications/read-all` | Authenticated | Marks all of the current user's unread notifications as read. |

### Student dashboard, favourites, inquiries, roommate and takeover listings

**Backend:** `backend/src/routes/student.js`; mounted at `/api/student`. Student endpoints use the current student's ID from the authenticated session and integrate with `favourites`, `inquiries`, `roommate_listings`, `roommate_interests`, `takeover_listings`, `takeover_contacts`, and notifications.

| Method and path | Access | What it does / backend integration |
|---|---|---|
| `POST https://studentnesteditsbackend.onrender.com/api/student/media` | Student; `multipart/form-data` | Uploads up to 12 image/video files (`media`) to `/uploads`; returns media metadata for a student listing. |
| `GET https://studentnesteditsbackend.onrender.com/api/student/favourites` | Student | Lists the signed-in student's saved properties. |
| `POST https://studentnesteditsbackend.onrender.com/api/student/favourites/{propertyId}` | Student | Saves an available, approved, verified property to favourites. |
| `DELETE https://studentnesteditsbackend.onrender.com/api/student/favourites/{propertyId}` | Student | Removes a property from the signed-in student's favourites. |
| `GET https://studentnesteditsbackend.onrender.com/api/student/inquiries` | Student | Lists the student's property inquiries, sent/received roommate interests, and takeover contacts as a combined dashboard view. |
| `POST https://studentnesteditsbackend.onrender.com/api/student/inquiries` | Student | Sends a viewing inquiry to a property's provider and creates a notification. Body: `property_id`, `message`; optional `preferred_viewing_date` (`YYYY-MM-DD`) and `preferred_viewing_time` (`HH:MM`). |
| `PATCH https://studentnesteditsbackend.onrender.com/api/student/inquiries/{id}/cancel` | Student who owns inquiry | Closes a pending/responded inquiry and declines its appointment. |
| `GET https://studentnesteditsbackend.onrender.com/api/student/roommates` | Student | Lists active roommate posts, interest state, and trait options. |
| `GET https://studentnesteditsbackend.onrender.com/api/student/roommates/mine` | Student | Lists the student's roommate posts and received interests. |
| `POST https://studentnesteditsbackend.onrender.com/api/student/roommates` | Student | Creates a roommate post. Body includes `name`, `level`, `course`, `area`, `duration`, `rent`, `split_cost`; optional description, gender preference, traits, and uploaded `media` array. |
| `DELETE https://studentnesteditsbackend.onrender.com/api/student/roommates/{id}` | Owning student | Deletes the student's roommate post. |
| `POST https://studentnesteditsbackend.onrender.com/api/student/roommates/{id}/interest` | Student | Expresses interest in another active post using `name`, `level`, `age`, and `phone`; notifies the poster. |
| `PATCH https://studentnesteditsbackend.onrender.com/api/student/roommates/interests/{id}/respond` | Owning poster | Saves a poster's response to a roommate interest; notifies the interested student. Body: `response`. |
| `GET https://studentnesteditsbackend.onrender.com/api/student/takeovers` | Student | Lists active takeover posts and indicates whether the signed-in student owns/has contacted each listing. |
| `GET https://studentnesteditsbackend.onrender.com/api/student/takeovers/mine` | Student | Lists the student's takeover posts and received contacts. |
| `POST https://studentnesteditsbackend.onrender.com/api/student/takeovers` | Student | Creates a takeover post. Body includes `title`, `area`, `reason`, `available_from`, `price`; optional `description`, `months_left`, `amount_required`, and uploaded `media` array. |
| `DELETE https://studentnesteditsbackend.onrender.com/api/student/takeovers/{id}` | Owning student | Deletes the student's takeover listing. |
| `POST https://studentnesteditsbackend.onrender.com/api/student/takeovers/{id}/contact` | Student | Contacts the owner of an active takeover post; creates a contact and notification. |
| `PATCH https://studentnesteditsbackend.onrender.com/api/student/takeovers/contacts/{id}/respond` | Owning poster | Saves a response to a takeover contact and notifies the interested student. Body: `response`. |
| `GET https://studentnesteditsbackend.onrender.com/api/student/provider/inquiries` | Provider | Lists the provider's received property inquiries. Despite the `/student` mount prefix, this route requires a provider role. |
| `PATCH https://studentnesteditsbackend.onrender.com/api/student/provider/inquiries/{id}/respond` | Owning provider | Responds to a property inquiry and manages proposed viewing appointment details/status. |

### Bookings and viewing appointments

**Backend:** `backend/src/routes/bookings.js`; mounted at `/api/bookings`. Booking records are stored in `booking_requests`, linked to `properties`, `users`, payments and (for some viewing flows) inquiries.

| Method and path | Access | What it does / backend integration |
|---|---|---|
| `POST https://studentnesteditsbackend.onrender.com/api/bookings` | Student | Requests a booking for an available property and dates; backend computes rent, fees and total, and prevents overlapping active requests. Body: `property_id`, `start_date`; optional `end_date`, `message`. |
| `GET https://studentnesteditsbackend.onrender.com/api/bookings/mine` | Student | Lists the signed-in student's booking requests. |
| `GET https://studentnesteditsbackend.onrender.com/api/bookings/provider` | Provider | Lists booking requests received for the signed-in provider's properties. |
| `PATCH https://studentnesteditsbackend.onrender.com/api/bookings/{id}/respond` | Owning provider | Approves or rejects a pending request; body: `decision` (`approve` or `reject`) and optional `response`. Approval allows the student to proceed to payment. |
| `POST https://studentnesteditsbackend.onrender.com/api/bookings/{id}/accept` | Student who owns booking | Accepts a provider-proposed appointment awaiting student confirmation; may update the linked inquiry and notify the provider. |
| `PATCH https://studentnesteditsbackend.onrender.com/api/bookings/{id}/cancel` | Student who owns booking | Cancels a booking while its status permits cancellation. |
| `GET https://studentnesteditsbackend.onrender.com/api/bookings/{id}` | Student, provider, or admin | Loads a booking only for a participant or an admin. |

### Property payments and provider payout details

**Backend:** `backend/src/routes/payments.js`; mounted at `/api/payments`. Integrates `booking_requests`, `payment_transactions`, `provider_bank_accounts`, `payment_events`, `payment_disputes`, notifications and properties. Payment mode is controlled by backend `PAYMENT_MODE` (`mock` by default; Flutterwave when configured).

| Method and path | Access | What it does / backend integration |
|---|---|---|
| `GET https://studentnesteditsbackend.onrender.com/api/payments/quote/{propertyId}` | Student | Returns a server-calculated NGN price breakdown for an eligible property. |
| `POST https://studentnesteditsbackend.onrender.com/api/payments/provider/bank-account` | Provider | Adds/updates provider payout account details. Body: `bank_name`, `account_name`, `account_number`. |
| `GET https://studentnesteditsbackend.onrender.com/api/payments/provider/bank-account` | Provider | Lists own payout account details with account number limited to its last four digits. |
| `POST https://studentnesteditsbackend.onrender.com/api/payments/initialize` | Student | Creates a protected payment transaction for an approved booking. Body: `property_id`, `booking_id`. In mock mode returns `test_actions` with the mock success route; in Flutterwave mode returns `authorization_url`. |
| `GET https://studentnesteditsbackend.onrender.com/api/payments/mine` | Student or provider | Lists transactions for the current student or provider. |
| `GET https://studentnesteditsbackend.onrender.com/api/payments/{id}` | Student, provider, or admin participant | Loads a transaction and associated disputes; students/providers must be transaction participants. |
| `POST https://studentnesteditsbackend.onrender.com/api/payments/{id}/mock-success` | Student, mock mode only | Simulates payment success and protects funds for the inspection window. Body: `payment_method` (or `channel`: `bank_transfer`, `ussd`, `card`, or `direct_debit`), `account_name`, `account_number`. Do not use as a live payment route. |
| `POST https://studentnesteditsbackend.onrender.com/api/payments/{id}/confirm` | Student who owns transaction | Confirms satisfactory property receipt and starts the provider funds-release workflow. |
| `POST https://studentnesteditsbackend.onrender.com/api/payments/{id}/dispute` | Student who owns transaction | Opens a payment/property dispute for admin and inspector review. |
| `POST https://studentnesteditsbackend.onrender.com/api/payments/webhook/flutterwave` | Payment gateway callback | Processes Flutterwave payment webhooks. Configure this exact backend URL in the gateway; it is not a browser/frontend callback. |

In mock mode no real money is charged. Live payments require valid Flutterwave environment configuration and production testing. Provider funds release and payout integrations are not a substitute for a configured live payment-provider settlement flow.

### Payment administration

**Backend:** `backend/src/routes/paymentAdmin.js`; mounted at `/api/admin/payments`.

| Method and path | Access | What it does / backend integration |
|---|---|---|
| `GET https://studentnesteditsbackend.onrender.com/api/admin/payments/transactions` | Admin | Lists property-payment transactions; optional `status` query filter. Joins student, provider, and property details. |
| `GET https://studentnesteditsbackend.onrender.com/api/admin/payments/disputes` | Admin | Lists open/investigating payment disputes with property, student and inspector context. |
| `POST https://studentnesteditsbackend.onrender.com/api/admin/payments/bank-accounts/{id}/decision` | Admin | Verifies/rejects a provider bank account. Body: `decision` (`verify` or `reject`), optional `note`. |
| `POST https://studentnesteditsbackend.onrender.com/api/admin/payments/disputes/{id}/resolve` | Admin | Resolves a property payment dispute with `decision` (`refund`, `release`, or `reject`) and optional `note`; updates transactions, disputes, bookings, property availability, and payout records. |
| `POST https://studentnesteditsbackend.onrender.com/api/admin/payments/transactions/{id}/release` | Admin | Releases a confirmed property transaction; calculates platform commission and queues provider payout. |

### Messaging and appointments

**Backend:** `backend/src/routes/messages.js`; mounted at `/api/messages`. Conversations/messages are persisted in `chat_conversations`, `chat_messages`; appointment flows also use `booking_requests` and notifications. Listing contexts include property, `support`, `marketplace:{itemId}`, `roommate:{listingId}`, and `takeover:{listingId}`.

| Method and path | Access | What it does / backend integration |
|---|---|---|
| `GET https://studentnesteditsbackend.onrender.com/api/messages/users` | Admin | Searches active chat users. Optional `role` and `q` filters. This directory is admin-only. |
| `POST https://studentnesteditsbackend.onrender.com/api/messages/support` | Authenticated non-admin | Finds or creates a support conversation with an active admin; the backend chooses the admin participant. |
| `POST https://studentnesteditsbackend.onrender.com/api/messages/conversations` | Authenticated | Finds or creates a conversation for an allowed participant/context. Body: `other_user_id`; optional `property_id`, `context_key`. Participant and listing ownership are validated by the backend. |
| `GET https://studentnesteditsbackend.onrender.com/api/messages/conversations` | Authenticated | Lists the current user's accessible conversations and other participant. |
| `GET https://studentnesteditsbackend.onrender.com/api/messages/conversations/{id}/messages` | Conversation participant | Loads messages and marks messages from the other participant read. |
| `POST https://studentnesteditsbackend.onrender.com/api/messages/conversations/{id}/messages` | Conversation participant | Sends a message; body: `body` (non-empty, max 5,000 characters). |
| `GET https://studentnesteditsbackend.onrender.com/api/messages/appointments/mine` | Authenticated | Lists appointments associated with the current user. |
| `POST https://studentnesteditsbackend.onrender.com/api/messages/conversations/{id}/appointments` | Conversation participant | Proposes an appointment for a property conversation. |
| `POST https://studentnesteditsbackend.onrender.com/api/messages/appointments/{id}/respond` | Appointment participant | Responds to a proposed appointment. |
| `POST https://studentnesteditsbackend.onrender.com/api/messages/conversations/{id}/payment-eligibility` | Conversation participant | Checks or records the conversation's payment eligibility in the related property flow. |

### Reviews

**Backend:** `backend/src/routes/reviews.js`; mounted at `/api/reviews`. Integrates `property_reviews`, `booking_requests`, released `payment_transactions`, properties, and users. A student may submit a review only after StudentNest releases the associated booking payment.

| Method and path | Access | What it does / backend integration |
|---|---|---|
| `GET https://studentnesteditsbackend.onrender.com/api/reviews/property/{propertyId}` | Public | Returns published reviews and aggregate rating summary for a property. |
| `GET https://studentnesteditsbackend.onrender.com/api/reviews/mine` | Student | Lists bookings eligible for review and whether each has already been reviewed. |
| `POST https://studentnesteditsbackend.onrender.com/api/reviews` | Student | Submits a pending review. Body: `property_id`, `booking_id`, `rating` (1–5); optional `title`, `comment`. Duplicate reviews are rejected. |

### Reports and content moderation

**Backend:** `backend/src/routes/reports.js` (`/api/reports`) and `backend/src/routes/moderation.js` (`/api/moderation`). Integrates `platform_reports`, `property_reviews`, `audit_logs`, users, properties, and notifications where applicable.

| Method and path | Access | What it does / backend integration |
|---|---|---|
| `POST https://studentnesteditsbackend.onrender.com/api/reports` | Authenticated | Creates a platform report. Body: `target_type` (`property`, `user`, `review`, `message`, `booking`, or `payment`), `target_id`, `reason`, `description`; optional `evidence` array and `priority` (`low`, `normal`, `high`, `urgent`). |
| `GET https://studentnesteditsbackend.onrender.com/api/reports/mine` | Authenticated | Lists reports created by the current user. |
| `GET https://studentnesteditsbackend.onrender.com/api/reports/admin` | Admin | Lists reports, optionally filtered by valid `status` and `priority` query values. |
| `PATCH https://studentnesteditsbackend.onrender.com/api/reports/admin/{id}` | Admin | Updates report `status` (`open`, `investigating`, `resolved`, `dismissed`) and optional `resolution_note`. Records resolver metadata for resolved/dismissed reports. |
| `GET https://studentnesteditsbackend.onrender.com/api/moderation/reviews` | Admin | Lists reviews for moderation; optional `status` filter. |
| `PATCH https://studentnesteditsbackend.onrender.com/api/moderation/reviews/{id}` | Admin | Sets review status to `published`, `hidden`, or `removed` and records moderator/action in audit logs. |
| `GET https://studentnesteditsbackend.onrender.com/api/moderation/audit-logs` | Admin | Lists audit records; optional `limit` (1–500, default 100). |
| `GET https://studentnesteditsbackend.onrender.com/api/moderation/dashboard` | Admin | Returns counts for open reports, pending reviews, active users, and properties needing attention. |

### Admin users, inspectors and property moderation

**Backend:** `backend/src/routes/admin.js`; mounted at `/api/admin`. Integrates users, inspections, properties, disputes and Student Shop administration.

| Method and path | Access | What it does / backend integration |
|---|---|---|
| `GET https://studentnesteditsbackend.onrender.com/api/admin/users` | Admin | Lists users and account status. |
| `PATCH https://studentnesteditsbackend.onrender.com/api/admin/users/{id}/status` | Admin | Activates/deactivates a non-admin user. Body: `is_active` boolean. |
| `GET https://studentnesteditsbackend.onrender.com/api/admin/access-check` | Admin | Verifies admin access and returns the current admin's ID/role. |
| `POST https://studentnesteditsbackend.onrender.com/api/admin/inspectors` | Admin | Creates an inspector user. Body: `fullName`, `email`, `password` (at least 8 characters), optional `phone`. |
| `GET https://studentnesteditsbackend.onrender.com/api/admin/inspectors` | Admin | Lists inspector accounts. |
| `POST https://studentnesteditsbackend.onrender.com/api/admin/payment-disputes/{id}/assign-inspector` | Admin | Assigns an active inspector to a property payment dispute. Body: `inspector_id` (or `agent_id`). |
| `GET https://studentnesteditsbackend.onrender.com/api/admin/inspections` | Admin | Lists property inspections; optional `result` (`pending`, `pass`, `fail`) and `status` filters. |
| `GET https://studentnesteditsbackend.onrender.com/api/admin/properties/pending` | Admin | Lists pending properties with latest inspection/provider context for moderation. |
| `GET https://studentnesteditsbackend.onrender.com/api/admin/properties/{id}/inspection-details` | Admin | Lists inspection records and related property/provider/inspector details for one property. |
| `POST https://studentnesteditsbackend.onrender.com/api/admin/properties/{id}/decision` | Admin | Approves/rejects a pending listing. Body: `decision` (`approve` or `reject`), optional `reason`. Approval requires a passing inspection. |
| `GET https://studentnesteditsbackend.onrender.com/api/admin/marketplace/items` | Admin | Lists Student Shop items with seller information. |
| `GET https://studentnesteditsbackend.onrender.com/api/admin/marketplace/transactions` | Admin | Lists Student Shop transactions; optional `status` filter. |
| `GET https://studentnesteditsbackend.onrender.com/api/admin/marketplace/disputes` | Admin | Lists open/investigating Student Shop disputes. |
| `POST https://studentnesteditsbackend.onrender.com/api/admin/marketplace/disputes/{id}/assign-inspector` | Admin | Assigns an active inspector to a Student Shop dispute. Body: `inspector_id` (or `agent_id`). |
| `POST https://studentnesteditsbackend.onrender.com/api/admin/marketplace/disputes/{id}/resolve` | Admin | Resolves a Student Shop dispute with `decision` (`refund`, `release`, or `reject`) and optional `note`; updates transaction, item/order and payout state. |
| `POST https://studentnesteditsbackend.onrender.com/api/admin/marketplace/transactions/{id}/release` | Admin | Releases a confirmed Student Shop transaction and queues seller payout. |

### Property inspection and complaint investigation

**Backend:** `backend/src/routes/inspections.js`; mounted at `/api/inspections`. Integrates `property_inspections`, `inspection_activity`, properties, property payment disputes, Student Shop disputes, users, and uploaded evidence.

| Method and path | Access | What it does / backend integration |
|---|---|---|
| `POST https://studentnesteditsbackend.onrender.com/api/inspections/evidence` | Inspector; `multipart/form-data` | Uploads up to 3 evidence images in field `evidence` (JPG, PNG, WEBP or GIF; max 10 MB each); returns `/uploads/inspections/...` URLs. |
| `GET https://studentnesteditsbackend.onrender.com/api/inspections/queue` | Inspector or admin | Lists properties waiting for inspection. |
| `POST https://studentnesteditsbackend.onrender.com/api/inspections/{propertyId}/assign` | Inspector or admin | Creates an inspection for a pending property. An inspector self-assigns; an admin supplies `inspectorId`. |
| `GET https://studentnesteditsbackend.onrender.com/api/inspections/mine` | Inspector | Lists inspections assigned to the current inspector. |
| `GET https://studentnesteditsbackend.onrender.com/api/inspections/complaints` | Inspector | Lists property-payment disputes assigned to the current inspector. |
| `POST https://studentnesteditsbackend.onrender.com/api/inspections/complaints/{id}/submit` | Assigned inspector | Submits an investigation result (`found` or `not_found`) and report (at least 10 characters) for a property-payment dispute. |
| `GET https://studentnesteditsbackend.onrender.com/api/inspections/marketplace-complaints` | Inspector | Lists Student Shop disputes assigned to the current inspector. |
| `POST https://studentnesteditsbackend.onrender.com/api/inspections/marketplace-complaints/{id}/submit` | Assigned inspector | Submits a Student Shop investigation result (`found` or `not_found`) and report (at least 10 characters). |
| `GET https://studentnesteditsbackend.onrender.com/api/inspections/{id}` | Assigned inspector or admin | Loads a single inspection and related property/provider/inspector details. |
| `POST https://studentnesteditsbackend.onrender.com/api/inspections/{id}/submit` | Assigned inspector | Completes an inspection. Body includes boolean checks (`location_verified`, `property_exists`, `amenities_verified`, `photos_verified`, `rent_verified`, `availability_verified`, `condition_verified`), optional `notes`, and optional uploaded `evidence` URL array. The inspection passes only if all checks are true. |

### Student Shop / marketplace

**Backend:** `backend/src/routes/marketplace.js`; mounted at `/api/marketplace`. Integrates `marketplace_items`, `marketplace_orders`, `marketplace_transactions`, `marketplace_disputes`, student payout accounts, payouts, chat and notifications.

| Method and path | Access | What it does / backend integration |
|---|---|---|
| `GET https://studentnesteditsbackend.onrender.com/api/marketplace/items` | Student | Lists available items; optional `q` and `category` filters. |
| `GET https://studentnesteditsbackend.onrender.com/api/marketplace/items/mine` | Student | Lists the current student's items and order counts. |
| `GET https://studentnesteditsbackend.onrender.com/api/marketplace/items/{id}` | Student | Loads a Student Shop item with seller details. |
| `POST https://studentnesteditsbackend.onrender.com/api/marketplace/items` | Student; `multipart/form-data` | Creates an item listing. Form fields: `title`, `category`, `price`, optional `description`, `condition` (`new` or `used`); attach 1–8 images in `images` (JPG, PNG, WEBP or GIF; max 12 MB each). |
| `PATCH https://studentnesteditsbackend.onrender.com/api/marketplace/items/{id}` | Owning student | Changes own item's `status` to `available` or `hidden`; items involved in orders cannot be changed. |
| `GET https://studentnesteditsbackend.onrender.com/api/marketplace/payout-account` | Student | Loads own payout account, exposing only the last four account-number digits. |
| `PUT https://studentnesteditsbackend.onrender.com/api/marketplace/payout-account` | Student | Saves/updates seller payout details. Body: `bank_name`, `account_name`, `account_number`. Current backend behavior marks this account verified using test verification. |
| `POST https://studentnesteditsbackend.onrender.com/api/marketplace/items/{id}/buy` | Student | Creates a pending order and transaction for an available item; cannot buy one's own item. |
| `GET https://studentnesteditsbackend.onrender.com/api/marketplace/transactions/mine` | Student | Lists transactions where the current user is buyer or seller. |
| `POST https://studentnesteditsbackend.onrender.com/api/marketplace/transactions/{id}/mock-success` | Buyer, mock mode only | Simulates payment and protects funds. Body: `payment_method` (or `channel`: `bank_transfer`, `ussd`, `card`, `direct_debit`), `account_name`, `account_number`. |
| `POST https://studentnesteditsbackend.onrender.com/api/marketplace/transactions/{id}/confirm` | Buyer | Confirms the item is satisfactory so admin can release protected funds. |
| `POST https://studentnesteditsbackend.onrender.com/api/marketplace/transactions/{id}/dispute` | Buyer | Opens a Student Shop transaction dispute for admin/inspector resolution. |

### Profile and provider uploads

**Backend:** `backend/src/routes/profile.js`; mounted at `/api/profile`. Profile fields are stored in `users`; files are written to the shared upload directory.

| Method and path | Access | What it does / backend integration |
|---|---|---|
| `GET https://studentnesteditsbackend.onrender.com/api/profile/me` | Authenticated | Returns current user profile, including provider identity-document metadata where present. |
| `PUT https://studentnesteditsbackend.onrender.com/api/profile/me` | Authenticated | Updates `fullName`, `phone`, and `institution` for the current user. |
| `POST https://studentnesteditsbackend.onrender.com/api/profile/provider-documents` | Provider; `multipart/form-data` | Saves an 11-digit `ninNumber` and `ninFront`/`ninBack` images (JPG, PNG or WEBP; max 10 MB each). Both front and back are required across current/new uploads. |
| `POST https://studentnesteditsbackend.onrender.com/api/profile/property-media` | Provider; `multipart/form-data` | Uploads up to 12 images/videos in `media` (max 50 MB each) and returns media metadata. Add returned URLs to a property draft's `images`. |

### Routes in `backend/src/routes/system.js` (not mounted)

The current `backend/src/server.js` does **not** import or mount `system.js`. These handler paths are therefore **not currently available** through the running API. They are listed to prevent frontend code from depending on routes that the server does not expose.

| Declared method and path | Access if mounted | Handler behavior |
|---|---|---|
| `GET https://studentnesteditsbackend.onrender.com/api/system/readiness` | Admin | Checks database, JWT/client/payment environment configuration and required `platform_settings` entries. |
| `POST https://studentnesteditsbackend.onrender.com/api/system/cleanup-sessions` | Admin | Deletes expired or revoked auth sessions. |

## Typical frontend integration flows

1. **Sign in:** call `POST https://studentnesteditsbackend.onrender.com/api/auth/login`, save the returned token as `studentnest_token`, then call `GET https://studentnesteditsbackend.onrender.com/api/auth/me` to hydrate the current user. Clear the token after `POST https://studentnesteditsbackend.onrender.com/api/auth/logout`.
2. **Browse and inquire:** call `GET https://studentnesteditsbackend.onrender.com/api/properties` (and optionally `GET https://studentnesteditsbackend.onrender.com/api/properties/{id}`), then `POST https://studentnesteditsbackend.onrender.com/api/student/inquiries` or `POST https://studentnesteditsbackend.onrender.com/api/bookings` as appropriate.
3. **Provider listing:** upload images with `POST https://studentnesteditsbackend.onrender.com/api/profile/property-media`, create/update a draft with `/api/properties`, then submit it with `POST https://studentnesteditsbackend.onrender.com/api/properties/{id}/submit`. The inspection and admin routes control its publication.
4. **Secure property payment:** create and obtain provider approval for a booking, optionally show `GET https://studentnesteditsbackend.onrender.com/api/payments/quote/{propertyId}`, then call `POST https://studentnesteditsbackend.onrender.com/api/payments/initialize`. In mock mode call its returned test action; in live mode redirect the browser to `authorization_url`. Use transaction routes to show status, confirm receipt, or dispute.
5. **Messaging:** use `POST https://studentnesteditsbackend.onrender.com/api/messages/conversations` from a property/shop/student listing context, or `POST https://studentnesteditsbackend.onrender.com/api/messages/support`; load conversation/message routes and send messages through the same authenticated API helper.
6. **Student Shop:** upload item pictures and create the item, then use buy/transaction routes. Payment confirmation or disputes are handled through marketplace transaction routes and admin/inspector workflows.

## Frontend integration points already present

The shared API client and token/media handling live in `src/lib_api.js` and `src/lib_auth.js`. Existing UI integrations include public property browsing (`Accommodation.jsx`, `AccommodationPreview.jsx`), authentication/provider verification (`AuthPage.jsx`), student dashboard and listings (`StudentHub.jsx`), rent payments (`StudentPayments.jsx`), messaging (`ChatCenter.jsx`), Student Shop (`Marketplace.jsx`), inspection workflows (`InspectionHub.jsx`), reviews (`AccommodationDetails.jsx`, `ReviewCenter.jsx`), and admin workflows (`AdminHub.jsx`).

For a new integration, use `apiFetch('/route')` with a path relative to `/api`, JSON-stringify JSON bodies, use `FormData` for uploads, handle rejected promises for non-2xx responses, and check the caller's role before displaying role-specific actions. The backend remains authoritative for all access checks, validation, totals, ownership, and workflow transitions.
