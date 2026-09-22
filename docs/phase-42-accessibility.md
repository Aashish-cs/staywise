# Phase 42 - Accessibility

## Scope

Phase 42 focused on the shared interactive surfaces that appear across the guest, host, and auth flows. The pass covered keyboard focus visibility, popover/menu semantics, modal dialog behavior, async feedback announcements, and repeated-action labels.

## Completed

- Added a consistent global `:focus-visible` outline for links, buttons, inputs, selects, textareas, and focusable custom controls.
- Improved date and guest picker accessibility with controlled dialog ids, `aria-haspopup`, `aria-expanded`, `aria-controls`, non-modal dialog metadata, Escape close, outside-click close, and focus restoration to the trigger.
- Improved the account menu with outside-click close, Escape close, focus restoration, a changing open/close label, and a labelled menu region.
- Upgraded the listing photo gallery into a real modal interaction with `aria-modal`, labelled heading, initial close-button focus, Escape close, body scroll lock, Tab trapping, thumbnail pressed state, and focus restoration to the opening photo button.
- Added live `role="status"` / `role="alert"` announcements for auth, password reset, password update, AI search, browser location, reservation availability, reservation submission, profile saves, host onboarding, host listing creation, host listing edit, and share/save notices.
- Improved repeated controls with listing-specific labels, including search-card preview actions and host photo-management actions.
- Improved the mobile search filter toggle with `aria-expanded` and `aria-controls`.
- Improved the host listing wizard stepper with current/completed/locked step labels, disabled locked steps, and screen-reader status text for the disabled Continue state.
- Removed visual-only checklist icon announcements where the adjacent text already communicates the item.

## Verification

- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
- Built-app local smoke on `http://127.0.0.1:3012`
  - `/` returned 200
  - `/search?destination=Dallas&guests=2&budget=300&purpose=remote-work` returned 200
  - `/listings/33333333-3333-4333-8333-333333333333?checkIn=2026-10-01&checkOut=2026-10-04&guests=2` returned 200
  - `/dashboard`, `/favorites`, and `/host` redirected to sign-in
  - `/profile` streamed the expected sign-in redirect marker
- Code scan confirmed no clickable `div` or `role="button"` replacements were introduced.

## Notes

Playwright is not installed in the repository, so this phase used build verification, route smoke tests, and focused code inspection rather than adding a new browser-test dependency during the accessibility pass.
