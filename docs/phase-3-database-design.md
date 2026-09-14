# Phase 3 Database Design

Status: Completed and verified locally

Last updated: 2026-09-14

## Audit Summary

The existing database already covered the core marketplace path:

- `profiles` for verified guest/host accounts.
- `listings`, `listing_images`, and `listing_amenities` for searchable stays.
- `trips`, `favorites`, and `reservations` for guest workflow state.
- Reservation status checks, date range validation, active-reservation overlap protection, and RPC-backed reservation creation.
- Availability RPCs that hide unavailable listings without exposing reservation details.

The missing production foundation was around supporting entities that real marketplaces need before UI features can be safely built: profile settings, host calendar blocks, legitimate reviews, recommendation telemetry, and payment records.

## Added In This Phase

`supabase/phase5_marketplace_foundation.sql` adds the following tables:

- `profile_settings`: per-user notification and communication preferences.
- `listing_availability_blocks`: host-owned blocked date ranges with an exclusion constraint to prevent overlapping blocks for the same listing.
- `reviews`: one eligible review per completed reservation, tied to the guest, reservation, and listing.
- `recommendation_events`: search, AI-search, favorite, and reservation events for future recommendation quality signals.
- `payment_records`: payment-ready reservation ledger with provider ids, integer cents, currency, and status.

The canonical fresh setup file, `supabase/schema.sql`, now includes the same tables, indexes, RLS policies, and RPC changes.

## Constraints And Indexes

- UUID primary keys are used for every new row entity.
- `reviews.reservation_id` is unique so a guest cannot review the same stay reservation more than once.
- `listing_availability_blocks_no_overlap` prevents overlapping host blocks for the same listing.
- Date range checks enforce `end_date > start_date`.
- Rating, review length, event score, event result count, rank position, currency, and payment status are constrained at the database layer.
- Indexes were added for listing/date availability checks, review display, recommendation history, and payment lookup.

## RLS Rules

- Users can manage only their own `profile_settings`.
- Hosts can manage availability blocks only for listings they own.
- Public users can read reviews only for active listings.
- Guests can create or update a review only when the linked reservation belongs to them, matches the listing, and is completed.
- Users can read only their own recommendation events.
- Recommendation events can be written for the current signed-in user or anonymously with `profile_id = null`.
- Payment records can be read by the guest or the host who owns the reservation listing.

## Reservation And Availability Changes

`public.create_reservation(...)` now also:

- Rejects date ranges blocked by the host through `listing_availability_blocks`.
- Creates a `payment_records` row with `provider = 'staywise_mvp'` and `status = 'not_required'` so the app has a payment ledger without pretending to process cards.

`public.check_listing_availability(...)` and `public.get_available_listing_ids(...)` now exclude both active reservations and host availability blocks.

## App Integration

The app now records recommendation events when:

- The recommendation API ranks a submitted search.
- The AI-style natural language search parser interprets a prompt.
- A guest saves a favorite.
- A guest confirms a reservation.

These writes are intentionally non-blocking. If the migration has not been applied yet, the app still works and silently skips the event insert.

## Supabase Step

For the existing hosted project, run this file in Supabase SQL Editor:

```sql
supabase/phase5_marketplace_foundation.sql
```

For a fresh database, run `supabase/schema.sql`, then the seed file if demo listings are needed.
