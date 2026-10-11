# StudentNest

Student accommodation platform prototype.

The backend is currently at Stage 4: Property Verification & Inspection.

## API documentation

See [API_FRONTEND_INTEGRATION.md](API_FRONTEND_INTEGRATION.md) for the mounted API routes, frontend request setup, access requirements, and backend integration details.

## Stage 14 workflow update
Run `backend/database/stage14_studentnest_workflow_migration.sql` after Stage 13. It adds media for student roommate/takeover posts, takeover remaining-rent details, provider-proposed viewing appointments and student confirmation, booking appointment fields, and agent-assigned payment dispute investigations.

## Phase 4 — Student Shop / Marketplace

Phase 4 adds the Student Shop for student-to-student sales.

1. Run database migration `backend/database/stage18_marketplace_migration.sql` after Stage 17.
2. Start MySQL/XAMPP and the backend as usual.
3. Log in as a student and open **Student Shop**.
4. Use **Sell an item** to upload one or more clear pictures, choose a category and condition, enter a price and publish the item.
5. A different student can open the listing and choose **Buy safely**.
6. In mock mode, checkout asks for a payment method and payer account details. No real money is charged.
7. A successful test payment changes the item to **Reserved** and protects the funds for up to 7 days.
8. Buyer can mark the item satisfactory, making the transaction **Confirmed**, or open a complaint while funds remain protected.
9. Admin opens **Admin Console → Student Shop**. Before release, the dashboard shows the gross amount, 5% StudentNest commission and the exact net amount to the student seller.
10. Seller payout details are managed in **Student Shop → Payout account**. In demo mode these are test-verified; a live payment provider must verify the account before production settlement.
11. On release, the item becomes **Sold** and the seller sees the amount sent to their account. A refund returns the item to **Available**.

The marketplace uses a separate transaction model from accommodation payments so the existing property-payment schema and flows are not disrupted.
