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
- Kept visual behavior unchanged while reducing duplication in the largest components.

## Next Phase 2 Extraction Targets

- Move recommendation/result summary helpers out of large client components.
- Keep each extraction small, verified, and deployed before adding new location/map/provider features.
