# Phase 5 Authentication

Status: Completed and verified locally

Last updated: 2026-09-14

## Verified Flows

- Signup supports guest and host roles and sends users through Supabase email confirmation.
- Signin routes users by stored profile role, with `next` preserved for protected destinations.
- Signout uses a POST route and redirects to home.
- Email confirmation and password recovery links go through `/auth/callback` so Supabase can exchange the code for a session.
- Forgot password sends recovery email to the callback route with `next=/auth/update-password`.
- Update password validates minimum length and works only after the recovery callback establishes a session.
- Dashboard and host workspace routes are protected in middleware and redirect unsigned users to `/auth?mode=signin&next=...`.
- Auth-required actions for favorites, reservations, and host listing creation still validate session and role server-side.

## Improvements Added

- Added safe callback error redirects for missing, expired, or failed email-link codes.
- Added password visibility toggles to signin/signup and update-password forms.
- Added email/new-password autocomplete attributes on reset and update forms.
- Preserved protected-route destinations through middleware redirects.
- Kept redirect targets path-only to prevent open redirects.

## Remaining Manual QA

- Create a new guest account and confirm the email from a real inbox.
- Create a new host account and confirm the email from a real inbox.
- Run one forgot-password email and confirm the recovery link lands on `/auth/update-password`.
- Confirm Supabase has both local and Vercel callback URLs:
  - `http://localhost:3000/auth/callback`
  - `https://staywise-tau.vercel.app/auth/callback`
