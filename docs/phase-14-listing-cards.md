# Phase 14: Listing Cards

## Completed

- Added shared listing card metadata primitives:
  - `ListingLocationLine`
  - `ListingFacts`
  - image fallback handling inside `ListingCardMedia`
- Updated saved-state button copy so saved cards read `Saved` instead of always saying `Save`.
- Updated search result cards:
  - Card body now navigates to the listing detail page.
  - Save, Preview, and Reserve controls are separate accessible actions.
  - Preview keeps the selected listing/map side panel synchronized.
  - Cards show real listing facts, price, location, optional distance, and match reason.
- Updated home listing rails and spotlight cards to use the shared facts/location pattern.
- Updated guest dashboard recommendation and saved-stay cards to use the shared facts/location pattern.
- Updated host listing rows to use the same listing facts and location treatment.
- Kept ratings/reviews off listing cards until real review data is implemented.

## Verification

- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
- Local production server: `pnpm start --hostname 127.0.0.1`
- Browser QA:
  - Search cards at `/search?destination=Dallas&guests=2&budget=300&purpose=remote-work&amenities=Fast+Wi-Fi&amenities=Workspace`
  - Verified card body navigation links, separate Save/Preview/Reserve actions, and Preview side-panel sync.
  - Verified 390px mobile layout has no horizontal overflow and card actions fit.
  - Verified homepage rail card image framing and metadata layout.

## Notes

Listing cards still avoid fabricated ratings. Phase 20 can add real ratings after eligible reservation-based reviews are implemented.
