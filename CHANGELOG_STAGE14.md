# StudentNest Stage 14 — Workflow & Integration Fixes

Implemented in this build:

- Student Roommate Finder posts support images and walkthrough videos.
- Student Takeover posts support images/videos plus months remaining and amount required for the remaining rent period.
- Property media is stored with media type and public URLs are normalized correctly, fixing blank relative-image rendering.
- Student Inquiry inbox now combines provider viewing responses with responses received on roommate/takeover posts.
- Provider viewing workflow: approve appointment, change appointment date/time, and notify the student.
- Student must accept the provider-proposed appointment before the booking becomes payment-eligible.
- Bookings & Payments now exposes `Make payment for this property` after student confirmation.
- Protected/escrow-style payment flow retains funds until student satisfaction or dispute resolution.
- Student has `Satisfied with this property` and `Not satisfied with this property` actions; the latter opens a proper complaint form.
- Complaints are attached to the property, visible to admin, and can be assigned to an internal StudentNest inspector.
- Agents can investigate complaints, choose Complaint found / Complaint not found, and submit detailed reports.
- Admin can see the initial property inspector, the assigned dispute agent, review the report, refund the student, or release protected funds to the provider.
- Admin can release confirmed non-disputed payments to the provider.
- Provider dashboard shows upcoming viewing appointments as reminders.
- Agent login routing points to the internal Inspection Hub, not the provider dashboard.
- Added the Stage 14 migration file; run it after Stage 13 before testing these new workflows.

## Important payment note
Local `PAYMENT_MODE=mock` is still a simulation. It does not move real money. A production deployment needs the selected licensed payment provider's live collection, verification, refund, and settlement/payout integration and appropriate escrow/client-money compliance.
