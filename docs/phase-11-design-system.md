# Phase 11 Design System

Status: Completed foundation and verified locally

Last updated: 2026-09-14

## Added In This Phase

StayWise now has a shared primitive layer in `src/components/ui/primitives.tsx` for common product UI:

- `Button` and `ButtonLink`
- `Badge`
- `Surface`
- `FloatingPanel`
- `SearchBarShell`
- `FieldLabel`, `FieldShell`, `TextInput`, `TextArea`, `SelectControl`, and `DateField`
- `GuestStepper`
- `EmptyState`
- `Notice`
- `Skeleton`
- `Avatar`
- `Price`
- `RatingDisplay`

These primitives encode the StayWise visual language: warm white surfaces, restrained borders, rounded marketplace controls, pink primary action, dark secondary action, sage success states, blue informational states, and consistent typography weight.

## Migrated Surfaces

- Search result cards now use shared `Surface`, `Badge`, `Price`, and action primitives.
- Search empty state now uses the shared `EmptyState` and `Button` primitives.
- Search pagination now uses shared `Surface` and `ButtonLink`.
- Search detail/map side panels now use shared `Surface`, `Badge`, and `ButtonLink`.
- Homepage spotlight cards and listing rails now use shared `Badge` and `Price`.

## Verification

- `pnpm typecheck`
- `pnpm lint`

## Follow-Up Usage

Future phases should migrate additional auth, reservation, host, and listing detail forms onto the same primitives while those pages are being improved. This keeps each phase safer than a full-app visual rewrite.
