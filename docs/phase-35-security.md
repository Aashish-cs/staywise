# Phase 35 - Security

Status: current pass complete.

## Delivered

- Audited the main security surfaces: auth redirects, protected routes, API validation, Supabase server/client boundaries, payment webhook verification, storage upload paths, and unsafe HTML usage.
- Added a shared same-origin redirect sanitizer in `src/lib/safe-redirect.ts`.
- Reused the sanitizer in the auth page, auth callback route, and client auth panel.
- Confirmed the app does not use `dangerouslySetInnerHTML`, `eval`, raw SQL string construction, or direct client service-role access.
- Confirmed payment webhooks still require Stripe signatures and server-only environment variables.

## Notes

- Live Supabase still needs the pending `reviews` migration; listing pages log a safe missing-table warning until that is applied.
- Rate limiting is still a later hardening step for public APIs such as AI search and location lookup.
- Storage upload hardening depends on applying the existing Storage migration and bucket policy in Supabase.

## Verification

- Run `pnpm typecheck`, `pnpm lint`, and `pnpm build`.
- Smoke auth redirects, home, search, listing detail, and protected profile redirect.
