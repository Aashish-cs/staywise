# Phase 43 - Performance

## Scope

Phase 43 focused on reducing unnecessary client work on search pages and making external location lookup responses cache-friendly. The goal was to improve perceived performance without changing the product behavior.

## Completed

- Split the Leaflet/OpenStreetMap search map into `src/components/search-map-panel.tsx`.
- Lazy-loaded the search map panel from `SearchResultsSection`, so normal list-view search no longer carries the map panel code path until Map view is opened.
- Added a lightweight map-panel skeleton while the dynamic chunk loads.
- Kept the existing Leaflet package import lazy inside the map panel, so the map library still loads only after the panel mounts.
- Added `useDeferredValue` around search ranking so filter typing and controls stay responsive while the result ranking catches up.
- Passed the deferred search state into result rendering/map rendering so displayed rankings and map markers stay aligned.
- Added successful-response cache headers to location search and reverse-location APIs:
  - `public, max-age=86400`
  - `s-maxage=2592000`
  - `stale-while-revalidate=86400`
- Preserved the existing Nominatim in-memory cache and Next fetch revalidation layer.

## Verification

- `pnpm typecheck`
- `pnpm lint`
- `git diff --check`
- `pnpm build`
- Built-app local smoke on `http://127.0.0.1:3012`
  - `/` returned 200
  - `/search?destination=Dallas&guests=2&budget=300&purpose=remote-work` returned 200
  - `/listings/33333333-3333-4333-8333-333333333333?checkIn=2026-10-01&checkOut=2026-10-04&guests=2` returned 200
  - `/dashboard`, `/favorites`, and `/host` redirected to sign-in
  - `/profile` streamed the expected sign-in redirect marker
  - `/api/locations/search?query=Dallas` returned 200 with the expected `Cache-Control` header

## Notes

Further performance work can still add route-level metrics or a bundle analyzer, but this pass avoided adding new tooling dependencies and focused on concrete runtime changes.
