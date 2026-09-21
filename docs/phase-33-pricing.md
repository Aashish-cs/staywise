# Phase 33 - Price calculation

Status: current pass complete.

## Delivered

- Added a shared integer-cent reservation pricing engine in `src/lib/pricing.ts`.
- Centralized nightly subtotal, cleaning fee, StayWise service fee, estimated tax, total, and total cents in one quote object.
- Rounded service fees to whole-dollar cents to match the current reservation schema and trusted Supabase RPC.
- Kept the current production policy honest: cleaning and tax are explicit zero-value lines until listing-level cleaning fees and jurisdictional tax rules exist.
- Updated the listing reservation panel and reservation confirmation page to use the shared pricing breakdown.
- Added a Supabase migration that refreshes the trusted `create_reservation` RPC with named pricing variables matching the app policy.

## Notes

- The live reservation table currently stores only `total_amount`, `nightly_rate`, and `guests`.
- A later schema migration should persist fee-line columns before hosts can configure cleaning fees or taxes.
- Payment records still use the trusted reservation total in integer cents.

## Verification

- Run `pnpm typecheck`, `pnpm lint`, and `pnpm build`.
- Smoke reservation panel pricing, reservation confirmation pricing, home, search, and auth redirects.
