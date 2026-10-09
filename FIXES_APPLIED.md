# StudentNest debug pass

This build includes a backend/frontend integration pass focused on authentication, property listing, viewing requests, and provider synchronization.

## Important fixes
- Fixed logout so the server session is revoked before local authentication is cleared. Logout now completes reliably even when the API is temporarily unavailable.
- Fixed a critical Express route-order bug: `/properties/provider/mine` was being caught by `/properties/provider/:providerId`, causing the provider dashboard property load to fail.
- The provider `Upload property` action now saves the listing and immediately submits it to the StudentNest inspection queue. It is **not publicly published immediately**; inspection and admin approval are still required.
- Provider dashboards poll for new student requests while visible, so a viewing request submitted from another device/tab appears without a manual refresh.
- Viewing requests now store an optional preferred date and time in the database.
- Added a real `Submit viewing request` action to the student request form and wired its data through the API.
- Provider request cards now expose direct Call/Email actions in addition to the in-app response flow.
- Added an idempotent Stage 13 database migration for the new viewing-request fields and inquiry indexes.
- Updated backend setup documentation with the complete migration order.

## Expected property workflow
Provider fills the form -> Upload property -> draft is created -> listing is submitted for inspection -> field agent completes inspection -> admin approves -> property becomes visible in Find Accommodation.

This workflow is intentional so a provider cannot bypass StudentNest verification and publish an unverified property.

## Stage 14 — StudentNest end-to-end workflow
- Added student media upload/storage for roommate and takeover posts.
- Added takeover months-left and remaining-payment fields.
- Fixed relative property media URLs so uploaded images render on public listing pages.
- Added unified inquiry inbox entries for provider, roommate and takeover activity.
- Added provider appointment approval/change flow and student appointment acceptance.
- Added protected payment choice after booking confirmation, with satisfaction/complaint actions.
- Added property-attached dispute investigation assignment to internal StudentNest agents.
- Added agent complaint result/report workflow and admin refund/release controls.
- Added provider appointment reminders and agent routing fixes.
