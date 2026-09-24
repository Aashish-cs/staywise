# Phase 47: URL And Navigation Quality

## What changed

- Preserved the active search page in listing-detail URLs generated from search results and map cards.
- Preserved the active search page when a listing detail page builds its "Back to stays" search URL.
- Updated the listing photo gallery to push a lightweight `#photos` history entry when opened.
- Browser Back now closes the photo gallery instead of unexpectedly leaving the listing page.
- Close and Escape still dismiss the gallery and restore focus to the trigger.

## Behavior

- Search result links remain shareable and keep destination, dates, guests, budget, purpose, amenities, coordinates, and page context.
- Listing detail back links return guests to the same search page when a `page` query parameter is present.
- The gallery remains a stateful dialog, but it cooperates with browser history through a temporary hash entry.

## Verification

- Passed: `pnpm typecheck`
- Passed: `pnpm lint`
- Passed: `pnpm build`
- Passed: `git diff --check`
- Passed local production smoke: home, Dallas search with `page=2`, listing detail with `page=2`, and unknown-route 404.
