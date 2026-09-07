# StayWise Architecture

## Product Areas

- Guest web app: search, trip preferences, favorites, reservations, and reservation history.
- Host web app: listing creation, listing management, pricing, availability, and reservation dashboard.
- Backend/API layer: Next.js route handlers and server components.
- Data layer: Supabase Postgres with row-level security policies.
- Auth layer: Supabase Auth with email confirmation and password reset.
- Recommendation engine: deterministic scoring now, optional LLM features later.

## Recommendation Engine

The first AI feature is explainable ranking. Listings are scored against a trip request using:

- destination match
- guest capacity
- monthly availability
- budget fit
- trip purpose
- requested amenities
- purpose-specific amenity signals
- host reliability
- listing rating and review volume

This is intentionally explainable for a senior design demo. It can be evaluated with synthetic scenarios and does not require paid model calls.

## Future AI Layer

After the baseline model works, add optional LLM calls for:

- AI trip planner
- host listing description generator
- amenity quality summarizer
- smart price suggestion
- natural-language search parser

The core ranking should keep working if the AI API is unavailable or rate-limited.
