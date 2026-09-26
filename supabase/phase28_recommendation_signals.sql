-- StayWise Phase 28 recommendation signals.
-- Run this in the Supabase SQL Editor after the reservation tables exist.
-- Returns only aggregate listing popularity, never raw reservation rows.

create or replace function public.get_listing_popularity_signals(listing_ids uuid[])
returns table (
  listing_id uuid,
  completed_reservation_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    reservations.listing_id,
    count(*)::bigint as completed_reservation_count
  from public.reservations
  join public.listings on listings.id = reservations.listing_id
  where reservations.listing_id = any(listing_ids)
    and reservations.status = 'completed'
    and listings.is_active = true
  group by reservations.listing_id;
$$;

grant execute on function public.get_listing_popularity_signals(uuid[]) to anon;
grant execute on function public.get_listing_popularity_signals(uuid[]) to authenticated;
