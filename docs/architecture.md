# StayWise Architecture

## Product Areas

- Guest web app: search, trip preferences, favorites, reservations, and reservation history.
- Host web app: listing creation, listing management, pricing, availability, and reservation dashboard.
- Backend/API layer: Next.js route handlers and server components.
- Data layer: Supabase Postgres with row-level security policies.
- Auth layer: Supabase Auth with email confirmation and password reset.
- Recommendation engine: deterministic scoring now, optional LLM features later.

## Database Foundation

The Supabase schema is organized around durable marketplace entities:

- Account data: `profiles` and `profile_settings`.
- Listing data: `listings`, listing provider location metadata, `listing_images`, `listing_amenities`, and `listing_availability_blocks`.
- Guest workflow data: `trips`, `favorites`, `reservations`, and `reviews`.
- Product intelligence data: `recommendation_events`.
- Payment-ready data: `payment_records`.

Reservations and availability are protected by database functions and constraints, not only client-side checks. The active-reservation exclusion constraint prevents double-booking, and the availability RPCs hide both active reservations and host-blocked dates from search.

## Recommendation Engine

The first AI feature is explainable ranking. Listings are scored against a trip request using:

- destination match
- guest capacity
- budget fit
- trip purpose
- requested amenities
- purpose-specific amenity signals
- verified host profile availability

Recommendation events are stored when users search, use AI-style prompt parsing, save listings, and confirm reservations. These events give later phases real signals for popularity, personalization, and evaluation without fabricating ratings or reviews.

This is intentionally explainable for a senior design demo. It can be evaluated with synthetic scenarios and does not require paid model calls.

## Location System

StayWise uses a server-side location abstraction for submitted destinations. The current provider is OpenStreetMap/Nominatim, called only from server code for user-triggered searches. Results are cached, attributed, and normalized into provider id, display address, city, region, country, coordinates, and bounds. The app avoids client-side autocomplete against the public Nominatim API.

## Future AI Layer

After the baseline model works, add optional LLM calls for:

- AI trip planner
- host listing description generator
- amenity quality summarizer
- smart price suggestion
- natural-language search parser

The core ranking should keep working if the AI API is unavailable or rate-limited.
