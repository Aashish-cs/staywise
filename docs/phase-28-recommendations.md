# Phase 28: Recommendation system

## Delivered

- Ranks a larger live candidate set before pagination so page one is not simply the newest database rows.
- Uses existing explainable signals for destination, distance, budget, capacity, requested amenities, trip purpose, and property fit.
- Enriches active listings with real review averages and counts when `public.reviews` is available.
- Enriches active listings with a privacy-safe completed-stay popularity aggregate when the RPC is installed.
- Personalizes signed-in searches with the user’s saved listing IDs and recent trip destinations.
- Uses listing creation time for a small, honest recent-addition signal.
- Keeps the ranking deterministic and functional when optional review or popularity migrations are unavailable during setup.
- Adds automated ranking coverage for real review scores and completed-stay popularity reasons.

## Guardrails

- No fabricated ratings, popularity, or recommendation reasons are shown.
- Review data is read through the public active-listing review policy; missing migrations degrade to non-review ranking.
- Popularity data is exposed only as an aggregate completed-reservation count for active listing IDs.
- Private favorites and trip history are only queried for the current signed-in user.

## Remaining

- Tune ranking weights after more live reservation/review data exists.
- Apply `supabase/phase28_recommendation_signals.sql` in live Supabase if the canonical schema has not been replayed.
