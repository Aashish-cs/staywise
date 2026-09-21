# Phase 36 - Validation

Status: current pass complete.

## Delivered

- Audited Zod coverage across reservations, reviews, favorites, profile, host actions, APIs, search, auth callback ids, and payments.
- Tightened host listing validation for title, description, city, state, neighborhood, property type, price, capacity, bedrooms, bathrooms, image URLs, and amenities.
- Replaced loose host `propertyType` strings with the real `PropertyType` enum.
- Replaced loose host amenities with the supported `featuredAmenities` enum.
- Limited host-provided image URLs to HTTPS URLs and no more than six images.

## Notes

- Client forms still provide the first layer of guidance, but server actions now reject forged property types, unsupported amenities, invalid state codes, overlong text, and non-HTTPS external image URLs.
- Address/provider-backed coordinate validation remains part of the later host location work.

## Verification

- Run `pnpm typecheck`, `pnpm lint`, and `pnpm build`.
- Smoke home, search, listing detail, auth redirect, and host listing validation paths where possible.
