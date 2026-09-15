# StayWise Master Phase Checklist

Source: the 56-phase StayWise production brief pasted into Codex.

Rule for this file: do not mark a phase complete just because it was reviewed. A phase is complete only when the related code, database work, documentation, tests, and deployment checks required by that phase are done or explicitly documented as blocked by missing credentials.

## Current Status Legend

- `[ ]` Not started
- `[~]` In progress
- `[x]` Completed and verified
- `[!]` Blocked by missing credential, provider setup, or manual Supabase/Vercel step

## Phase Tracker

- [x] Phase 0: Protect the existing project
  - Inspect repository, current architecture, package manager, app routes, layouts, components, libs, actions, APIs, middleware, Supabase clients, SQL, env usage, auth, RLS, README, and deployment docs.
  - Preserve good working code and existing Supabase data.
  - Avoid blind rewrites, destructive DB changes, secret exposure, and auth regressions.

- [x] Phase 1: Complete engineering audit
  - Find hardcoded listings/cities/coordinates, fake ratings/reviews/hosts/recommendations/bookings, dead buttons, broken routes, unfinished forms, duplicate components, unhandled errors, auth bugs, RLS assumptions, TypeScript/lint/build issues, accessibility/mobile/performance/security issues, and missing states.
  - Run `pnpm install`, `pnpm lint`, `pnpm typecheck`, and `pnpm build`.
  - Fix errors and continue beyond simply passing the build.

- [~] Phase 2: Define real product architecture
  - Move toward feature-oriented structure where useful.
  - Separate UI, business logic, data access, validation, and types.
  - Avoid giant components, duplicated Supabase queries, and business logic hidden inside JSX.
  - Current pass: shared search defaults and category presets extracted into `src/lib/search-presets.ts`.
  - Current pass: shared StayWise header/account primitives extracted into `src/components/staywise-header.tsx`.
  - Current pass: shared listing-card media/save primitives extracted into `src/components/listing-card-primitives.tsx`.
  - Current pass: search result sorting/summary/filter helpers extracted into `src/lib/search-results.ts`.
  - Current pass: listing coordinate fallback and OpenStreetMap URL helpers extracted into `src/lib/listing-map.ts`.
  - Current pass: public listing reads now retry transient Supabase gateway/config errors before showing empty marketplace states.
  - Current pass: shared optimistic saved-stay client hook extracted into `src/hooks/use-saved-listings.ts` and reused by home, search, and listing detail actions.
  - Current pass: shared AI search client hook extracted into `src/hooks/use-ai-search.ts` and reused by home/search forms.
  - Current pass: search result cards, toolbar, empty state, fit panel, and map panel extracted into `src/components/search-results-section.tsx`.
  - Current pass: search AI prompt, destination/date/guest/budget fields, advanced filters, trip style, amenities, and search action extracted into `src/components/search-filters-panel.tsx`.
  - Current pass: marketplace listing rails and home listing cards extracted into `src/components/marketplace-listing-rails.tsx`.

- [x] Phase 3: Database design
  - Audit current Supabase schema.
  - Refine production entities for profiles, listings, images, amenities, favorites, reservations, reviews, availability, settings, recommendation events, and payment records where appropriate.
  - Add constraints, indexes, UUID keys, and reproducible migrations.
  - Current pass: added `supabase/phase5_marketplace_foundation.sql` and updated canonical `supabase/schema.sql` with profile settings, host availability blocks, legitimate reviews, recommendation events, payment records, constraints, indexes, RLS, and availability-aware RPC updates.

- [x] Phase 4: Row Level Security
  - Audit all table policies.
  - Enforce public read rules, guest ownership rules, host ownership rules, reservation access rules, review eligibility, and image permissions in RLS/server logic.
  - Current pass: documented policy coverage in `docs/phase-4-rls-audit.md`, hardened availability block ownership, and added host review read access without exposing profile emails publicly.

- [x] Phase 5: Authentication
  - Verify signup, signin, signout, email confirmation, forgot/reset password, callback, sessions, protected routes, return-to-route, auth-required actions, validation, loading, errors, password visibility, labels, and mobile forms.
  - Current pass: added callback error handling, recovery-link callback exchange, password visibility toggles, protected dashboard/host middleware redirects, `next` preservation, and `docs/phase-5-authentication.md`.

- [x] Phase 6: Real location system
  - Add legitimate place lookup/geocoding abstraction.
  - Store provider ids, formatted addresses, structured city/region/country, coordinates, and bounds where available.
  - Avoid fake city objects as the main architecture.
  - Current pass: added server-side OpenStreetMap/Nominatim lookup, explicit location search API, submitted-destination verification with attribution, provider metadata listing columns, `supabase/phase6_location_foundation.sql`, and `docs/phase-6-location-system.md`.

- [x] Phase 7: Current location / near me
  - Implement browser geolocation with accepted, denied, unsupported, timeout, unavailable, loading, and retry states.
  - Reverse geocode returned coordinates and search nearby listings without hardcoding the user city.
  - Show distance when appropriate.
  - Current pass: added browser current-location flow, server-side reverse geocoding, URL-persisted coordinates, distance-aware ranking/filtering, distance labels, and `docs/phase-7-current-location.md`.

- [x] Phase 8: Real listing search
  - Query Supabase server-side instead of downloading unbounded listings and filtering everything in the browser.
  - Support location, dates, guests, price, property type, bedrooms, beds, bathrooms, amenities, and rating only after real reviews exist.
  - Preserve refresh-safe, shareable URL state with pagination/cursor loading.
  - Current pass: added `searchPublicListings`, Supabase-side search filters, shared recommendation API usage, page URLs, pagination controls, out-of-range page handling, `beds` URL aliases, and `docs/phase-8-real-listing-search.md`.

- [x] Phase 9: Availability search
  - Ensure selected date ranges remove unavailable properties server-side/database-side.
  - Preserve overlap protection with trusted logic.
  - Current pass: confirmed search uses the `get_available_listing_ids` RPC, added date range chips, visible availability-check messaging, date-specific empty-state copy, and `docs/phase-9-availability-search.md`.

- [x] Phase 10: Airbnb-quality home page
  - Make homepage feel like a travel marketplace, not SaaS.
  - Build premium header, meaningful nav, search bar, real listing sections, and strong photography.
  - Current pass: rebuilt the home page around compact premium search, category discovery, real-listing spotlight cards, operational marketplace signals, refreshed listing rails, realistic homepage match copy, and `docs/phase-10-airbnb-quality-home.md`.

- [x] Phase 11: Design system
  - Create consistent StayWise primitives for buttons, inputs, selects, modals/drawers/popovers/dropdowns, date picker, guest picker, search bar, listing card, skeleton, empty/error states, toast, avatar, badge, price, and rating display.
  - Keep the style premium, mature, restrained, and travel-oriented.
  - Current pass: added shared UI primitives in `src/components/ui/primitives.tsx`, migrated search results and home listing surfaces to shared Badge/Price/Button/Surface/EmptyState primitives, and documented the foundation in `docs/phase-11-design-system.md`.

- [~] Phase 12: Search results page
  - Desktop list/map layout with accessible search header and filters.
  - Mobile list/map toggle.
  - Synchronize result cards and map markers.

- [ ] Phase 13: Interactive map
  - Use a real map system, listing price markers, current location marker, hover/click sync, fit bounds, loading/error states, zoom/pan, and responsive sizing.

- [ ] Phase 14: Listing cards
  - Mature card design with image, heart, location, title, facts, real rating only when available, price, optional distance, card navigation, consistent ratio, Next Image, and image fallback.

- [ ] Phase 15: Listing detail page
  - Serious listing detail with title, location, share/save, gallery/lightbox, summary, host, description, amenities, rules, availability, reviews, map, sticky booking panel, and mobile reserve CTA.

- [ ] Phase 16: Booking engine
  - Validate dates, minimum/maximum rules, guests, status, ownership, availability, overlap, price consistency, and listing existence.
  - Use trusted server prices and database/RPC/constraint strategy.

- [ ] Phase 17: Reservation confirmation
  - Add polished confirmation with property, dates, guests, id, total, status, and actions.

- [ ] Phase 18: Trips
  - Build upcoming, past, and cancelled trip sections with reservation cards and status-based cancellation.

- [ ] Phase 19: Favorites
  - Ensure real persisted favorite toggles, optimistic rollback, unique relationship, favorites page, refresh/login persistence.

- [ ] Phase 20: Reviews
  - Implement legitimate reviews only from eligible completed reservations.
  - Prevent duplicates and calculate real listing average.
  - Show New/No reviews yet when no reviews exist.

- [ ] Phase 21: Become a host
  - Build serious onboarding before listing creation.

- [ ] Phase 22: Host create listing wizard
  - Multi-step flow: property type, room type, real address/map, basics, amenities, Supabase Storage photos, title, description, price, review, publish, and draft persistence.

- [ ] Phase 23: Host dashboard
  - Professional dashboard with real active/draft listings, reservations, revenue estimate, occupancy, counts, and recent activity.

- [ ] Phase 24: Host listing management
  - Host can view, edit, publish/unpublish, archive where supported, change price/amenities/photos/location carefully, and review reservations only for owned listings.

- [ ] Phase 25: Host reservation management
  - Host reservation page with guest, listing, dates, status, total, created date, and supported actions.

- [ ] Phase 26: Image system
  - Supabase Storage bucket strategy, owner-only listing uploads, optimization, type/size/count validation, ordering, delete, primary photo, and alt text/fallbacks.

- [ ] Phase 27: Profile
  - Profile settings for display name, avatar, bio, phone if used, security, favorites, trips, and hosting.

- [ ] Phase 28: Recommendation system
  - Improve deterministic explainable ranking with real signals: geography, distance, price, capacity, amenities, favorites, history, property type, popularity, real rating, and recency.
  - Never fabricate recommendation reasons.

- [ ] Phase 29: Optional LLM layer
  - Server-only AI abstraction for natural language search, host description assistance, explanations, and smart search interpretation.
  - App must work without `OPENAI_API_KEY`.

- [ ] Phase 30: Stripe payment architecture
  - Payment-ready architecture with Checkout or Payment Intent when credentials exist.
  - Webhook verification, statuses, no card storage, and development mode without fake payment success.

- [ ] Phase 31: Date picker
  - Professional check-in/check-out selection, unavailable date disabling, invalid range prevention, mobile dialog, desktop popover, keyboard support, and URL/state sync.

- [ ] Phase 32: Guest selector
  - Adults/children/infants/pets where supported and max guest enforcement.

- [ ] Phase 33: Price calculation
  - Shared authoritative pricing engine with nights, subtotal, cleaning fee, service fee, tax, total, and decimal-safe handling.

- [ ] Phase 34: Real currency strategy
  - USD minimum viable strategy using integer cents where appropriate and `Intl.NumberFormat`.

- [ ] Phase 35: Security
  - Audit SQL injection, XSS, unsafe HTML, auth checks, RLS, storage, server actions, APIs, env vars, CSRF, open redirects, uploads, and rate limits.

- [ ] Phase 36: Validation
  - Use Zod or equivalent on client and server for listing, description, coordinates, price, guests, dates, reviews, and profile.

- [ ] Phase 37: Error handling
  - Add safe failure states for Supabase, network, image upload, geocoder, location denial, booking conflicts, auth expiry, and payments.

- [ ] Phase 38: Loading states
  - Add polished skeletons for home, search, listing, trips, and host.

- [ ] Phase 39: Empty states
  - Add useful empty states for no search results, favorites, trips, and host listings.

- [ ] Phase 40: Mobile design
  - Test 375, 390, 430, and 768px. Use drawers, mobile date picker, mobile filters, map toggle, sticky booking CTA, and no horizontal scroll.

- [ ] Phase 41: Tablet/desktop
  - Test 1024, 1280, 1440, and 1920px with controlled max widths and good search/map use.

- [ ] Phase 42: Accessibility
  - Semantic HTML, keyboard nav, focus states, labels, ARIA, dialog focus trapping, Escape close, SR labels, alt text, contrast, and no div-as-button misuse.

- [ ] Phase 43: Performance
  - Optimize images, query patterns, pagination, rendering, server/client boundaries, autocomplete debounce, map loading, and bundle size.

- [ ] Phase 44: SEO and metadata
  - Meaningful metadata, listing dynamic title/description/OpenGraph, canonical if appropriate, no private address exposure, favicon/app description.

- [ ] Phase 45: Not found / error pages
  - Custom 404, global error, listing not found, and unauthorized states.

- [ ] Phase 46: Toasts and feedback
  - Consistent feedback for save/remove favorite, reservation, listing publish/save, image failures, and similar events.

- [ ] Phase 47: URL and navigation quality
  - Meaningful URLs, browser back behavior, and no broken modal routing.

- [ ] Phase 48: Data seeding
  - Dev seed allowed if clearly demo, with real geographic cities/coordinates and legitimate assets.
  - Production runtime must show error/empty state, not silent demo array fallback.

- [ ] Phase 49: Testing
  - Unit tests for distance, pricing, night calculation, overlap, scoring, validation.
  - Integration/Playwright flows for home, search, listing, sign in, favorite, reserve, trips, create/publish listing, host dashboard.

- [ ] Phase 50: Browser QA
  - Click every button/link/tab/filter/menu/dropdown/form/modal/drawer/card across success, failure, empty, loading, guest, host, unauthenticated, mobile, and desktop.

- [ ] Phase 51: Environment variables
  - Complete `.env.example` with site, Supabase, Mapbox, Stripe, OpenAI, and any server-only variables clearly documented.

- [ ] Phase 52: Vercel deployment
  - Verify production build, env vars, auth callback, Supabase redirect URLs, Stripe webhook docs, map provider domain, storage, images, and migrations.

- [ ] Phase 53: README
  - Rewrite README to accurately describe real features, architecture, screenshots section, stack, database, auth, maps, recommendations, payments, setup, env, migrations, storage, tests, deployment, limitations, and roadmap.

- [ ] Phase 54: Final visual polish
  - Review as professor, recruiter, engineer, and founder. Fix spacing, alignment, typography, images, buttons, modals, forms, nav, responsive behavior, loading, empty, and error states.

- [ ] Phase 55: Production quality gate
  - Do not call complete until lint/typecheck/build pass, no console errors, no dead UI, no fake production data, auth/favorites/search/maps/reservations/availability/host/images/trips/RLS/mobile/desktop/errors/loading/deployment all work.

- [ ] Phase 56: End-to-end product test
  - Test new guest flow, host flow, near-me flow, and mobile main guest flow.

## Final Report Requirements

The final implementation report must include:

- Audit results
- Architecture
- Files changed
- Database tables, migrations, indexes, and RLS
- Auth flows
- Location provider, autocomplete, reverse geocoding, and near-me behavior
- Map system
- Search implementation
- Booking/conflict prevention
- Host workflow
- Payment status
- AI/recommendation implementation
- Exact environment variables
- Supabase manual steps
- Vercel manual steps
- Testing results
- Remaining issues
- Deployment checklist
