# Phase 45: Not Found And Error Pages

## What changed

- Added a shared `RouteStatePanel` component for polished route interruption states.
- Added a branded app-level 404 page with direct routes back to search and home.
- Added a listing-specific not-found page so old or unpublished listing links explain what happened.
- Added an app-level error boundary with a safe retry action and non-sensitive support reference.
- Reused the shared state panel for host access gates so unauthorized states match the rest of StayWise.

## Behavior

- Unknown routes now show a StayWise-branded recovery page instead of the default Next.js 404.
- Missing listing IDs now show a marketplace-specific unavailable-listing message.
- Runtime page errors show a safe error screen with retry/search/home actions.
- Host access gates remain private and action-oriented without exposing protected data.

## Verification

- Passed: `pnpm typecheck`
- Passed: `pnpm lint`
- Passed: `pnpm build`
- Passed local smoke: unknown routes show the branded 404 with HTTP 404.
- Passed local smoke: missing listing URLs show the listing-specific unavailable state and noindex metadata.
- Passed local smoke: protected `/dashboard` and `/host` routes still redirect unauthenticated users to sign-in.
- Passed production smoke on `https://staywise-tau.vercel.app`: unknown route, missing listing, home, Dallas search, dashboard redirect, and host redirect.

## Note

The dynamic listing route keeps its Phase 38 route-level loading shell. Because that route streams before the listing miss resolves, Next.js returns HTTP 200 for the missing-listing response while still rendering the listing-specific not-found UI and noindex metadata. The app-level unknown route returns a true HTTP 404.
