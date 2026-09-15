# Phase 13: Interactive Map

## Completed

- Replaced the search results map iframe with a Leaflet-powered interactive map panel.
- Added production dependency `leaflet` and dev typings `@types/leaflet`.
- Kept OpenStreetMap attribution visible in the map controls and preserved an external OpenStreetMap link for the fitted result area.
- Added price markers for every displayed listing in map mode.
- Added fit-to-bounds behavior across the displayed listings and the current-location marker when present.
- Added click and hover synchronization:
  - Clicking a price marker updates the selected listing and the "Open listing" CTA.
  - Hovering/focusing a map list row highlights the same listing state.
- Added a current-location marker path for `nearLat`/`nearLng` searches without exposing exact private listing addresses.
- Added loading and error states for the client-side map surface.
- Preserved the Phase 12 responsive behavior:
  - Desktop: list plus sticky side map.
  - Mobile: map mode replaces listing cards with the map/detail panel.

## Verification

- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
- Local production server: `pnpm start --hostname 127.0.0.1`
- Desktop browser QA:
  - `/search?destination=Dallas&guests=2&budget=300&purpose=remote-work&amenities=Fast+Wi-Fi&amenities=Workspace`
  - Verified map mode renders price markers, zoom controls, OpenStreetMap attribution, and marker click selection.
- Mobile browser QA at 390px width:
  - Verified no horizontal overflow.
  - Verified List/Map toggle behavior.
  - Verified mobile map panel, marker framing, listing rows, and CTA selection sync.
- Current-location URL QA:
  - `/search?destination=Near+me&nearLat=32.781&nearLng=-96.798&guests=2&budget=300&purpose=remote-work`
  - Verified near-me result summary, distance labels, current-location marker, and blue-marker explanatory copy.

## Notes

The search map now uses listing coordinates and current-location coordinates, but it still avoids showing exact private addresses. Listing detail pages keep their simpler OpenStreetMap embed for now; Phase 15 can upgrade listing detail maps after the detail page redesign.
