-- Phase 3 booking integrity migration for StayWise.
-- Run this once in Supabase SQL Editor after schema.sql/phase2_seed.sql.
-- It adds server-side reservation creation and database-level overlap protection.

create extension if not exists btree_gist;

alter table public.reservations drop constraint if exists reservations_status_check;
alter table public.reservations
  add constraint reservations_status_check
  check (status in ('pending', 'awaiting_payment', 'confirmed', 'cancelled', 'completed'));

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'reservations_no_active_overlap'
      and conrelid = 'public.reservations'::regclass
  ) then
    alter table public.reservations
      add constraint reservations_no_active_overlap
      exclude using gist (
        listing_id with =,
        daterange(start_date, end_date, '[)') with &&
      )
      where (status in ('pending', 'awaiting_payment', 'confirmed'));
  end if;
end $$;

drop policy if exists "Guests create own reservations" on public.reservations;

create policy "Guests create own reservations"
on public.reservations for insert
with check (
  auth.uid() = guest_id
  and exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'guest'
  )
  and exists (
    select 1 from public.listings
    where listings.id = reservations.listing_id
      and listings.is_active = true
      and (listings.host_id is null or listings.host_id <> auth.uid())
      and listings.capacity >= reservations.guests
      and listings.price_per_night = reservations.nightly_rate
  )
);

drop function if exists public.create_reservation(uuid, date, date, integer);

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
  stay_total integer;
  service_fee integer;
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

  nights := requested_end_date - requested_start_date;
  stay_total := listing_record.price_per_night * nights;
  service_fee := round(stay_total::numeric * 0.12)::integer;
  reservation_total := stay_total + service_fee;

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

  return new_reservation_id;
end;
$$;

grant execute on function public.create_reservation(uuid, date, date, integer) to authenticated;
