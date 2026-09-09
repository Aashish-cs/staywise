create extension if not exists pgcrypto;
create extension if not exists btree_gist;

do $$
begin
  create type public.account_role as enum ('guest', 'host');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role public.account_role not null default 'guest',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  host_id uuid references public.profiles(id) on delete set null,
  title text not null,
  description text not null,
  city text not null,
  state text not null,
  country text not null default 'United States',
  neighborhood text,
  property_type text not null,
  price_per_night integer not null check (price_per_night > 0),
  capacity integer not null check (capacity > 0),
  bedrooms integer not null check (bedrooms >= 0),
  bathrooms numeric(3, 1) not null check (bathrooms >= 0),
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.listings alter column host_id drop not null;

do $$
begin
  alter table public.listings drop constraint if exists listings_host_id_fkey;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'listings_host_id_fkey'
      and conrelid = 'public.listings'::regclass
  ) then
    alter table public.listings
      add constraint listings_host_id_fkey
      foreign key (host_id) references public.profiles(id) on delete set null;
  end if;
end $$;

create table if not exists public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  image_url text not null,
  alt_text text not null,
  sort_order integer not null default 0
);

create table if not exists public.listing_amenities (
  listing_id uuid not null references public.listings(id) on delete cascade,
  amenity text not null,
  primary key (listing_id, amenity)
);

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references public.profiles(id) on delete cascade,
  destination text not null,
  start_date date not null,
  end_date date not null,
  guests integer not null check (guests > 0),
  max_nightly_budget integer not null check (max_nightly_budget > 0),
  trip_purpose text not null,
  preferred_amenities text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date > start_date)
);

create table if not exists public.favorites (
  guest_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (guest_id, listing_id)
);

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete restrict,
  trip_id uuid references public.trips(id) on delete set null,
  start_date date not null,
  end_date date not null,
  guests integer not null check (guests > 0),
  nightly_rate integer not null check (nightly_rate > 0),
  total_amount integer not null check (total_amount > 0),
  status text not null default 'confirmed' check (status in ('pending', 'awaiting_payment', 'confirmed', 'cancelled', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date > start_date)
);

create index if not exists listings_city_state_idx on public.listings (city, state);
create index if not exists listings_host_idx on public.listings (host_id);
create index if not exists reservations_guest_idx on public.reservations (guest_id);
create index if not exists reservations_listing_dates_idx on public.reservations (listing_id, start_date, end_date);
create index if not exists trips_guest_idx on public.trips (guest_id);

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

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.listing_images enable row level security;
alter table public.listing_amenities enable row level security;
alter table public.trips enable row level security;
alter table public.favorites enable row level security;
alter table public.reservations enable row level security;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role public.account_role;
begin
  requested_role :=
    case new.raw_user_meta_data ->> 'role'
      when 'host' then 'host'::public.account_role
      else 'guest'::public.account_role
    end;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    new.raw_user_meta_data ->> 'full_name',
    requested_role
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        role = excluded.role,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop policy if exists "Profiles are readable by owner" on public.profiles;
drop policy if exists "Profiles are editable by owner" on public.profiles;
drop policy if exists "Active listings are public" on public.listings;
drop policy if exists "Hosts create own listings" on public.listings;
drop policy if exists "Hosts update own listings" on public.listings;
drop policy if exists "Hosts delete own listings" on public.listings;
drop policy if exists "Listing images follow listing visibility" on public.listing_images;
drop policy if exists "Hosts manage own listing images" on public.listing_images;
drop policy if exists "Listing amenities follow listing visibility" on public.listing_amenities;
drop policy if exists "Hosts manage own listing amenities" on public.listing_amenities;
drop policy if exists "Guests manage own trips" on public.trips;
drop policy if exists "Guests manage own favorites" on public.favorites;
drop policy if exists "Guests and hosts read related reservations" on public.reservations;
drop policy if exists "Guests create own reservations" on public.reservations;
drop policy if exists "Guests cancel own reservations" on public.reservations;
drop function if exists public.create_reservation(uuid, date, date, integer);
drop function if exists public.cancel_reservation(uuid);

create policy "Profiles are readable by owner"
on public.profiles for select
using (auth.uid() = id);

create policy "Profiles are editable by owner"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Active listings are public"
on public.listings for select
using (is_active = true or auth.uid() = host_id);

create policy "Hosts create own listings"
on public.listings for insert
with check (
  auth.uid() = host_id
  and exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'host'
  )
);

create policy "Hosts update own listings"
on public.listings for update
using (auth.uid() = host_id)
with check (auth.uid() = host_id);

create policy "Hosts delete own listings"
on public.listings for delete
using (auth.uid() = host_id);

create policy "Listing images follow listing visibility"
on public.listing_images for select
using (
  exists (
    select 1 from public.listings
    where listings.id = listing_images.listing_id
      and (listings.is_active = true or listings.host_id = auth.uid())
  )
);

create policy "Hosts manage own listing images"
on public.listing_images for all
using (
  exists (
    select 1 from public.listings
    where listings.id = listing_images.listing_id
      and listings.host_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.listings
    where listings.id = listing_images.listing_id
      and listings.host_id = auth.uid()
  )
);

create policy "Listing amenities follow listing visibility"
on public.listing_amenities for select
using (
  exists (
    select 1 from public.listings
    where listings.id = listing_amenities.listing_id
      and (listings.is_active = true or listings.host_id = auth.uid())
  )
);

create policy "Hosts manage own listing amenities"
on public.listing_amenities for all
using (
  exists (
    select 1 from public.listings
    where listings.id = listing_amenities.listing_id
      and listings.host_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.listings
    where listings.id = listing_amenities.listing_id
      and listings.host_id = auth.uid()
  )
);

create policy "Guests manage own trips"
on public.trips for all
using (auth.uid() = guest_id)
with check (
  auth.uid() = guest_id
  and exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'guest'
  )
);

create policy "Guests manage own favorites"
on public.favorites for all
using (auth.uid() = guest_id)
with check (
  auth.uid() = guest_id
  and exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'guest'
  )
);

create policy "Guests and hosts read related reservations"
on public.reservations for select
using (
  auth.uid() = guest_id
  or exists (
    select 1 from public.listings
    where listings.id = reservations.listing_id
      and listings.host_id = auth.uid()
  )
);

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

create or replace function public.cancel_reservation(reservation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.reservations
  set status = 'cancelled',
      updated_at = now()
  where id = reservation_id
    and guest_id = auth.uid()
    and status = 'confirmed';
end;
$$;

grant execute on function public.cancel_reservation(uuid) to authenticated;
