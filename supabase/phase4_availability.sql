-- Phase 4 availability helpers for StayWise.
-- Run this once in Supabase SQL Editor after phase3_booking_integrity.sql.
-- It lets the app hide or flag stays whose selected dates are already booked,
-- without exposing guest reservation details.

create or replace function public.check_listing_availability(
  requested_listing_id uuid,
  requested_start_date date,
  requested_end_date date
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.listings
    where listings.id = requested_listing_id
      and listings.is_active = true
      and requested_start_date >= current_date
      and requested_end_date > requested_start_date
      and not exists (
        select 1
        from public.reservations
        where reservations.listing_id = requested_listing_id
          and reservations.status in ('pending', 'awaiting_payment', 'confirmed')
          and daterange(reservations.start_date, reservations.end_date, '[)') &&
            daterange(requested_start_date, requested_end_date, '[)')
      )
  );
$$;

grant execute on function public.check_listing_availability(uuid, date, date) to anon;
grant execute on function public.check_listing_availability(uuid, date, date) to authenticated;

create or replace function public.get_available_listing_ids(
  requested_start_date date,
  requested_end_date date
)
returns table (listing_id uuid)
language sql
security definer
set search_path = public
as $$
  select listings.id as listing_id
  from public.listings
  where listings.is_active = true
    and requested_start_date >= current_date
    and requested_end_date > requested_start_date
    and not exists (
      select 1
      from public.reservations
      where reservations.listing_id = listings.id
        and reservations.status in ('pending', 'awaiting_payment', 'confirmed')
        and daterange(reservations.start_date, reservations.end_date, '[)') &&
          daterange(requested_start_date, requested_end_date, '[)')
    );
$$;

grant execute on function public.get_available_listing_ids(date, date) to anon;
grant execute on function public.get_available_listing_ids(date, date) to authenticated;
