# Phase 29: Optional LLM layer

## Delivered

- Added an optional server-only provider adapter for natural-language search.
- The provider returns only structured search filters, not listing facts, availability, ratings, or booking decisions.
- Added strict schema validation before any model output reaches search state.
- Added an eight-second timeout and deterministic parser fallback for missing keys, provider errors, invalid output, or local development.
- Added configurable `STAYWISE_AI_API_KEY`, `STAYWISE_AI_BASE_URL`, and `STAYWISE_AI_MODEL` environment variables.

## Product behavior

- The app works with no AI key and no paid provider.
- Client code never receives or imports the server-only API key.
- The deterministic parser remains the baseline, so travel searches continue working when optional AI is unavailable.

## Remaining

- Add host description assistance only after the host editor has a deliberate draft/review flow.
- Add provider usage monitoring and a per-user request budget before enabling a paid provider in production.
