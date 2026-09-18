# Phase 28: Recommendation system

## Delivered

- Ranks a larger live candidate set before pagination so page one is not simply the newest database rows.
- Uses existing explainable signals for destination, distance, budget, capacity, requested amenities, trip purpose, and property fit.
- Enriches active listings with real review averages and counts when `public.reviews` is available.
- Personalizes signed-in searches with the user’s saved listing IDs and recent trip destinations.
- Uses listing creation time for a small, honest recent-addition signal.
- Keeps the ranking deterministic and functional when reviews are unavailable during setup.

## Guardrails

- No fabricated ratings, popularity, or recommendation reasons are shown.
- Review data is read through the public active-listing review policy; missing migrations degrade to non-review ranking.
- Private favorites and trip history are only queried for the current signed-in user.

## Remaining

- Add a privacy-safe aggregate query for public popularity signals such as completed reservation count, without exposing reservation rows.
- Add automated score tests for the new personalization and rating cases.
