# Phase 30: Stripe payment architecture

## Delivered

- Added server-only `/api/payments/checkout` for owned `requires_payment` ledgers.
- Added server-only `/api/payments/webhook` with timestamp tolerance and HMAC signature verification.
- Added Stripe checkout, success, expired, and failed status handling without storing card details.
- Added service-role-only Supabase updates for webhook reconciliation.
- Kept the current reserve-now/pay-later MVP honest: `not_required` ledgers return a clear response instead of pretending payment succeeded.
- Added deployment variables for Stripe and the Supabase service role key.

## Production boundary

- No secret is exposed to the browser.
- Checkout is created from the server-authoritative integer-cent amount stored in `payment_records`.
- Webhooks, not redirect query parameters, decide payment success.
- The payment routes are inactive until a reservation ledger is explicitly `requires_payment`.

## Remaining

- Add an idempotent Supabase migration/RPC that creates `awaiting_payment` reservations when Stripe mode is intentionally enabled.
- Add a guest-facing “Pay now” action when that migration and Stripe test credentials are configured.
- Configure Stripe webhook delivery to `/api/payments/webhook` in the deployed environment.
