-- Phase 33 pricing calculation.
-- Run this after phase7_booking_hardening.sql.
-- The current schema stores the trusted reservation total, not each fee line.
-- This refresh keeps pricing named and deterministic inside the trusted RPC.

create or replace function public.create_reservation(
  requested_listing_id uuid,
  requested_start_date date,
  requested_end_date date,
  requested_guests integer
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  profile_role public.account_role;
  listing_record public.listings%rowtype;
  nights integer;
  stay_subtotal integer;
  cleaning_fee integer := 0;
  service_fee integer;
  estimated_tax integer := 0;
  reservation_total integer;
  new_reservation_id uuid;
begin
  if current_user_id is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;

  select role
    into profile_role
    from public.profiles
    where id = current_user_id;

  if profile_role is distinct from 'guest'::public.account_role then
    raise exception 'guest_required' using errcode = 'P0001';
  end if;

  if requested_start_date < current_date then
    raise exception 'check_in_in_past' using errcode = 'P0001';
  end if;

  if requested_end_date <= requested_start_date then
    raise exception 'invalid_date_range' using errcode = 'P0001';
  end if;

  nights := requested_end_date - requested_start_date;

  if nights > 30 then
    raise exception 'maximum_stay_exceeded' using errcode = 'P0001';
  end if;

  if requested_guests < 1 then
    raise exception 'invalid_guest_count' using errcode = 'P0001';
  end if;

  select *
    into listing_record
    from public.listings
    where id = requested_listing_id
      and is_active = true
    for update;

  if not found then
    raise exception 'listing_unavailable' using errcode = 'P0001';
  end if;

  if listing_record.host_id is not null and listing_record.host_id = current_user_id then
    raise exception 'host_cannot_book_own_listing' using errcode = 'P0001';
  end if;

  if requested_guests > listing_record.capacity then
    raise exception 'guest_capacity_exceeded' using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from public.reservations
    where listing_id = requested_listing_id
      and status in ('pending', 'awaiting_payment', 'confirmed')
      and daterange(start_date, end_date, '[)') &&
        daterange(requested_start_date, requested_end_date, '[)')
  ) then
    raise exception 'reservation_conflict' using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from public.listing_availability_blocks
    where listing_id = requested_listing_id
      and daterange(start_date, end_date, '[)') &&
        daterange(requested_start_date, requested_end_date, '[)')
  ) then
    raise exception 'listing_blocked' using errcode = 'P0001';
  end if;

  stay_subtotal := listing_record.price_per_night * nights;
  service_fee := round((stay_subtotal + cleaning_fee)::numeric * 0.12)::integer;
  reservation_total := stay_subtotal + cleaning_fee + service_fee + estimated_tax;

  insert into public.reservations (
    guest_id,
    listing_id,
    start_date,
    end_date,
    guests,
    nightly_rate,
    total_amount,
    status
  )
  values (
    current_user_id,
    listing_record.id,
    requested_start_date,
    requested_end_date,
    requested_guests,
    listing_record.price_per_night,
    reservation_total,
    'confirmed'
  )
  returning id into new_reservation_id;

  insert into public.payment_records (
    reservation_id,
    guest_id,
    provider,
    amount_cents,
    currency,
    status
  )
  values (
    new_reservation_id,
    current_user_id,
    'staywise_mvp',
    reservation_total * 100,
    'USD',
    'not_required'
  );

  return new_reservation_id;
end;
$$;

grant execute on function public.create_reservation(uuid, date, date, integer) to authenticated;
