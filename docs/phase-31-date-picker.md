# Phase 31: Date picker

## Delivered

- Replaced native date inputs in reservation and search-filter flows with a shared StayWise date-range calendar.
- Added check-in/check-out sequencing, range highlighting, month navigation, responsive popover layout, and keyboard-accessible buttons.
- Disabled past dates, invalid check-out dates, and ranges beyond the 30-night MVP limit.
- Preserved plain ISO hidden fields for server actions and URL query state.
- Kept the existing live availability endpoint as the source of truth after a range is selected.
- Added a privacy-safe listing calendar RPC/API that returns unavailable date strings only.
- Disabled booked and host-blocked nights in the reservation calendar before submit.
- Reused the shared picker in the home search bar so first-screen date selection matches search/detail flows.
- Added browser coverage for the home calendar dialog.

## Remaining

- Apply `supabase/phase31_calendar_availability.sql` in live Supabase if the canonical schema has not been replayed.
- Add richer host-facing calendar block management UI in a later host-operations phase.
