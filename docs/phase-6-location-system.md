# Phase 6 Real Location System

Status: Completed foundation and verified locally

Last updated: 2026-09-14

## Provider Choice

StayWise now uses a server-side OpenStreetMap/Nominatim location lookup foundation.

Important policy constraints from the official Nominatim usage policy:

- Keep traffic moderate and below the public service limits.
- Send an identifying User-Agent or Referer.
- Display OpenStreetMap attribution.
- Cache results.
- Do not implement client-side autocomplete with the public API.

Sources:

- https://operations.osmfoundation.org/policies/nominatim/
- https://nominatim.org/release-docs/latest/api/Search/

## Added In This Phase

- `src/lib/location-service.ts`: server-side search service using Nominatim with:
  - query normalization
  - max 5 results
  - United States country filter
  - settlement-focused results
  - 30-day fetch/cache revalidation
  - identifiable headers
  - optional `NOMINATIM_EMAIL`
- `src/app/api/locations/search/route.ts`: explicit user-triggered place search endpoint for future UI.
- `/search` now resolves submitted destinations on the server and passes the verified location into the UI.
- Search filters show verified OpenStreetMap place status and attribution when a destination has been resolved.
- `supabase/phase6_location_foundation.sql` adds provider-backed listing location metadata columns.

## Database Foundation

The `listings` table now supports:

- `place_provider`
- `place_provider_id`
- `formatted_address`
- `address_city`
- `address_region`
- `address_country`
- `address_country_code`
- `bounds_south`
- `bounds_north`
- `bounds_west`
- `bounds_east`

The migration adds provider and bounds constraints plus indexes for provider ids and structured city/region search.

## What This Does Not Do Yet

- It does not call Nominatim on every keystroke.
- It does not replace the Phase 8 server-side listing search work.
