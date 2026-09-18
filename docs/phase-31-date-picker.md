# Phase 31: Date picker

## Delivered

- Replaced native date inputs in reservation and search-filter flows with a shared StayWise date-range calendar.
- Added check-in/check-out sequencing, range highlighting, month navigation, responsive popover layout, and keyboard-accessible buttons.
- Disabled past dates, invalid check-out dates, and ranges beyond the 30-night MVP limit.
- Preserved plain ISO hidden fields for server actions and URL query state.
- Kept the existing live availability endpoint as the source of truth after a range is selected.

## Remaining

- Add a privacy-safe calendar availability RPC so already-reserved and host-blocked individual dates can be disabled before selection.
- Reuse the picker in the home search bar and add mobile viewport browser QA.
