# Phase 30: Stripe payment architecture

## Delivered

- Added server-only `/api/payments/checkout` for owned `requires_payment` ledgers.
- Added server-only `/api/payments/webhook` with timestamp tolerance and HMAC signature verification.
- Added Stripe checkout, success, expired, and failed status handling without storing card details.
- Added service-role-only Supabase updates for webhook reconciliation.
- Kept the current reserve-now/pay-later MVP honest: `not_required` ledgers return a clear response instead of pretending payment succeeded.
- Added the explicit `STAYWISE_ENABLE_STRIPE_CHECKOUT` gate so payment-required reservations are created only when Stripe test mode is intentionally enabled.
- Added `create_payment_required_reservation` for `awaiting_payment` reservations with `requires_payment` ledgers.
- Added a guest-facing Pay now control on reservation confirmations when a real payment-required ledger exists.
- Added deployment variables for Stripe and the Supabase service role key.

## Production boundary

- No secret is exposed to the browser.
- Checkout is created from the server-authoritative integer-cent amount stored in `payment_records`.
- Webhooks, not redirect query parameters, decide payment success.
- The payment routes are inactive until a reservation ledger is explicitly `requires_payment` and the server-side Stripe flag plus secret are present.

## Remaining

- Configure Stripe webhook delivery to `/api/payments/webhook` in the deployed environment.
- Apply `supabase/phase30_payment_required_reservations.sql` and set `STAYWISE_ENABLE_STRIPE_CHECKOUT=true` only when ready to test Stripe end-to-end.
