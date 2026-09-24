# Phase 46: Toasts And Feedback

## What changed

- Added a shared StayWise toast system with success, error, and info tones.
- Mounted the toast viewport globally from the root layout.
- Added toast feedback for saved-stay actions across home, search, favorites, and listing detail.
- Added toast feedback for reservation creation.
- Added toast feedback for profile saves, host onboarding errors, host listing publish/create/edit, and image management.
- Converted previously silent host listing status, photo, trip cancellation, and review actions into stateful server actions with client feedback wrappers.

## Behavior

- Toasts appear in a consistent bottom-right desktop position and bottom mobile position.
- Toasts use `status` for normal feedback and `alert` for error feedback.
- Existing inline form messages remain in place for accessibility and auditability.
- Failed server actions now return user-safe messages instead of failing silently.

## Verification

- Passed: `pnpm typecheck`
- Passed: `pnpm lint`
- Passed: `pnpm build`
- Passed: `git diff --check`
- Passed local production smoke: home, Dallas search, known listing detail, unknown route, dashboard redirect, host redirect, and profile sign-in redirect marker.
- Note: Playwright is not installed in this project, so toast display was verified through TypeScript/lint/build and route hydration boundaries rather than an automated browser screenshot.
