# Phase 1 Engineering Audit

Status: Completed

Last updated: 2026-09-14

## Required Checks

| Check | Result |
| --- | --- |
| `pnpm install` | Passed, dependencies already up to date |
| `pnpm lint` | Passed |
| `pnpm typecheck` | Passed |
| `pnpm build` | Passed |
| Local home smoke test | Passed, `/` returned 200 |
| Local search smoke test | Passed, `/search?destination=Dallas...` returned 200 |
| Local listing smoke test | Passed, known seeded listing returned 200 |
| Local recommendations API smoke test | Passed, Dallas returned 3 listings |
| Production deployment smoke test | Passed on `https://staywise-tau.vercel.app` |

## Issues Fixed In This Phase Pass

- Removed fake rating and review fields from the `Listing` type.
- Removed generated rating/review values from Supabase listing mapping.
- Removed fake host response-time and "top host" derivations.
- Updated recommendation scoring so it no longer rewards generated host/rating signals.
- Changed host UI to show verified host/account status instead of fake response metrics.
- Removed fake static month availability from listing data, ranking, URL parsing, AI parsing, and search UI.
- Removed dormant rating search parameters until real reviews exist.
- Added a master phase checklist so phases 0-56 can be tracked without skipping tasks.
- Fixed the Supabase host profile join by using the explicit `profiles!listings_host_id_fkey` relationship.
- Updated README and architecture docs to clearly label seed data, real current capabilities, and future limitations.

## Current Architecture Observations

- Next.js App Router is already in place.
- Supabase Auth, Postgres, RLS, server actions, and RPC-backed reservations are already implemented.
- Listings are read from Supabase; the UI no longer relies on hardcoded client-side listing arrays.
- Availability checks are already connected through Supabase RPC helpers.
- Reservation creation uses a database RPC with overlap protection, capacity checks, host-own-listing prevention, and server-calculated totals.
- The current recommendation engine is deterministic and explainable, not LLM-dependent.
- The app still has large components that should be split during Phase 2 and design-system work.

## Important Remaining Phase 1 Findings

### Data And Database

- Real reviews are not implemented yet. The product correctly avoids showing fake reviews, but Phase 20 must add the real reviews table/workflow.
- Listing host data is minimal. The app can display the host profile name when present, but richer host profiles belong to Phase 27.
- Host-created listings still use pasted image URLs instead of Supabase Storage uploads.
- Listings store city/state/neighborhood and coordinates but do not yet store full structured address, provider place id, or formatted address.
- Search still loads a bounded set of public listings and ranks in application code; Phase 8 must move toward server-side search queries and pagination.

### Location And Maps

- OpenStreetMap iframes are used for current map display.
- Real place autocomplete, geocoding, reverse geocoding, current-location search, and distance calculation are not implemented yet.
- Listing coordinates come from Supabase rows, but no provider-backed address verification exists yet.

### UI And Product

- Home, search, listing, dashboard, host, reservation, and auth pages exist.
- Several components are too large for production maintainability:
  - `src/components/search-experience.tsx`
  - `src/components/marketplace-home.tsx`
  - `src/app/listings/[id]/page.tsx`
  - `src/components/host-listing-form.tsx`
  - `src/lib/listing-data.ts`
- There is no reusable design-system layer yet.
- Favorites persist, but there is not yet a dedicated favorites page.
- Trips exist inside the guest dashboard but are not yet separated into a full `/trips` experience.
- Host listing creation works but is not yet a guided multi-step wizard.

### Auth And Security

- Signup, signin, signout, callback, password reset, and protected account routing exist.
- Header logo links are plain navigation links in home, search, listing, dashboard, and host routes. No source-level evidence was found that the logo submits sign-out; full browser click QA remains part of Phase 50.
- Server actions check user/session/role for favorites, listings, and reservations.
- RLS exists for profiles, listings, listing images, amenities, trips, favorites, and reservations.
- A full RLS audit against every future table remains required in Phase 4.
- The previously exposed Supabase secret must be rotated before final presentation.

### Missing Product Areas From Later Phases

- Supabase Storage image uploads.
- Reviews.
- Profile/account settings.
- Payment architecture.
- Real geocoder/location provider abstraction.
- Current location and nearby search.
- Real interactive map marker system.
- Date picker and guest selector components.
- Dedicated confirmation page.
- Dedicated favorites/trips routes.
- Toast system.
- Custom error/not-found states.
- Automated tests and Playwright QA.

## No-Go Items Confirmed

- No fake review UI should be reintroduced.
- No fake payment success should be added.
- No scraped Airbnb inventory or Airbnb branding should be used.
- No service-role key should be exposed to the browser.
- No production runtime fallback to demo arrays should be added.

## Phase 2 Handoff

- Start by extracting shared data/search/listing UI modules in small, tested steps.
- Keep large visual redesign, location provider work, and map replacement behind later phases so architecture improves before feature size grows.
