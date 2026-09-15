# Phase 10 Airbnb-Quality Home Page

Status: Completed foundation and verified locally

Last updated: 2026-09-14

## Product Direction

StayWise now treats the home page as a marketplace discovery surface instead of a SaaS-style landing page. The implementation uses the same high-level travel marketplace patterns users expect: a prominent destination/date/guest search, category navigation, host/account actions, and immediately visible real stays.

The page remains legally distinct from Airbnb:

- no Airbnb branding, copy, inventory, or scraped marketplace content
- StayWise slogan and product language remain primary
- real StayWise/Supabase listing records drive cards, links, pricing, and match reasons
- AI messaging is framed around StayWise matching, not copied marketplace claims

## Added In This Phase

- Reworked the home hero into a compact premium search surface.
- Added a horizontal category discovery strip tied to real search URLs.
- Added a large real-listing spotlight card using the top-ranked StayWise listing.
- Added supporting real-listing spotlight cards with save actions and listing links.
- Moved proof points into compact operational signals instead of a separate SaaS proof section.
- Refined marketplace rails with square imagery, match-score badges, cleaner spacing, and consistent listing URLs.
- Tuned the homepage ranking preset to use a realistic public-marketplace budget so match reasons do not read like debug/demo copy.
- Kept the StayWise logo as a normal home link so it does not trigger sign-out.

## Verification

- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
- Local production render with `next start`
- Browser visual pass at a narrow viewport for header, search, category strip, listing spotlight, save buttons, and rails

## Known Follow-Up

Phase 11 should extract the repeated button, input, category chip, card, and badge styling into consistent design-system primitives before broader search and listing page polish.
