# Phase 24: Host Listing Management

## Completed

- Added a server-authorized publish/unpublish action scoped to the signed-in host’s own listing.
- Added clear published/unpublished status in the host portfolio.
- Added visible-in-search/hidden-from-search state and direct host controls.
- Added a protected host edit route for title, description, location, property type, price, and capacity details.
- Preserved public listing behavior so unpublished inventory is excluded from guest search.
- Added owner-only photo management on the edit page with primary-photo selection and photo removal.
- Added non-destructive archive behavior that hides a listing from guest search while preserving ownership, photos, and reservation history.
- Added a listing management archive panel to the edit page so archive control is separate from normal save changes.

## Follow-up

- Add full amenity editing on the edit route.
- Add richer host-side activity history beyond the reservation feed.

## Verification

- `pnpm typecheck`
- `pnpm lint`
