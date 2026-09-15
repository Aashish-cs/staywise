# Phase 8 Real Listing Search

Status: Completed foundation and verified locally

Last updated: 2026-09-14

## Added In This Phase

- `searchPublicListings` in `src/lib/listing-data.ts` now filters listings through Supabase before the search UI renders.
- `/search` no longer loads the broad public listing set and then relies on browser-side filtering.
- `/api/recommendations` uses the same server-side search path.
- Server filters now cover:
  - destination city/state/country/neighborhood
  - current-location coordinate bounds
  - dates through the existing availability RPC
  - guests/capacity
  - max nightly price
  - property type
  - bedrooms/beds using the current `bedrooms` column
  - bathrooms
  - amenities through `listing_amenities`
- Search URLs support `page`, `beds`, and `minBeds` aliases.
- The search results UI renders refresh-safe pagination links and handles out-of-range pages as an empty page state instead of a server error.

## Important Constraint

The production Supabase project has not necessarily run the Phase 6 location metadata migration yet, so the Phase 8 destination query intentionally uses the stable columns already present in production: `city`, `state`, `country`, and `neighborhood`.

After the Phase 6 migration is confirmed in Supabase, search can expand to `address_city` and `address_region`.

## Known Follow-Up

Phase 9 should continue hardening date availability at the database/search layer and add stronger empty-state messaging for fully booked date ranges.
