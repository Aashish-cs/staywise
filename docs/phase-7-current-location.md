# Phase 7 Current Location / Near Me

Status: Completed foundation and verified locally

Last updated: 2026-09-14

## Added In This Phase

- Browser current-location control in the search filter panel.
- User-visible states for:
  - idle
  - loading
  - accepted
  - denied
  - unsupported browser
  - timeout
  - unavailable position
  - retry after failure
- Server-side reverse geocoding endpoint at `/api/locations/reverse`.
- Shared distance helper in `src/lib/location-distance.ts`.
- Search URL support for `nearLat` and `nearLng`.
- Coordinate-based nearby filtering in the recommendation engine.
- Distance-aware scoring and distance labels on cards, fit panel, and map list rows.
- Manual destination edits clear near-me coordinates so typed city search and current-location search do not conflict.

## Provider Notes

Reverse geocoding uses OpenStreetMap/Nominatim from the server only. Calls include identifying headers, optional `NOMINATIM_EMAIL`, long-lived cache settings, and attribution in the UI.

Official references:

- https://operations.osmfoundation.org/policies/nominatim/
- https://nominatim.org/release-docs/latest/api/Reverse/

## Known Follow-Up

Phase 8 still needs true server-side database search and pagination. Phase 13 still needs a richer synchronized map interface; the current map panel remains an OpenStreetMap embed.
