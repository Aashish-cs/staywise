# Phase 38 - Loading states

Status: current pass complete.

## Delivered

- Added shared loading skeleton components for marketplace home, search, listing detail, trips/dashboard, and host workspace.
- Added route-level `loading.tsx` files for `/`, `/search`, `/listings/[id]`, `/dashboard`, and `/host`.
- Moved the home route into a route group so `/` can use the marketplace skeleton without forcing that layout onto unrelated routes.
- Kept the root `app/loading.tsx` as a neutral app-shell fallback for redirects and routes without a dedicated skeleton.
- Matched the existing StayWise page structure, spacing, borders, and listing-card ratios so loading states feel intentional instead of blank.

## Notes

- These are route-level skeletons. Component-level Suspense boundaries can be added later around slower widgets such as maps, AI search, and host image management.
- Dashboard and host loading states may only appear briefly on fast connections, but they now exist for slower Supabase responses and cold starts.

## Verification

- Run `pnpm typecheck`, `pnpm lint`, and `pnpm build`.
- Smoke home, search, listing detail, profile redirect, and live deployment.
