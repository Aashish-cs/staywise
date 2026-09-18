# Phase 15: Listing Detail Page

## Completed

- Confirmed the listing detail page includes the core production surface:
  - Title, verified listing status, location, save/share actions.
  - Host badge.
  - Description, traits, highlights, amenities, house rules, safety, booking notes.
  - StayWise fit signals and real review summary/review cards.
  - OpenStreetMap location section with approximate-area language.
  - Sticky desktop reservation panel with date, guests, pricing, availability check, auth handling, and trust notes.
- Replaced the static photo grid with `ListingPhotoGallery`, a client-side gallery with:
  - Gallery image grid.
  - "Show all photos" action.
  - Full-screen lightbox dialog.
  - Close button and thumbnail selection.
- Added a mobile sticky reserve bar:
  - Shows nightly price and neighborhood.
  - Links to the reservation panel via `#reserve`.
  - Adds bottom page padding on mobile so it does not cover page content.

## Verification

- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
- Local production server: `pnpm start --hostname 127.0.0.1`
- Browser QA:
  - Opened `/listings/11111111-1111-4111-8111-111111111111?...`.
  - Verified the photo lightbox opens and closes.
  - Verified availability check resolves in the reservation panel.
  - Verified 390px mobile layout has no horizontal overflow.
  - Verified the mobile Reserve CTA links to `#reserve`.

## Notes

Phase 20 now loads persisted review data and only shows ratings after completed-reservation reviews exist. New listings display `New · No reviews yet` until a legitimate review is submitted.
