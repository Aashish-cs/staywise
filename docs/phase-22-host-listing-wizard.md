# Phase 22: Host Listing Wizard

## In progress

- Converted the long listing form into a five-step flow: basics, location, pricing, amenities/photos, and review/publish.
- Added step readiness checks so incomplete sections cannot be skipped accidentally.
- Added a guest-facing draft preview and quality score throughout the flow.
- Added browser draft persistence so an interrupted listing is recoverable on the same device.
- Kept publish validation server-side through the existing Zod-backed server action.

## Remaining work

- Replace external image URLs with validated Supabase Storage uploads.
- Add provider-backed address lookup and stored coordinates to the host flow.
- Add durable server-side draft persistence and edit support.

## Verification

- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
