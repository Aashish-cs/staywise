# Phase 9 Availability Search

Status: Completed foundation and verified locally

Last updated: 2026-09-14

## Existing Trusted Availability Logic

StayWise availability search uses the database RPC `get_available_listing_ids`, which excludes:

- active reservations with `pending`, `awaiting_payment`, or `confirmed` status
- host-created availability blocks
- invalid ranges where checkout is not after check-in
- past check-in dates

The reservation creation RPC still performs the final trusted overlap check before a booking is inserted, so search results and booking confirmation share the same availability model.

## Added In This Phase

- The Phase 8 server-side search path now calls the availability RPC when check-in and check-out are valid.
- Date ranges now appear in active search chips.
- Search results show a visible confirmation that selected dates were checked against reservations and host blocks.
- Empty search states now explain when selected dates may be unavailable instead of showing a generic no-results message.

## Known Follow-Up

Phase 31 should replace native date fields with a professional date picker that disables known unavailable dates before the user submits the search.
