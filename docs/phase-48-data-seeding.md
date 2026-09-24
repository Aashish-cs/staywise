# Phase 48: Data Seeding

## What changed

- Added explicit marketplace data status to the listing data layer:
  - `ready` for successful Supabase reads.
  - `unconfigured` when Supabase environment variables are missing.
  - `error` when Supabase queries fail after retry.
- Updated the home page and search page to show honest live-data setup/error states instead of silently treating provider failures as normal search misses.
- Kept the production runtime free of hardcoded listing arrays or fake fallback inventory.
- Hardened `supabase/phase2_seed.sql` comments and location metadata so demo listings are clearly synthetic StayWise records with real city/neighborhood coordinates and public stock imagery.

## Seed Data Policy

- Seed rows are for development, QA, and senior-design demos only.
- Seed rows are not scraped from Airbnb or any other marketplace.
- Production can use host-created rows and/or clearly documented StayWise demo rows from Supabase, but the app must never fabricate client-side listings when Supabase is missing or failing.
- Empty Supabase results remain a valid empty marketplace state.
- Supabase failures now surface as setup/error states so reviewers can tell the difference between "no matching stays" and "live data did not load."

## Verification

- Passed: `pnpm typecheck`
- Passed: `pnpm lint`
- Passed: `pnpm build`
- Passed: `git diff --check`
- Passed local production smoke: home, Dallas search with `page=2`, listing detail with `page=2`, and unknown-route 404.
