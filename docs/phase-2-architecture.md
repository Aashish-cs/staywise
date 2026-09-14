# Phase 2 Architecture Notes

Status: In progress

Last updated: 2026-09-14

## Completed In This Pass

- Added `src/lib/search-presets.ts` as the single source for default search input, home search defaults, broad marketplace ranking defaults, common category presets, property type options, and listing-card search URL defaults.
- Updated home, search, and dashboard code to reuse shared search presets instead of redefining business defaults inside JSX-heavy components.
- Kept visual behavior unchanged while reducing duplication in the largest components.

## Next Phase 2 Extraction Targets

- Extract a shared StayWise header/brand/account navigation layer from home, search, listing, dashboard, and host routes.
- Extract listing-card presentation primitives so home cards, search cards, saved cards, and host cards share image/fallback/favorite/link behavior where appropriate.
- Move recommendation/result summary helpers out of large client components.
- Keep each extraction small, verified, and deployed before adding new location/map/provider features.
