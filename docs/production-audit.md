# StayWise Production Audit

Status: Reservation integrity and availability-aware search are now implemented.

Brand source of truth: StayWise uses the slogan "Smart Stays, Better Days."

## A. Current Architecture Summary

- App framework: Next.js App Router with React, TypeScript, Tailwind CSS, and server actions.
- Data platform: Supabase Auth, Postgres, Storage-ready schema, and Row Level Security.
- Public marketplace: Home page loads active listings from Supabase and ranks them with deterministic explainable scoring.
- Guest flows: Email/password auth, email confirmation callback, password reset, favorites, reservations, and trip dashboard.
- Host flows: Host-gated dashboard, listing creation form, listing portfolio, reservations feed, and derived revenue metric.
- Deployment: Vercel production deployment from the GitHub repository, with Supabase keys supplied through environment variables.

## B. Problems Found

- Browser geolocation and nearby discovery are not implemented yet.
- Stripe, payment statuses, webhook verification, and confirmation email are not implemented.
- Host listing creation is a single form, not a multi-step wizard, and it stores image URLs instead of Supabase Storage uploads.
- Ratings and review counts are currently derived placeholders; real reviews and aggregate ratings are not implemented.
- Messages, admin tools, and account settings are not implemented and should not be shown as navigation until real.
- Property detail pages need richer production sections: rules, cancellation policy, full availability calendar, reviews, and favorite/share behavior.

## C. Working Features To Preserve

- Supabase email/password signup, login, logout, email confirmation callback, and password reset pages.
- Role-aware guest and host routing.
- Supabase-backed listing reads with no hardcoded listing cards in the UI.
- Natural-language AI search translates trip requests into real search filters.
- Favorites persisted per guest account with duplicate prevention through the primary key.
- Date-aware reservation records connected to the guest dashboard and host reservation feed.
- Host-owned listing creation protected by role checks and RLS.
- Explainable recommendation scoring with clear reasons and tradeoffs.
- Current visual identity, slogan, responsive layout, and polished empty states.

## D. Proposed Architecture Improvements

- Add a typed search service shared by homepage, `/search`, and the recommendations API.
- Add an AI provider abstraction with graceful fallback: normal search must work without an AI key.
- Move critical booking creation into database RPCs so pricing, capacity, ownership, and overlap validation happen server-side.
- Add incremental Supabase migrations for each phase instead of editing only the base schema.
- Introduce shared UI primitives for buttons, fields, badges, empty states, property cards, and price breakdowns.
- Add map support only after listing coordinates and search route behavior are stable.

## E. UI/UX Improvement Plan

- Make the homepage a polished discovery surface with a mature search bar, location-aware sections, and real listing sections.
- Build `/search` with URL-persisted destination, dates, guests, filters, sorting, empty states, and a map panel.
- Refine property cards into a reusable component with consistent image ratio, favorite state, rating, price, and match reason.
- Upgrade the listing detail page with gallery layout, sticky booking card, rules, cancellation policy, availability messaging, and map.
- Build a dedicated favorites/wishlist page before adding a Favorites nav link.
- Convert the host listing form into a multi-step wizard once storage and draft support are ready.

## F. Database And Schema Changes

- Add reservation status support for `awaiting_payment`.
- Add a database-level exclusion constraint to prevent overlapping active reservations for the same listing.
- Add `public.create_reservation(...)` so reservation creation validates user role, listing availability, host ownership, date range, capacity, overlap, and server-calculated totals.
- Add public availability helper RPCs so search can remove booked stays without exposing guest reservation details.
- Future schema phases should add listing availability windows, reviews, conversations, payment records, and storage metadata.

## G. Security Issues

- Reservation creation must not trust browser-submitted price or total values.
- Double-booking must be blocked at the database layer, not only in React UI.
- Guests must not be able to reserve their own listing.
- Host image uploads need type and size validation before Supabase Storage is exposed.
- Admin functionality should not be added until server-side/database-side roles exist.
- The exposed Supabase secret seen during setup should be rotated before final presentation.

## H. Step-By-Step Implementation Order

1. Stabilize build, lint, typecheck, auth navigation, and reservation integrity.
2. Run the Phase 3 booking integrity migration in Supabase.
3. Add location-aware discovery with browser geolocation fallback and manual search preserved.
4. Improve listing details with richer rules, cancellation policy, and favorite/share behavior.
5. Add Stripe test-mode payment records, checkout session creation, webhook verification, and confirmation page.
6. Upgrade host listing creation to a multi-step wizard with Supabase Storage uploads.
7. Add reviews, messages, admin, and observability after the marketplace and booking foundation are stable.

## Phase 2 Stabilization Completed In This Pass

- Reservation creation now calls a database RPC instead of inserting directly from the server action.
- The canonical schema includes `awaiting_payment`, active-reservation overlap protection, and host-own-listing reservation prevention.
- A one-time `supabase/phase3_booking_integrity.sql` migration was added for the existing Supabase project.

## Phase 4 Availability Completed In This Pass

- Search, recommendations, and listing pages now check selected date ranges against live reservation data.
- Supabase has availability RPCs that reveal only open listing IDs or a yes/no availability result.
- The reservation card disables the submit button when selected dates are already booked and still relies on the server RPC for final validation.
