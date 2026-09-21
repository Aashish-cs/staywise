# Phase 37 - Error handling

Status: current pass complete.

## Delivered

- Audited visible failure paths for Supabase reads, geocoder APIs, booking conflicts, auth redirects, payments, and image uploads.
- Quieted expected missing-review-table fallbacks for listing detail and dashboard review lookups.
- Kept genuine review query errors logged so production failures are still diagnosable.
- Preserved the existing safe UI behavior: listings show `New / No reviews yet` when reviews are unavailable.

## Notes

- The live Supabase project still needs the reviews migration for real review display.
- Public API rate limiting and toast-level global error handling remain future hardening work.
- This pass focuses on removing noisy expected setup errors while keeping real failures visible.

## Verification

- Run `pnpm typecheck`, `pnpm lint`, and `pnpm build`.
- Smoke home, search, listing detail, profile redirect, and listing detail without missing-review console noise.
