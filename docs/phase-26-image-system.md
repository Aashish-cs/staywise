# Phase 26: Image System

## Completed

- Added server-side image file validation for type, size, and total count.
- Added Supabase Storage uploads under an owner/listing-scoped path.
- Added public URL references in `listing_images` with stable ordering and alt text.
- Added cleanup when upload or database insertion fails.
- Kept URL-based images available so existing seeded listings do not break during migration.
- Added owner-only primary-photo promotion and deletion with storage cleanup.
- Added the idempotent `supabase/phase10_storage.sql` bucket and policy migration.
- Enabled optimized Next.js image delivery for configured remote images with AVIF/WebP support and a one-day optimizer cache floor.
- Removed the host image manager’s `unoptimized` override so uploaded Supabase photos use the same responsive optimization pipeline as other listing imagery.

## Follow-up

- Apply the Storage migration in the live Supabase project before testing uploads.
- Add provider-specific responsive transform URLs later if Supabase image transformation is enabled for the project.

## Verification

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `pnpm build`
