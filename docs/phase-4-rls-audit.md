# Phase 4 Row Level Security Audit

Status: Completed and verified locally

Last updated: 2026-09-14

## Policy Coverage

| Table | Public access | Guest access | Host access | Notes |
| --- | --- | --- | --- | --- |
| `profiles` | None | Read/update own profile | Read/update own profile | Public host names are not exposed through `profiles` because the table also contains email. |
| `profile_settings` | None | Manage own settings | Manage own settings | Owner-only preference state. |
| `listings` | Read active listings | Read active listings | Create/update/delete own listings | Host create requires `profiles.role = 'host'`. |
| `listing_images` | Read images for active listings | Read public images | Manage images for own listings | Image visibility follows listing visibility. |
| `listing_amenities` | Read amenities for active listings | Read public amenities | Manage amenities for own listings | Amenity visibility follows listing visibility. |
| `trips` | None | Manage own trips | None | Guest role is required. |
| `favorites` | None | Manage own favorites | None | Guest role is required. |
| `reservations` | None | Read own reservations, create through validated rules/RPC | Read reservations for owned listings | Direct update/delete is not exposed; cancellation uses `cancel_reservation`. |
| `listing_availability_blocks` | None | None | Manage blocks for own listings | Insert/update cannot spoof another user's `created_by`. |
| `reviews` | Read reviews for active listings | Create/update own eligible completed-reservation reviews | Read reviews for owned listings | One review per reservation. No fake review display is used. |
| `recommendation_events` | Anonymous insert allowed with `profile_id = null` | Read own events, write own events | Read own events, write own events | Used for recommendation quality signals, not private booking data. |
| `payment_records` | None | Read own reservation payment records | Read payment records for owned listing reservations | No direct client insert/update policy. Reservation RPC creates MVP ledger rows. |

## Hardening Changes

- Tightened `listing_availability_blocks` writes so a host can only set `created_by` to themselves or leave it null.
- Added a host review read policy so hosts can inspect reviews tied to their own listings even if the listing is inactive later.
- Kept `profiles` private instead of making host profiles publicly readable, because RLS cannot expose only `full_name` while hiding `email` at the policy level.
- Kept reservation mutation inside RPCs and server actions so client-side code cannot directly change status or totals.

## Security Notes

- Active reservation overlap prevention lives in the database exclusion constraint.
- Host-blocked dates are hidden from public users; availability RPCs return only available/not available information.
- Review eligibility is checked against completed reservations.
- Payment rows are readable by related guests/hosts only and cannot be written directly by the browser.
- Recommendation event writes are intentionally low-risk and do not expose reservation or payment details.
