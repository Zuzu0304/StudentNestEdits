# StudentNest Phase 6 — UX and workflow fixes

## What changed
- Price filters now use clear NGN ranges: ₦100,000–₦200,000, ₦200,000–₦300,000, etc.
- Improved pale-yellow/status contrast so text remains readable.
- Removed the student/provider Requests UI; communication is centred on Messages and appointments.
- Added a global Back button on app pages.
- Student Messages now carries the red unread-message badge; the old student Notifications navigation item is removed.
- Provider payment details show the saved account and an Edit details action.
- Removed bank-code fields from provider/student payout forms and payment routes. Existing legacy database columns are retained for compatibility.
- Property forms received a cleaner two-column layout and mobile stacking.
- Public accommodation listings now keep approved reserved/occupied properties visible with status tags.
- Inspector property links now open the exact private draft property, including provider details and call action.
- Added a private inspector-only property view endpoint for unpublished listings.
- Chat conversations can be linked to a property or Student Shop item and show that context at the top.
- Provider can approve property payment eligibility from the linked chat after an appointment is accepted; this creates the booking record used by Bookings & Payments.
- Student can jump from linked chat to the correct protected payment.
- Student Shop no longer exposes a direct Buy button. Buyer messages seller first; seller can approve payment eligibility from the linked chat.
- Student Shop buyer/seller orders now include Message seller / Message buyer actions so appointment scheduling can happen in chat.
- Marketplace listing publication now shows the 5% commission disclosure only at the final confirmation step.
- Seller cannot buy their own marketplace listing from the public shop.
- Verified Properties replaces the old Admin Verification sidebar item and opens the stored inspection record.
- Internal field-agent terminology is now Inspector in the application role and UI. Database assignment columns such as `agent_id` remain for backward compatibility.

## New migration
Run after Stage 18:

`backend/database/stage19_inspector_role_cleanup.sql`

This converts existing `agent` users to `inspector` and updates the users role enum.

## Shop dispute policy
No marketplace-dispute policy change was made in this phase. The existing complaint/inspection workflow remains in place until StudentNest chooses a scalable alternative.

## Validation
- Backend JavaScript files pass `node --check`.
- ZIP integrity validated after packaging.
- A full Vite build could not be completed in this environment because dependency installation timed out; do not treat that as a build-pass claim.
