# Phase 52: Vercel Deployment

## Deployment

- Production deployment: `https://staywise-f9i20neaq-ashishmishra1.vercel.app`
- Live alias: `https://staywise-tau.vercel.app`
- Vercel deployment id: `dpl_Hicj2dQhxGSs7ZPkY2RZ2tUhiFEr`
- Status: Ready
- Build: Passed on Vercel
- Alias verified through `vercel inspect`

## Environment Variables

Verified with `vercel env ls --scope ashishmishra1`:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`

Optional AI, Stripe, Mapbox, service-role, and Playwright variables are not required for the current MVP runtime. The app falls back to deterministic AI parsing and pay-later/payment-not-configured behavior when those are absent.

## Live Smoke

Passed on `https://staywise-tau.vercel.app`:

- Home: `200`, title `Smart Stays, Better Days | StayWise`
- Dallas search: `200`, title `Dallas stays | StayWise`
- Known listing detail: `200`, listing title metadata rendered
- Sign-in page: `200`, title `Sign In | StayWise`
- Auth callback without code: `307` to sign-in with `missing-code`
- Location API: `200`, Dallas response with OpenStreetMap attribution
- Stripe webhook without configured secret: `503` with explicit not-configured JSON
- Dashboard unauthenticated redirect: `307` to sign-in
- Host unauthenticated redirect: `307` to sign-in with host role
- Unknown route: `404`, title `Page not found | StayWise`

## Supabase And Provider Notes

- Supabase redirect URLs must include:
  - `http://localhost:3000/auth/callback`
  - `https://staywise-tau.vercel.app/auth/callback`
  - any temporary Vercel preview callback URL used during demos
- User setup earlier confirmed real email verification worked; the callback route is live and handles missing-code/error states safely.
- Storage bucket and migration setup remain Supabase dashboard/SQL-editor tasks documented in `README.md` and `docs/deployment.md`.
- Current maps use OpenStreetMap/Nominatim and Leaflet; no Mapbox domain/key is required for the current deployed runtime.
- Existing seeded images render from public image URLs; Supabase Storage upload policy remains documented in `supabase/phase10_storage.sql`.

## Verification Commands

- Passed: `pnpm dlx vercel --prod --yes --scope ashishmishra1`
- Passed: `pnpm dlx vercel inspect staywise-f9i20neaq-ashishmishra1.vercel.app --scope ashishmishra1`
- Passed: production route/API smoke with Node `fetch`
