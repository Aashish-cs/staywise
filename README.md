# StayWise

Smart Stays, Better Days.

StayWise is a senior design project for an AI-assisted short-term rental marketplace. It is not an Airbnb clone or scraped marketplace. The app uses Supabase-backed listings, real auth, real database constraints, free OpenStreetMap location services, explainable recommendation scoring, and production-style deployment on Vercel.

Live site: `https://staywise-tau.vercel.app`

## Features

- Verified account flow with sign up, sign in, email confirmation callback, password reset, protected routes, guest/host roles, and safe redirects.
- Supabase-backed marketplace data with no hardcoded production listing fallback.
- Search by destination, current location, dates, guests, budget, property type, bedrooms, bathrooms, amenities, and trip purpose.
- Real OpenStreetMap/Nominatim place lookup and reverse geocoding through server routes.
- Interactive Leaflet/OpenStreetMap result map with listing marker sync and current-location support.
- Listing detail pages with gallery modal, save/share actions, amenities, reviews section, map, booking panel, and mobile reserve CTA.
- Date-aware reservation flow backed by database availability RPCs and active-reservation overlap protection.
- Persisted favorites, trip dashboard, reservation confirmation pages, and review submission for eligible completed reservations.
- Host onboarding, listing creation/editing, listing status controls, image-management UI, dashboard metrics, and host reservation detail pages.
- Explainable deterministic recommendation scoring with optional server-only LLM parsing.
- Payment-ready architecture with optional Stripe Checkout/webhook paths and MVP pay-later fallback.
- Custom 404/error pages, loading states, empty states, toasts, accessibility pass, responsive mobile/tablet/desktop QA, unit tests, and Playwright browser smoke tests.

## Screenshots

Add final presentation screenshots here before submission:

- Home marketplace
- Search with map
- Listing detail
- Reservation confirmation
- Guest dashboard
- Host dashboard

## Tech Stack

- Next.js App Router, React, TypeScript, Tailwind CSS
- Supabase Auth, Postgres, Storage, Row Level Security
- OpenStreetMap/Nominatim for free geocoding
- Leaflet for interactive maps
- Vitest for unit tests
- Playwright for browser QA
- Vercel for production deployment

## Local Setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open `http://localhost:3000`.

The UI can build without secrets, but real auth, listings, favorites, reservations, host workflows, and location-backed search require the Supabase and provider setup below.

## Environment Variables

Use `.env.example` as the source of truth. Important groups:

- Public app/Supabase values:
  - `NEXT_PUBLIC_SITE_URL`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Free location provider:
  - `NOMINATIM_EMAIL`
  - `NOMINATIM_BASE_URL`
  - `NOMINATIM_REVERSE_BASE_URL`
- Reserved future map provider:
  - `MAPBOX_ACCESS_TOKEN`
- Optional server-only AI:
  - `STAYWISE_AI_API_KEY`
  - `STAYWISE_AI_BASE_URL`
  - `STAYWISE_AI_MODEL`
  - `OPENAI_API_KEY`
  - `OPENAI_MODEL`
- Optional Stripe architecture:
  - `STAYWISE_ENABLE_STRIPE_CHECKOUT`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
- Optional trusted Supabase admin path:
  - `SUPABASE_SERVICE_ROLE_KEY`
- Test runner:
  - `PLAYWRIGHT_BASE_URL`
  - `PLAYWRIGHT_PORT`

Resend SMTP is configured inside Supabase Auth settings, not as a browser-visible environment variable.

## Supabase Setup

1. Create a Supabase project.
2. Run `supabase/schema.sql`.
3. Optional for demos: run `supabase/phase2_seed.sql` for clearly labeled synthetic StayWise listings.
4. Run these migrations if your database was created before the canonical schema was updated:
   - `supabase/phase3_booking_integrity.sql`
   - `supabase/phase4_availability.sql`
   - `supabase/phase5_marketplace_foundation.sql`
   - `supabase/phase6_location_foundation.sql`
   - `supabase/phase7_booking_hardening.sql`
   - `supabase/phase8_trip_management.sql`
   - `supabase/phase9_reviews.sql`
   - `supabase/phase10_storage.sql`
   - `supabase/phase28_recommendation_signals.sql`
   - `supabase/phase30_payment_required_reservations.sql`
   - `supabase/phase31_calendar_availability.sql`
   - `supabase/phase33_pricing.sql`
5. Keep RLS enabled on application tables.
6. Enable email confirmation.
7. Configure custom SMTP with Resend.
8. Add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://staywise-tau.vercel.app/auth/callback`
   - any Vercel preview callback URL used during demos

The seed rows use public stock imagery and real city/neighborhood coordinates. They are not scraped from Airbnb or any private marketplace.

## Storage

`supabase/phase10_storage.sql` defines the owner-scoped Storage bucket policy for listing images. Existing seed listings can still use public image URLs, but host-uploaded images should use Supabase Storage paths after the storage migration is applied.

## Testing

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

Current automated coverage includes distance, pricing, date/night overlap behavior, recommendation scoring, search URL validation, public marketplace browser smoke, auth redirects, search interactions, listing gallery/share/save interactions, and branded error states.

Authenticated browser flows that create real reservations, persist favorites, publish host listings, or submit completed-trip reviews should use seeded QA accounts in a test Supabase project.

## Deployment

The production site is deployed through Vercel.

1. Push to GitHub.
2. Import the repository into Vercel.
3. Add the required environment variables from `.env.example`.
4. Deploy from `main`.
5. Add the production callback URL to Supabase Auth redirects.
6. Verify with `docs/phase-52-vercel-deployment.md`.

Useful command:

```bash
pnpm dlx vercel --prod --yes --scope ashishmishra1
```

## Important Docs

- `docs/master-phase-checklist.md`: current phase-by-phase project status
- `docs/deployment.md`: deployment and provider checklist
- `docs/architecture.md`: architecture notes
- `docs/phase-52-vercel-deployment.md`: latest production deployment verification
- `docs/phase-49-testing.md`: test coverage summary
- `docs/phase-50-browser-qa.md`: browser QA coverage summary

## Known Limitations

- Real payment collection is optional and remains disabled unless Stripe variables and payment-required reservation flow are enabled.
- Some Supabase operations, including redirect URLs, storage bucket policies, and SQL migrations, must be checked in the Supabase dashboard/SQL editor.
- Fully automated authenticated e2e tests need seeded QA accounts and a dedicated test Supabase project.
- Guest-host messaging is not implemented yet.
- Any Supabase or API key shared during setup should be rotated before final presentation.
