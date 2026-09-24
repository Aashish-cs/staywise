# Phase 44 - SEO and metadata

## Scope

Phase 44 focused on making public StayWise pages shareable and crawler-friendly while keeping private/authenticated surfaces out of search indexes.

## Completed

- Added a shared SEO helper in `src/lib/seo.ts` for:
  - `metadataBase`
  - private-page `noindex, nofollow`
  - canonical path formatting
  - safe meta-description truncation
- Added a StayWise SVG favicon at `public/favicon.svg`.
- Strengthened root metadata with app name, canonical URL, keywords, favicon, OpenGraph, and Twitter summary metadata.
- Added homepage metadata for “Smart Stays, Better Days.”
- Added dynamic search metadata:
  - destination-specific titles such as `Dallas stays`
  - canonical `/search`
  - filtered query URLs marked `noindex, follow`
- Improved listing-detail metadata:
  - dynamic listing title with city
  - truncated description
  - canonical listing URL
  - OpenGraph and Twitter image metadata
  - no exact/private address exposure
- Added `robots` noindex metadata to auth, guest dashboard, saved stays, profile, reservations, host dashboard, host onboarding, host edit listing, and host reservation pages.
- Added `robots.txt` route that allows public marketplace paths and disallows auth, account, host, reservation, and API paths.
- Added `sitemap.xml` route with home, search, and active public listings using an anon Supabase read that does not require cookies.

## Verification

- `pnpm typecheck`
- `pnpm lint`
- `git diff --check`
- `pnpm build`
- Built-app local smoke on `http://127.0.0.1:3012`
  - `/` returned 200 with `Smart Stays, Better Days | StayWise`
  - filtered `/search?...destination=Dallas...` returned 200 with `Dallas stays | StayWise` and `noindex, follow`
  - listing detail returned 200 with dynamic listing title metadata
  - `/robots.txt` returned 200
  - `/sitemap.xml` returned 200 and included listing URLs
  - `/favicon.svg` returned 200
  - `/dashboard` and `/host` still redirected to sign-in

## Notes

Private account, host, reservation, and auth pages are intentionally excluded from indexing. Public listing metadata uses neighborhood/city/title/description only and does not expose exact private addresses.
