# Phase 50: Browser QA

## What changed

- Added `tests/e2e/interaction-qa.spec.ts` to broaden browser coverage beyond route smoke.
- Browser QA now clicks and verifies:
  - account menu open/close and unauthenticated menu links
  - home search destination submission
  - auth mode tabs
  - host/guest role choices
  - password visibility toggle
  - auth validation feedback
  - search guest picker
  - property type and amenity filter toggles
  - budget input
  - search submit behavior and URL sync
  - sort dropdown
  - map toggle
  - listing photo gallery modal open/close and `#photos` history state
  - listing share feedback
  - unauthenticated save redirect
- Existing browser smoke still covers home, search, listing detail, protected guest/host redirects, and 404.

## Notes

- The QA suite intentionally avoids real account credentials. Fully authenticated favorite persistence, real reservation creation, host publish, and host reservation actions remain best tested with a seeded QA Supabase project.
- Playwright logs a benign Next.js stream-close warning during some parallel shutdowns, but all tests pass and no failed trace artifacts are committed.

## Verification

- Passed: `pnpm test:e2e` with 9 browser tests.
- Passed: `pnpm test`
- Passed: `pnpm typecheck`
- Passed: `pnpm lint`
- Passed: `pnpm build`
