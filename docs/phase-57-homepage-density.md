# Phase 57: Homepage Marketplace Density

## What changed

- Expanded the homepage from a small set of listing rails into a denser Airbnb-style marketplace surface with more section types:
  - city-led rows
  - guest favorite stays
  - remote-work homes
  - group-friendly homes
  - great-value stays
  - trending, weekend-ready, highly rated, roomy, laptop-friendly, kitchen, and pet-friendly rows
- Increased homepage loading from 80 to 160 active listings so the page can support a larger marketplace without client-side fake fallback cards.
- Added `supabase/phase57_homepage_inventory.sql`, which seeds 120 reservable StayWise demo listings across 20 destinations.
- Disabled free provider homepage rails by default so OpenStreetMap/Nominatim rate limits do not make the homepage slow or unreliable. Expanded external provider rails remain available only when Amadeus credentials are configured or `STAYWISE_EXPANDED_HOMEPAGE_PLACES=true` is set.

## Data policy

- The new seed rows are StayWise demo inventory for QA and senior-design presentation use.
- They are not scraped from Airbnb or any marketplace.
- They live in Supabase tables, so listing cards open real StayWise detail pages and use the existing reservation flow.
- Production should eventually replace demo seed rows with host-created inventory or a licensed accommodation provider.

## Verification

- Passed: `pnpm typecheck`
- Passed: `pnpm lint`
- Passed: `pnpm test`
- Passed: `pnpm build`
- Passed: `pnpm test:e2e`
- Passed: `git diff --check`
