# Phase 18: Trips

## Completed

- Rebuilt the guest dashboard trip history into three clear sections:
  - Upcoming trips.
  - Past trips.
  - Cancelled trips.
- Added richer reservation cards with:
  - Listing image and location.
  - Dates, stay length, guest count, total, status, and reservation ID.
  - Direct `Details` link to `/reservations/[id]`.
  - `Open stay` link with the reservation dates and guests preserved.
- Added status-aware cancellation behavior:
  - `Cancel trip` only appears for confirmed upcoming reservations.
  - Pending/awaiting-payment states show why cancellation is not available.
  - Past and cancelled trips are read-only history.
- Hardened the cancellation RPC:
  - `cancel_reservation` now only cancels the authenticated guest's future confirmed reservation.
  - Past confirmed reservations are not cancellable through the database function.
- Updated the cancel action to revalidate the reservation confirmation page after cancellation.

## Supabase Step

For the hosted Supabase project, run this file in the SQL Editor:

```sql
supabase/phase8_trip_management.sql
```

This updates the trusted cancellation RPC used by the dashboard.

## Verification

- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
- Local production server: `pnpm start --hostname 127.0.0.1`
- Local route smoke tests:
  - Signed-out `/dashboard` redirects to `/auth?mode=signin&next=/dashboard`.
  - Signed-out `/reservations/:id` still redirects to sign-in with the reservation return path.
  - Listing detail page still returns 200 after the trip-dashboard changes.
- Production deployment pending.

## Notes

This phase keeps trips inside the existing guest dashboard instead of creating a separate `/trips` page. The dashboard now behaves as the guest trip workspace.
