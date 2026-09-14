# Phase 2 Architecture Notes

Status: In progress

Last updated: 2026-09-14

## Completed In This Pass

- Added `src/lib/search-presets.ts` as the single source for default search input, home search defaults, broad marketplace ranking defaults, common category presets, property type options, and listing-card search URL defaults.
- Updated home, search, and dashboard code to reuse shared search presets instead of redefining business defaults inside JSX-heavy components.
- Added `src/components/staywise-header.tsx` with shared StayWise brand/header shell and reusable account menu.
- Updated home, search, listing detail, dashboard, and host pages to reuse the shared header shell while preserving page-specific nav/actions.
- Added `src/components/listing-card-primitives.tsx` with shared listing image/link media and save-button primitives.
- Updated home cards, search result cards, dashboard recommendation/saved cards, and host listing rows to reuse shared listing-card media behavior.
- Added `src/lib/search-results.ts` for search result sorting, summary text, and active filter labels.
- Updated search results UI to consume shared pure helpers instead of keeping result logic inside JSX-heavy component code.
- Added `src/lib/listing-map.ts` as the shared source for listing coordinate fallback plus OpenStreetMap embed and external map URLs.
- Updated search map preview and listing detail map sections to use shared map helpers instead of duplicating provider URL logic.
- Added transient retry handling around the shared public listing loader so short Supabase gateway/config failures do not immediately render empty search or recommendation results.
- Added `src/hooks/use-saved-listings.ts` so home, search, and listing detail share one optimistic saved-stay flow with the same guest/auth handling and rollback behavior.
- Added `src/hooks/use-ai-search.ts` so home and search share one AI-search submit flow, including validation, API parsing, loading, error messages, and URL navigation.
- Added `src/components/search-results-section.tsx` so search result cards, sort/map toolbar, empty state, fit panel, and map panel are separated from the main search state container.
- Added `src/components/search-filters-panel.tsx` so AI prompt, destination/date/guest/budget inputs, advanced filters, trip style, amenities, and search action are separated from the main search state container.
- Added `src/components/marketplace-listing-rails.tsx` so marketplace listing rails and home listing cards are separated from the main home page state container.
- Kept visual behavior unchanged while reducing duplication in the largest components.

## Next Phase 2 Extraction Targets

- Continue extracting small pure helpers before changing database/location/search behavior.
- Keep each extraction small, verified, and deployed before adding new provider-backed search or map features.
