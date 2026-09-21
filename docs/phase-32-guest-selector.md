# Phase 32 - Guest selector

Status: current pass complete.

## Delivered

- Added a shared `GuestSelector` component for the homepage search bar, search filters, and listing reservation panel.
- Split guest input into adults, children, infants, and pets while keeping adults plus children as the authoritative capacity count.
- Enforced max guest limits in the selector so users cannot request more adults/children than the stay allows.
- Persisted guest breakdown values through search URLs while keeping the existing `guests` value for ranking, filtering, and reservation submission.

## Notes

- Infants and pets are visible in the UX now, but the current reservation table still stores the existing total guest count only.
- A later reservation-data migration should add first-class adult, child, infant, and pet fields before production payments or host rules depend on that breakdown.

## Verification

- Run `pnpm typecheck`, `pnpm lint`, and `pnpm build`.
- Smoke homepage search, search filters, and a listing reservation form with adults, children, infants, and pets.
