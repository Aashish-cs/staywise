-- StayWise Phase 31 calendar availability.
-- Returns individual unavailable nights for one active listing over a bounded
-- visible calendar range. It exposes only dates, not reservations or guest data.

create or replace function public.get_listing_unavailable_dates(
  requested_listing_id uuid,
  requested_start_date date,
  requested_end_date date
)
returns table (unavailable_date date)
language sql
stable
security definer
set search_path = public
as $$
  with requested_days as (
    select generate_series(
      requested_start_date,
      requested_end_date - 1,
      interval '1 day'
    )::date as unavailable_date
  ),
  unavailable_ranges as (
    select reservations.start_date, reservations.end_date
    from public.reservations
    join public.listings on listings.id = reservations.listing_id
    where reservations.listing_id = requested_listing_id
      and reservations.status in ('pending', 'awaiting_payment', 'confirmed')
      and listings.is_active = true
      and daterange(reservations.start_date, reservations.end_date, '[)') &&
        daterange(requested_start_date, requested_end_date, '[)')

    union all

    select
      listing_availability_blocks.start_date,
      listing_availability_blocks.end_date
    from public.listing_availability_blocks
    join public.listings on listings.id = listing_availability_blocks.listing_id
    where listing_availability_blocks.listing_id = requested_listing_id
      and listings.is_active = true
      and daterange(listing_availability_blocks.start_date, listing_availability_blocks.end_date, '[)') &&
        daterange(requested_start_date, requested_end_date, '[)')
  )
  select distinct requested_days.unavailable_date
  from requested_days
  where requested_start_date >= current_date - 7
    and requested_end_date > requested_start_date
    and requested_end_date <= requested_start_date + 90
    and exists (
      select 1
      from unavailable_ranges
      where requested_days.unavailable_date >= unavailable_ranges.start_date
        and requested_days.unavailable_date < unavailable_ranges.end_date
    )
  order by requested_days.unavailable_date;
$$;

grant execute on function public.get_listing_unavailable_dates(uuid, date, date) to anon;
grant execute on function public.get_listing_unavailable_dates(uuid, date, date) to authenticated;
