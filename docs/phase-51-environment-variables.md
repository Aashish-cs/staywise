# Phase 51: Environment Variables

## What changed

- Reworked `.env.example` into a documented setup template.
- Grouped public browser-safe values separately from server-only secrets.
- Added missing optional variables:
  - `OPENAI_API_KEY`
  - `OPENAI_MODEL`
  - `MAPBOX_ACCESS_TOKEN` as a reserved future-provider placeholder
  - `PLAYWRIGHT_BASE_URL`
  - `PLAYWRIGHT_PORT`
- Updated README and deployment docs with the full variable list and notes about optional/free-provider behavior.

## Current Provider Notes

- Supabase public URL and anon key are required for real auth, listings, favorites, trips, and reservations.
- OpenStreetMap/Nominatim is the current free location provider and runs server-side.
- Mapbox is not used by current runtime code; the env placeholder is documented as reserved.
- AI search works without an AI key through the deterministic parser.
- Stripe variables are optional until payment-required reservations are enabled.
- `SUPABASE_SERVICE_ROLE_KEY` must stay server-only and is only needed for trusted admin/webhook paths.
- Playwright variables are for local/CI QA only.

## Verification

- Passed: env usage audit with `rg "process\\.env|NEXT_PUBLIC_|SUPABASE_|NOMINATIM|STAYWISE_AI|OPENAI|STRIPE|PLAYWRIGHT"`.
- Passed: `git diff --check`
