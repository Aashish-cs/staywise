-- Phase 3 marketplace foundation migration for StayWise.
-- Run this once in Supabase SQL Editor after phase4_availability.sql.
-- It adds production-ready support tables for settings, host calendar blocks,
-- eligible reviews, recommendation event logging, and payment records.

create extension if not exists btree_gist;

create table if not exists public.profile_settings (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  trip_reminder_emails boolean not null default true,
  host_digest_emails boolean not null default true,
  marketing_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listing_availability_blocks (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  start_date date not null,
  end_date date not null,
  reason text not null default 'host_block',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date > start_date)
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null unique references public.reservations(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  guest_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  body text not null check (char_length(body) between 20 and 1200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recommendation_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  event_name text not null check (
    event_name in (
      'search_submitted',
      'ai_search_parsed',
      'listing_clicked',
      'favorite_created',
      'reservation_started',
      'reservation_confirmed'
    )
  ),
  search_query text,
  search_filters jsonb not null default '{}'::jsonb,
  listing_id uuid references public.listings(id) on delete set null,
  rank_position integer check (rank_position is null or rank_position > 0),
  score integer check (score is null or (score between 0 and 100)),
  result_count integer check (result_count is null or result_count >= 0),
  reason_codes text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.payment_records (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null unique references public.reservations(id) on delete cascade,
  guest_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null default 'manual',
  provider_checkout_id text,
  provider_payment_intent_id text,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'USD' check (char_length(currency) = 3),
  status text not null default 'not_required' check (
    status in ('not_required', 'requires_payment', 'processing', 'succeeded', 'failed', 'refunded')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists listing_availability_blocks_listing_dates_idx
  on public.listing_availability_blocks (listing_id, start_date, end_date);
create index if not exists reviews_listing_created_idx
  on public.reviews (listing_id, created_at desc);
create index if not exists reviews_guest_idx on public.reviews (guest_id);
create index if not exists recommendation_events_profile_created_idx
  on public.recommendation_events (profile_id, created_at desc);
create index if not exists recommendation_events_listing_idx
  on public.recommendation_events (listing_id);
create index if not exists payment_records_reservation_idx
  on public.payment_records (reservation_id);
create index if not exists payment_records_guest_idx on public.payment_records (guest_id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'listing_availability_blocks_no_overlap'
      and conrelid = 'public.listing_availability_blocks'::regclass
  ) then
    alter table public.listing_availability_blocks
      add constraint listing_availability_blocks_no_overlap
      exclude using gist (
        listing_id with =,
        daterange(start_date, end_date, '[)') with &&
      );
  end if;
end $$;

alter table public.profile_settings enable row level security;
alter table public.listing_availability_blocks enable row level security;
alter table public.reviews enable row level security;
alter table public.recommendation_events enable row level security;
alter table public.payment_records enable row level security;

drop policy if exists "Profile settings are managed by owner" on public.profile_settings;
drop policy if exists "Hosts manage own availability blocks" on public.listing_availability_blocks;
drop policy if exists "Public can read reviews for active listings" on public.reviews;
drop policy if exists "Guests create eligible reviews" on public.reviews;
drop policy if exists "Guests update own reviews" on public.reviews;
drop policy if exists "Users read own recommendation events" on public.recommendation_events;
drop policy if exists "Users write recommendation events" on public.recommendation_events;
drop policy if exists "Guests and hosts read related payment records" on public.payment_records;

create policy "Profile settings are managed by owner"
on public.profile_settings for all
using (auth.uid() = profile_id)
with check (auth.uid() = profile_id);

create policy "Hosts manage own availability blocks"
on public.listing_availability_blocks for all
using (
  exists (
    select 1 from public.listings
    where listings.id = listing_availability_blocks.listing_id
      and listings.host_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.listings
    where listings.id = listing_availability_blocks.listing_id
      and listings.host_id = auth.uid()
  )
);

create policy "Public can read reviews for active listings"
on public.reviews for select
using (
  exists (
    select 1 from public.listings
    where listings.id = reviews.listing_id
      and listings.is_active = true
  )
);

create policy "Guests create eligible reviews"
on public.reviews for insert
with check (
  auth.uid() = guest_id
  and exists (
    select 1 from public.reservations
    where reservations.id = reviews.reservation_id
      and reservations.guest_id = auth.uid()
      and reservations.listing_id = reviews.listing_id
      and reservations.status = 'completed'
  )
);

create policy "Guests update own reviews"
on public.reviews for update
using (auth.uid() = guest_id)
with check (
  auth.uid() = guest_id
  and exists (
    select 1 from public.reservations
    where reservations.id = reviews.reservation_id
      and reservations.guest_id = auth.uid()
      and reservations.listing_id = reviews.listing_id
      and reservations.status = 'completed'
  )
);

create policy "Users read own recommendation events"
on public.recommendation_events for select
using (auth.uid() = profile_id);

create policy "Users write recommendation events"
on public.recommendation_events for insert
with check (profile_id is null or auth.uid() = profile_id);

create policy "Guests and hosts read related payment records"
on public.payment_records for select
using (
  auth.uid() = guest_id
  or exists (
    select 1
    from public.reservations
    join public.listings on listings.id = reservations.listing_id
    where reservations.id = payment_records.reservation_id
      and listings.host_id = auth.uid()
  )
);

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

  if exists (
    select 1
    from public.listing_availability_blocks
    where listing_id = requested_listing_id
      and daterange(start_date, end_date, '[)') &&
        daterange(requested_start_date, requested_end_date, '[)')
  ) then
    raise exception 'listing_blocked' using errcode = 'P0001';
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
      and not exists (
        select 1
        from public.listing_availability_blocks
        where listing_availability_blocks.listing_id = requested_listing_id
          and daterange(listing_availability_blocks.start_date, listing_availability_blocks.end_date, '[)') &&
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
    )
    and not exists (
      select 1
      from public.listing_availability_blocks
      where listing_availability_blocks.listing_id = listings.id
        and daterange(listing_availability_blocks.start_date, listing_availability_blocks.end_date, '[)') &&
          daterange(requested_start_date, requested_end_date, '[)')
    );
$$;

grant execute on function public.get_available_listing_ids(date, date) to anon;
grant execute on function public.get_available_listing_ids(date, date) to authenticated;
