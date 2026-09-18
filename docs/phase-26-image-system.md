# Phase 26: Image System

## In progress

- Added server-side image file validation for type, size, and total count.
- Added Supabase Storage uploads under an owner/listing-scoped path.
- Added public URL references in `listing_images` with stable ordering and alt text.
- Added cleanup when upload or database insertion fails.
- Kept URL-based images available so existing seeded listings do not break during migration.
- Added owner-only primary-photo promotion and deletion with storage cleanup.
- Added the idempotent `supabase/phase10_storage.sql` bucket and policy migration.

## Remaining work

- Add image optimization and responsive variants where the provider supports them.
- Apply the Storage migration in the live Supabase project before testing uploads.
