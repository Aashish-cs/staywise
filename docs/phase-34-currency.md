# Phase 34 - Real currency strategy

Status: current pass complete.

## Delivered

- Added `src/lib/currency.ts` as the shared USD currency helper.
- Centralized `Intl.NumberFormat` usage for dollar amounts and integer-cent amounts.
- Routed reservation money formatting and shared listing price display through the currency helper.
- Kept the current minimum viable currency strategy to USD, matching Supabase `payment_records.currency`.
- Kept trusted payment amounts in integer cents and visible legacy reservation totals in whole-dollar display.

## Notes

- The current reservation schema stores `nightly_rate` and `total_amount` as whole-dollar integers.
- Pricing quotes now carry both dollar values and cent values so later schema changes can move more fields to cents without rewriting UI components.
- Multi-currency support remains out of scope until provider, locale, tax, and payout rules exist.

## Verification

- Run `pnpm typecheck`, `pnpm lint`, and `pnpm build`.
- Smoke home, search, listing detail price rows, and auth redirects.
