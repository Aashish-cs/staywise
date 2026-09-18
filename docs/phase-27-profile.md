# Phase 27: Profile

## Delivered

- Added a protected `/profile` page for verified accounts.
- Added server-validated display-name updates scoped to the signed-in profile.
- Added notification preferences for trip reminders, host updates, and StayWise news.
- Added a password-reset entry point from the profile workflow.
- Added profile/settings navigation to the shared signed-in account menu.
- Kept the page resilient when the optional `profile_settings` migration has not been applied: profile details still save and the user receives a clear migration-aware status message.

## Verification

- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
- Protected route redirects unauthenticated visitors to `/auth?mode=signin&next=/profile`.

## Remaining

- Add avatar storage and cropping after the core image-storage workflow is proven in Supabase.
- Add public host bio fields only after a privacy-safe public host profile view is designed.
