# Phase 16: Booking Engine

## Completed

- Centralized booking limits in `src/lib/reservation-utils.ts`:
  - Minimum stay: 1 night.
  - Maximum stay: 30 nights.
  - Maximum submitted guests: 16 before listing-capacity checks.
- Hardened date validation:
  - Rejects invalid ISO dates instead of allowing browser-normalized dates.
  - Rejects past check-ins.
  - Rejects checkout dates before or equal to check-in.
  - Rejects stays longer than 30 nights.
- Updated the listing reservation panel:
  - Disables reservation submission for invalid or too-long date ranges.
  - Shows the validation message before the user submits.
  - Caps the checkout date picker to the supported maximum stay.
  - Keeps final pricing tied to valid date ranges only.
- Updated the availability API and shared listing availability path so search/detail availability checks use the same booking-date rules.
- Updated the reservation server action so form submissions validate dates and guests before calling the database RPC.
- Updated the trusted Supabase RPC strategy:
  - `create_reservation` now rejects stays longer than 30 nights.
  - `check_listing_availability` and `get_available_listing_ids` now reject too-long ranges.
  - Existing trusted checks remain in place for account role, active listing existence, host ownership, capacity, active reservation overlap, host availability blocks, trusted nightly rate, trusted total, and payment ledger creation.
- Removed the production build dependency on Google-hosted `next/font` downloads by using local/system font stacks.

## Supabase Step

For the hosted Supabase project, run this file in the SQL Editor:

```sql
supabase/phase7_booking_hardening.sql
```

This updates the database functions that enforce the final trusted reservation rules.

## Verification

- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
- Local production server: `pnpm start --hostname 127.0.0.1`
- API smoke tests:
  - Valid 3-night range returned available.
  - 41-night range returned a 400 with the maximum-stay message.
  - Impossible date returned a 400 with the valid-date message.
- Browser QA:
  - Invalid 41-night range shows `Not priced`, the 30-night warning, and a disabled `Choose valid dates` CTA.
  - Valid 3-night range shows the expected subtotal, service estimate, total, live availability message, and `Sign in to reserve` CTA.
  - Browser console had no warnings or errors during the reservation-panel QA pass.

## Notes

Phase 16 does not add a separate reservation confirmation page. That belongs to Phase 17.
