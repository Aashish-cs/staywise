# Phase 49: Testing

## What changed

- Added Vitest unit testing with `vitest.config.mts`.
- Added Playwright browser testing with `playwright.config.ts`.
- Added package scripts:
  - `pnpm test`
  - `pnpm test:unit`
  - `pnpm test:e2e`
- Added unit tests for:
  - distance calculations and coordinate formatting
  - reservation pricing and integer-cent fee totals
  - night counting, date validation, and half-open date range overlap behavior
  - recommendation filtering, scoring, saved-listing boosts, and search validation
  - search URL parsing, clamping, coordinate serialization, and pagination
- Added browser smoke tests for:
  - marketplace home shell
  - Dallas search result page and listing-link query preservation
  - listing detail page and back-to-search context
  - unauthenticated dashboard/host redirects to sign in
  - branded 404 page

## Notes

- Authenticated browser flows such as real favorite persistence, real reservation creation, completed-trip review submission, host create/publish, and host reservation management still need seeded test accounts or a dedicated test Supabase project before they can run safely in automation.
- The new tests do not require storing real user credentials in the repository.

## Verification

- Passed: `pnpm test`
- Passed: `pnpm test:e2e`
- Passed: `pnpm typecheck`
- Passed: `pnpm lint`
- Passed: `pnpm build`
- Passed: `git diff --check`
