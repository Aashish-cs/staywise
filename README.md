# StayWise

Smart Stays, Better Days.

StayWise is a senior design project for an AI-assisted short-term rental marketplace. Guests can search Supabase-backed listings, save places, reserve stays with date-conflict protection, and receive explainable recommendations. Hosts can publish listings and view reservation demand.

## Tech Stack

- Next.js, React, TypeScript, Tailwind CSS
- Supabase Auth, Postgres, Storage, Row Level Security
- Resend SMTP for production-style auth emails
- Vercel for deployment
- Explainable recommendation scoring with an optional LLM layer later

## Local Setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open `http://localhost:3000`.

Auth screens compile without secrets, but real sign-up, email confirmation, password reset, listings, favorites, and reservations require Supabase environment variables.

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NOMINATIM_EMAIL=
NOMINATIM_BASE_URL=https://nominatim.openstreetmap.org/search
NOMINATIM_REVERSE_BASE_URL=https://nominatim.openstreetmap.org/reverse
```

Resend is configured inside Supabase as a custom SMTP provider. Do not put the Resend API key in browser-visible environment variables.

`NOMINATIM_EMAIL` is optional but recommended so OpenStreetMap operators can identify StayWise traffic. Location and reverse-geocoding lookups are server-side, user-triggered, cached, and attributed.

## Supabase Setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Optional for demos: run `supabase/phase2_seed.sql` to add clearly synthetic StayWise marketplace listings for demo search and reservations.
4. Run `supabase/phase3_booking_integrity.sql` to add server-side reservation validation and double-booking protection.
5. Run `supabase/phase4_availability.sql` to let search and listing pages check booked dates.
6. Run `supabase/phase5_marketplace_foundation.sql` to add profile settings, host availability blocks, reviews, recommendation events, and payment records.
7. Run `supabase/phase6_location_foundation.sql` to add provider-backed address and bounds columns for listings.
8. Turn on email confirmation in Supabase Auth settings.
9. Configure custom SMTP with Resend.
10. Add `http://localhost:3000/auth/callback` and the Vercel production callback URL to Supabase redirect URLs.

The seed listings are synthetic StayWise data with public stock imagery, real geographic coordinates, and explicit address metadata. They are not scraped from Airbnb or any other marketplace. Do not copy private marketplace content into this database.

## Useful Scripts

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm build
```

## Deployment

Use GitHub as the source repository and import it into Vercel. Add the same environment variables in Vercel Project Settings. The database, auth, email, seed data, and deployment setup is documented in `docs/deployment.md`.

## Current Scope

The current implementation covers authentication, Supabase-filtered listing search, server-side OpenStreetMap destination lookup, browser current-location search with reverse geocoding, distance-aware ranking, natural-language search parsing, explainable AI-style ranking, date-aware guest reservations, persisted favorites, recommendation event logging, payment-record architecture, and a host listing dashboard. Ratings/reviews are intentionally not displayed until the real review UI is implemented.

## Known Limitations

- Listings can come from host-created rows or the provided synthetic seed data; production does not silently fall back to hardcoded listing arrays when Supabase is missing or failing.
- Listing search now runs server-side filters for destination, current location, dates, guests, price, property type, bedrooms/beds, bathrooms, amenities, and page state before the UI ranks and displays results.
- Availability search uses the database RPC path to exclude active reservations and host-blocked dates, then shows date-aware result and empty states.
- Maps currently use OpenStreetMap embeds. A synchronized interactive marker map is planned for later phases.
- Guest-host messaging, review UI, Supabase Storage image uploads, profile settings UI, real payment provider checkout/webhooks, and automated browser tests are still roadmap items.
- Any Supabase key that was shared during setup should be rotated before final presentation.
