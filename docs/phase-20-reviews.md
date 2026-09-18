# Phase 20: Reviews

## Completed

- Added typed listing review data and real listing review reads from Supabase.
- Added real review averages from persisted reviews, with a clear `New · No reviews yet` state.
- Added a guest review form to completed trips only.
- Enforced one review per reservation through the existing unique reservation constraint and review RLS policy.
- Kept guest identity private in public review cards by displaying `Verified guest` instead of profile email or other personal data.
- Revalidated the dashboard, listing detail page, and reservation confirmation after a review is submitted.

## Database dependency

The canonical schema and `supabase/phase5_marketplace_foundation.sql` already contain the `reviews` table, review constraints, indexes, and eligibility policies. The smaller idempotent `supabase/phase9_reviews.sql` migration is also provided for an existing project that only needs the review table and policies. Run one of these in the Supabase SQL Editor before testing review submission.

## Verification

- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
- Local production route smoke tests
- Live Vercel route smoke tests
