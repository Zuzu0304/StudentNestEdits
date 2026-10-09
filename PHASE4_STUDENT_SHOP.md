# StudentNest Phase 4 — Student Shop / Marketplace

Phase 4 adds a student-only marketplace for household and student-home equipment.

## Buyer flow

Shop → view item → message seller if needed → buy safely → enter payment method + payer details → funds protected → inspect/receive item → mark satisfactory OR lodge complaint → admin reviews → release or refund.

## Seller flow

Student Shop → Sell an item → upload clear images → enter category, condition, price and description → listing becomes available → buyer pays → item becomes reserved → seller sees buyer contact details and protected-payment status → admin release after buyer confirmation → 95% payout / 5% platform commission.

## Admin flow

Admin Console → Student Shop → see listings and transactions → see gross amount and exact 5% commission → release to seller when confirmed, or assign a complaint to an internal agent and refund/release after investigation.

## Database

Run `backend/database/stage18_marketplace_migration.sql` after Stage 17.

## Demo mode

`PAYMENT_MODE=mock` remains the safe local/supervisor-demo mode. Payment method and test payer details are captured, but no real funds move. A production PSP integration is still required for actual collection, protected funds and payout settlement.
