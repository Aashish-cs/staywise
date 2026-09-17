# Phase 19: Favorites

## Completed

- Added a protected `/favorites` page for saved stays.
- Added direct favorite-listing loading through the data layer so saved stays are read from persisted `favorites` rows in saved order.
- Added a client favorites experience with:
  - Saved count.
  - Saved listing cards.
  - Persisted remove behavior through the existing favorite server action.
  - Optimistic UI rollback through the shared `useSavedListings` hook.
  - Empty state with a search CTA.
  - Host-account guard explaining that saving stays is guest-only.
- Updated the favorite action to revalidate `/favorites`.
- Protected `/favorites` in middleware.
- Added navigation to saved stays from the account menu and dashboard.

## Verification

- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
- Local production server: `pnpm start --hostname 127.0.0.1`
- Local route smoke tests:
  - Signed-out `/favorites` redirects to `/auth?mode=signin&next=/favorites`.
  - Listing detail page still returns 200.
  - Search page still returns 200.
- Production deployment pending.

## Notes

The database already has the correct unique favorite relationship through the `(guest_id, listing_id)` primary key and RLS policy requiring a guest-owned favorite row.
