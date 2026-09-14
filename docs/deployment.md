# StayWise Deployment Guide

## GitHub

Create one repository for the team and keep it private until the course team is ready to publish source code. Use a protected `main` branch once multiple teammates begin contributing.

## Supabase

1. Create a free Supabase project.
2. Run `supabase/schema.sql`.
3. Run `supabase/phase2_seed.sql` for synthetic demo listings.
4. Run `supabase/phase3_booking_integrity.sql` for reservation validation and double-booking protection.
5. Run `supabase/phase4_availability.sql` for date-aware search and reservation availability checks.
6. Run `supabase/phase5_marketplace_foundation.sql` for profile settings, host availability blocks, real-review eligibility, recommendation events, and payment records.
7. Run `supabase/phase6_location_foundation.sql` for provider-backed location metadata columns.
8. In Authentication settings, enable email confirmation.
9. Add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://YOUR-VERCEL-DOMAIN.vercel.app/auth/callback`
10. In Authentication email settings, configure custom SMTP using Resend.
11. Keep Row Level Security enabled on every application table.

## Resend SMTP

Use Resend as the SMTP provider for Supabase Auth emails:

- Host: `smtp.resend.com`
- Port: `587`
- Username: `resend`
- Password: Resend API key
- Sender name: `StayWise`
- Sender email: a verified Resend sender/domain

## Vercel

1. Import the GitHub repository into Vercel.
2. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL`
   - `NOMINATIM_EMAIL` (optional but recommended)
   - `NOMINATIM_BASE_URL` (optional, defaults to OpenStreetMap Nominatim)
   - `NOMINATIM_REVERSE_BASE_URL` (optional, defaults to OpenStreetMap Nominatim reverse geocoding)
3. Deploy from `main`.
4. Copy the deployment URL back into Supabase Auth redirect settings.

## Production Checklist

- Email confirmation enabled.
- Password reset tested.
- Supabase custom SMTP configured.
- RLS policies verified.
- `supabase/phase2_seed.sql` run for demo listings.
- `supabase/phase3_booking_integrity.sql` run for booking safeguards.
- `supabase/phase4_availability.sql` run for availability-aware search.
- `supabase/phase5_marketplace_foundation.sql` run for production support entities.
- `supabase/phase6_location_foundation.sql` run for provider-backed location columns.
- OpenStreetMap/Nominatim attribution remains visible anywhere verified destination or current-location data appears.
- No `.env.local` or API secrets committed.
- `pnpm lint`, `pnpm typecheck`, and `pnpm build` pass.
- Demo accounts prepared for guest and host roles.
