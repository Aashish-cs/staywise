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


- [x] Phase 22: Host create listing wizard
  - Multi-step flow: property type, room type, real address/map, basics, amenities, Supabase Storage photos, title, description, price, review, publish, and draft persistence.
  - Current pass: added the five-step host listing wizard, step readiness checks, review-before-publish summary, live quality preview, browser draft persistence, Supabase Storage uploads, provider-backed OpenStreetMap location verification, and coordinate/address metadata storage. Cross-device drafts and fuller room-type modeling remain future enhancements in `docs/phase-22-host-listing-wizard.md`.

- [x] Phase 23: Host dashboard
  - Professional dashboard with real active/draft listings, reservations, revenue estimate, occupancy, counts, and recent activity.
  - Current pass: added real host metrics for active listings, reservations, projected confirmed revenue, markets, average booking value, and 90-day occupancy, plus listing portfolio, create-listing entry, reservation feed, protected states, and host quality insights. Verified against `docs/phase-23-host-dashboard.md`.

- [x] Phase 24: Host listing management
  - Host can view, edit, publish/unpublish, archive where supported, change price/amenities/photos/location carefully, and review reservations only for owned listings.
  - Current pass: added owner-scoped publish/unpublish controls, visible inventory status, protected core edit route, owner-only image management, and non-destructive archive behavior that hides listings from guest search while preserving host records. Amenity editing and richer activity history remain follow-ups in `docs/phase-24-host-listing-management.md`.

- [x] Phase 25: Host reservation management
  - Host reservation page with guest, listing, dates, status, total, created date, and supported actions.
  - Current pass: added host-owned reservation detail routing, privacy-safe guest context, booking timeline, listing links, and reservation-feed navigation.

- [x] Phase 26: Image system
  - Supabase Storage bucket strategy, owner-only listing uploads, optimization, type/size/count validation, ordering, delete, primary photo, and alt text/fallbacks.
  - Current pass: added host upload validation, owner-scoped Storage paths, public listing image URLs, listing image rows, upload cleanup on failure, owner-only delete/primary-photo controls, `supabase/phase10_storage.sql`, and optimized AVIF/WebP-capable Next image delivery for host-managed photos. Applying the Storage migration in live Supabase remains an environment setup step in `docs/phase-26-image-system.md`.

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

- [x] Phase 37: Error handling
  - Add safe failure states for Supabase, network, image upload, geocoder, location denial, booking conflicts, auth expiry, and payments.
  - Current pass: audited core failure paths and quieted expected missing-review-table fallbacks while preserving real error logs and existing `New / No reviews yet` UI behavior.

- [x] Phase 38: Loading states
  - Add polished skeletons for home, search, listing, trips, and host.
  - Current pass: added shared route-level skeletons and `loading.tsx` files for home, search, listing detail, dashboard/trips, and host workspace.

- [x] Phase 39: Empty states
  - Add useful empty states for no search results, favorites, trips, and host listings.
  - Current pass: replaced placeholder empty boxes with action-oriented states for search recovery, saved stays, trip sections, first host listing creation, and empty host reservation feed.

- [x] Phase 40: Mobile design
  - Test 375, 390, 430, and 768px. Use drawers, mobile date picker, mobile filters, map toggle, sticky booking CTA, and no horizontal scroll.
  - Current pass: browser-tested home, search, listing, host, dashboard, and favorites across required mobile widths; verified mobile filters, map toggle, date picker, and reserve anchor; fixed visible horizontal rail scrollbars, compact guest label spacing, and tablet search toolbar clipping.

- [x] Phase 41: Tablet/desktop
  - Test 1024, 1280, 1440, and 1920px with controlled max widths and good search/map use.
  - Current pass: browser-tested required desktop widths, fixed 1024 home nav wrapping, wide category strip clipping, and search toolbar clipping at 1024/1280; verified desktop Map view has no horizontal overflow.

- [x] Phase 42: Accessibility
  - Semantic HTML, keyboard nav, focus states, labels, ARIA, dialog focus trapping, Escape close, SR labels, alt text, contrast, and no div-as-button misuse.
  - Current pass: added global focus-visible styling, accessible menu/picker metadata, Escape/focus restoration, modal photo-gallery focus trapping, live status/error regions, labelled repeated actions, mobile filter expanded state, and host wizard step semantics.

- [x] Phase 43: Performance
  - Optimize images, query patterns, pagination, rendering, server/client boundaries, autocomplete debounce, map loading, and bundle size.
  - Current pass: split the search map into a lazy client chunk, preserved Leaflet lazy loading, added a map skeleton, deferred client-side result ranking while filters update, and added cache headers to successful location lookup APIs.

- [x] Phase 44: SEO and metadata
  - Meaningful metadata, listing dynamic title/description/OpenGraph, canonical if appropriate, no private address exposure, favicon/app description.
  - Current pass: added shared SEO helpers, root/home/search/listing metadata, safe listing OpenGraph/Twitter metadata, noindex metadata for private/auth pages, favicon, robots.txt, and a public sitemap with active listing URLs.

- [x] Phase 45: Not found / error pages
  - Custom 404, global error, listing not found, and unauthorized states.
  - Current pass: added a reusable route-state panel, branded app 404, listing-specific not-found page, app error boundary with retry, and shared host access-gate styling. Verified typecheck, lint, build, local 404, listing missing state, and protected-route redirects.

- [x] Phase 46: Toasts and feedback
  - Consistent feedback for save/remove favorite, reservation, listing publish/save, image failures, and similar events.
  - Current pass: added a shared toast viewport, wired saved-stay, reservation, profile, host onboarding, host listing create/edit/publish, listing photo, trip cancellation, and review submission feedback into consistent success/error/info toasts. Verified typecheck, lint, build, diff check, and local production route smoke.

- [x] Phase 47: URL and navigation quality
  - Meaningful URLs, browser back behavior, and no broken modal routing.
  - Current pass: preserved search page context in listing links/back links, added browser-history-aware photo gallery close behavior, and verified typecheck, lint, build, diff check, local production smoke, and live production smoke.

- [x] Phase 48: Data seeding
  - Dev seed allowed if clearly demo, with real geographic cities/coordinates and legitimate assets.
  - Production runtime must show error/empty state, not silent demo array fallback.
  - Current pass: added explicit listing data status for Supabase-ready/unconfigured/error states, showed honest home/search empty-error states instead of silent fallback inventory, enriched the synthetic seed with real address metadata, and documented the seed-data policy in `docs/phase-48-data-seeding.md`.

- [x] Phase 49: Testing
  - Unit tests for distance, pricing, night calculation, overlap, scoring, validation.
  - Integration/Playwright flows for home, search, listing, sign in, favorite, reserve, trips, create/publish listing, host dashboard.
  - Current pass: added Vitest unit coverage for distance, pricing, nights, overlap, recommendation scoring, and search validation; added Playwright smoke coverage for home, search, listing detail, sign-in redirects, protected guest/host routes, and 404. Credential-backed favorite/reserve/host publish flows remain documented as requiring seeded test accounts.

- [x] Phase 50: Browser QA
  - Click every button/link/tab/filter/menu/dropdown/form/modal/drawer/card across success, failure, empty, loading, guest, host, unauthenticated, mobile, and desktop.
  - Current pass: added Playwright interaction QA for account menu, home search, auth tabs/forms, role choices, password toggle, search guest/filter/sort/map controls, listing gallery/share/save actions, protected redirects, and 404. Credential-backed authenticated flows remain documented for seeded QA accounts.

- [x] Phase 51: Environment variables
  - Complete `.env.example` with site, Supabase, Mapbox, Stripe, OpenAI, and any server-only variables clearly documented.
  - Current pass: expanded `.env.example`, README, and deployment docs with public/site, Supabase, OpenStreetMap/Nominatim, reserved Mapbox, optional AI/OpenAI, optional Stripe, Supabase service-role, and Playwright QA variables.

- [x] Phase 52: Vercel deployment
  - Verify production build, env vars, auth callback, Supabase redirect URLs, Stripe webhook docs, map provider domain, storage, images, and migrations.
  - Current pass: deployed latest commit to Vercel, verified Ready status and alias, confirmed required Vercel env vars, smoke-tested home/search/listing/auth callback/location API/Stripe webhook fallback/protected redirects/404, and documented Supabase dashboard-only redirect/storage/migration checks in `docs/phase-52-vercel-deployment.md`.

- [x] Phase 53: README
  - Rewrite README to accurately describe real features, architecture, screenshots section, stack, database, auth, maps, recommendations, payments, setup, env, migrations, storage, tests, deployment, limitations, and roadmap.
  - Current pass: rewrote `README.md` with live site, feature scope, screenshot placeholders, stack, setup/env, Supabase migrations, storage, tests, deployment, key docs, and limitations; documented in `docs/phase-53-readme.md`.

- [x] Phase 54: Final visual polish
  - Review as professor, recruiter, engineer, and founder. Fix spacing, alignment, typography, images, buttons, modals, forms, nav, responsive behavior, loading, empty, and error states.
  - Current pass: reviewed desktop/mobile screenshots for home, search, listing, and auth; capped one-photo listing gallery height, removed duplicate mobile home category strip, shortened the AI prompt placeholder, and verified typecheck/lint/unit/build/browser QA in `docs/phase-54-final-visual-polish.md`.

- [x] Phase 55: Production quality gate
  - Do not call complete until lint/typecheck/build pass, no console errors, no dead UI, no fake production data, auth/favorites/search/maps/reservations/availability/host/images/trips/RLS/mobile/desktop/errors/loading/deployment all work.
  - Current pass: verified typecheck, lint, unit tests, production build, browser QA, live Vercel status, live smoke routes, desktop/mobile console scan, and data honesty in `docs/phase-55-production-quality-gate.md`.

- [x] Phase 56: End-to-end product test
  - Test new guest flow, host flow, near-me flow, and mobile main guest flow.
  - Current pass: added `tests/e2e/product-flows.spec.ts` covering guest discovery/reservation sign-in handoff, protected host entry, geolocation near-me search, and mobile guest reserve path; verified 13 browser tests in `docs/phase-56-end-to-end-product-test.md`.

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
