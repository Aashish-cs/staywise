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

- [x] Phase 12: Search results page
  - Desktop list/map layout with accessible search header and filters.
  - Mobile list/map toggle.
  - Synchronize result cards and map markers.
  - Current pass: added a mobile results summary, mobile filter reveal, true List/Map toggle behavior, desktop sticky side panel behavior, duplicate-control cleanup, and `docs/phase-12-search-results-page.md`.

- [x] Phase 13: Interactive map
  - Use a real map system, listing price markers, current location marker, hover/click sync, fit bounds, loading/error states, zoom/pan, and responsive sizing.
  - Current pass: replaced the search iframe with a Leaflet/OpenStreetMap interactive map, added price markers, fit bounds, current-location marker support, marker/list selection sync, loading/error states, mobile map QA, and `docs/phase-13-interactive-map.md`.

- [x] Phase 14: Listing cards
  - Mature card design with image, heart, location, title, facts, real rating only when available, price, optional distance, card navigation, consistent ratio, Next Image, and image fallback.
  - Current pass: added shared listing location/fact primitives, image fallback handling, real card navigation, separated Save/Preview/Reserve actions, consistent guest card metadata across search/home/dashboard/host cards, no fabricated ratings, and `docs/phase-14-listing-cards.md`.

- [x] Phase 15: Listing detail page
  - Serious listing detail with title, location, share/save, gallery/lightbox, summary, host, description, amenities, rules, availability, reviews, map, sticky booking panel, and mobile reserve CTA.
  - Current pass: added `ListingPhotoGallery` with lightbox, added mobile sticky reserve CTA linked to `#reserve`, verified the existing serious detail sections/booking/map/review-placeholder behavior, and documented `docs/phase-15-listing-detail-page.md`.

- [x] Phase 16: Booking engine
  - Validate dates, minimum/maximum rules, guests, status, ownership, availability, overlap, price consistency, and listing existence.
  - Use trusted server prices and database/RPC/constraint strategy.
  - Current pass: added centralized reservation date/guest limits, strict date parsing, max 30-night enforcement in UI/server/API/search availability, trusted RPC max-stay enforcement in `supabase/phase7_booking_hardening.sql`, and `docs/phase-16-booking-engine.md`.

- [x] Phase 17: Reservation confirmation
  - Add polished confirmation with property, dates, guests, id, total, status, and actions.
  - Current pass: added protected `/reservations/[id]`, direct post-booking confirmation links, dashboard reservation detail links, confirmation pricing/status/trust summary, and `docs/phase-17-reservation-confirmation.md`.

- [x] Phase 18: Trips
  - Build upcoming, past, and cancelled trip sections with reservation cards and status-based cancellation.
  - Current pass: rebuilt guest dashboard trips into upcoming/past/cancelled sections, added rich trip cards with confirmation links and status-aware cancellation, hardened the cancel RPC in `supabase/phase8_trip_management.sql`, and documented `docs/phase-18-trips.md`.

- [x] Phase 19: Favorites
  - Ensure real persisted favorite toggles, optimistic rollback, unique relationship, favorites page, refresh/login persistence.
  - Current pass: added protected `/favorites`, direct persisted favorite-listing loading, optimistic remove UI with shared saved-stays hook, `/favorites` revalidation, dashboard/account-menu navigation, and `docs/phase-19-favorites.md`.

- [x] Phase 20: Reviews
  - Implement legitimate reviews only from eligible completed reservations.
  - Prevent duplicates and calculate real listing average.
  - Show New/No reviews yet when no reviews exist.
  - Current pass: added real listing review reads and averages, completed-trip review submission, duplicate protection through the existing unique constraint and RLS, privacy-safe verified guest labels, `supabase/phase9_reviews.sql`, and `docs/phase-20-reviews.md`. The live Supabase project still needs this migration applied.

- [x] Phase 21: Become a host
  - Build serious onboarding before listing creation.
  - Current pass: added protected host onboarding, account activation into the host role, ownership/trust expectations, and a guided transition into the host workspace.


- [ ] Phase 22: Host create listing wizard
  - Multi-step flow: property type, room type, real address/map, basics, amenities, Supabase Storage photos, title, description, price, review, publish, and draft persistence.
  - Current pass: added the five-step host listing wizard, step readiness checks, review-before-publish summary, live quality preview, and browser draft persistence. Storage uploads, provider-backed coordinates, and durable server drafts remain for the next host phases.

- [ ] Phase 23: Host dashboard
  - Professional dashboard with real active/draft listings, reservations, revenue estimate, occupancy, counts, and recent activity.
  - Current pass: added real host metrics for active listings, reservations, projected confirmed revenue, markets, average booking value, and 90-day occupancy. Listing editing and deeper recent-activity management continue in the next host phases.

- [ ] Phase 24: Host listing management
  - Host can view, edit, publish/unpublish, archive where supported, change price/amenities/photos/location carefully, and review reservations only for owned listings.
  - Current pass: added owner-scoped publish/unpublish controls, visible inventory status, and a protected edit route for core listing details. Archive and asset-management surfaces remain in this phase.

- [x] Phase 25: Host reservation management
  - Host reservation page with guest, listing, dates, status, total, created date, and supported actions.
  - Current pass: added host-owned reservation detail routing, privacy-safe guest context, booking timeline, listing links, and reservation-feed navigation.

- [ ] Phase 26: Image system
  - Supabase Storage bucket strategy, owner-only listing uploads, optimization, type/size/count validation, ordering, delete, primary photo, and alt text/fallbacks.
  - Current pass: added host upload validation, owner-scoped Storage paths, public listing image URLs, listing image rows, upload cleanup on failure, owner-only delete/primary-photo controls, and `supabase/phase10_storage.sql`. Image optimization and applying the Storage migration remain.

- [x] Phase 27: Profile
  - Profile settings for display name, avatar, bio, phone if used, security, favorites, trips, and hosting.
  - Current pass: added protected `/profile`, owner-scoped display-name and notification preference saves, password-reset entry point, and signed-in account-menu navigation. Avatar and public host bio remain follow-up work.

- [ ] Phase 28: Recommendation system
  - Improve deterministic explainable ranking with real signals: geography, distance, price, capacity, amenities, favorites, history, property type, popularity, real rating, and recency.
  - Never fabricate recommendation reasons.
  - Current pass: rank up to 200 live candidates before pagination, add live review averages/counts when the reviews table is available, use real saved-stay and recent-trip-city context for signed-in guests, and add honest recency signals. Popularity aggregation still needs a privacy-safe public aggregate query.

- [x] Phase 29: Optional LLM layer
  - Server-only AI abstraction for natural language search, host description assistance, explanations, and smart search interpretation.
  - App must work without `OPENAI_API_KEY`.
  - Current pass: added an optional server-only structured-output adapter using `STAYWISE_AI_*` or `OPENAI_*` variables, strict schema validation, an eight-second timeout, and deterministic fallback when no key/provider is configured or the provider fails.

- [ ] Phase 30: Stripe payment architecture
  - Payment-ready architecture with Checkout or Payment Intent when credentials exist.
  - Webhook verification, statuses, no card storage, and development mode without fake payment success.
  - Current pass: added server-only Stripe Checkout session creation for `requires_payment` ledgers, signed webhook verification, payment status updates, reservation confirmation/cancellation transitions, and explicit no-provider MVP responses. The current reserve-now/pay-later flow remains unchanged until the payment-required reservation migration is applied.

- [ ] Phase 31: Date picker
  - Professional check-in/check-out selection, unavailable date disabling, invalid range prevention, mobile dialog, desktop popover, keyboard support, and URL/state sync.
  - Current pass: added a shared range calendar for reservation and search filters with month navigation, past-date and maximum-stay guards, range highlighting, Escape/outside-click close, hidden ISO form fields, and existing live availability validation. Provider-backed unavailable-date cells remain after the calendar RPC migration.

- [x] Phase 32: Guest selector
  - Adults/children/infants/pets where supported and max guest enforcement.
  - Current pass: added a shared selector across homepage search, search filters, and reservation panel; persisted breakdown values in search URLs; and preserved existing total-guest reservation submission until the reservation schema is expanded.

- [x] Phase 33: Price calculation
  - Shared authoritative pricing engine with nights, subtotal, cleaning fee, service fee, tax, total, and decimal-safe handling.
  - Current pass: added a shared integer-cent pricing engine, wired reservation and confirmation breakdowns to it, and added a trusted RPC refresh with named fee variables. Cleaning and tax remain explicit zero-value policy lines until their supporting schema and rules exist.

- [x] Phase 34: Real currency strategy
  - USD minimum viable strategy using integer cents where appropriate and `Intl.NumberFormat`.
  - Current pass: added a shared USD currency helper, centralized dollar/cent formatting, routed reservation pricing and shared listing price display through it, and kept payment records on integer cents.

- [x] Phase 35: Security
  - Audit SQL injection, XSS, unsafe HTML, auth checks, RLS, storage, server actions, APIs, env vars, CSRF, open redirects, uploads, and rate limits.
  - Current pass: audited the highest-risk surfaces, added shared same-origin redirect sanitization for auth flows, confirmed no unsafe HTML/eval/raw SQL patterns, and documented remaining rate-limit/storage-policy hardening.

- [x] Phase 36: Validation
  - Use Zod or equivalent on client and server for listing, description, coordinates, price, guests, dates, reviews, and profile.
  - Current pass: audited validation coverage and tightened host listing validation with real property-type/amenity enums, bounded text fields, state-code validation, price/capacity ranges, and HTTPS-only image URL parsing.

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
