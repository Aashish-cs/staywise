-- Phase 2 marketplace seed data for StayWise.
-- Run this once in Supabase SQL Editor after schema.sql.
-- Listings are synthetic StayWise marketplace records, not Airbnb data.

begin;

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

drop policy if exists "Guests create own reservations" on public.reservations;
drop policy if exists "Guests cancel own reservations" on public.reservations;

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
      and listings.capacity >= reservations.guests
      and listings.price_per_night = reservations.nightly_rate
  )
);

drop function if exists public.cancel_reservation(uuid);

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

with seed_listings (
  id,
  title,
  description,
  city,
  state,
  country,
  neighborhood,
  property_type,
  price_per_night,
  capacity,
  bedrooms,
  bathrooms,
  latitude,
  longitude
) as (
  values
    (
      '11111111-1111-4111-8111-111111111111'::uuid,
      'Deep Ellum loft with skyline workspace',
      'A bright Dallas loft built for food weekends and focused remote work, with a real desk, fast Wi-Fi, garage parking, and walkable nightlife nearby.',
      'Dallas',
      'TX',
      'United States',
      'Deep Ellum',
      'Loft',
      184,
      3,
      1,
      1.0,
      32.784100,
      -96.783900
    ),
    (
      '22222222-2222-4222-8222-222222222222'::uuid,
      'Bishop Arts bungalow with patio kitchen',
      'A calm Dallas bungalow for couples or small families, with a chef-ready kitchen, private patio, washer, and easy access to galleries and restaurants.',
      'Dallas',
      'TX',
      'United States',
      'Bishop Arts District',
      'House',
      213,
      5,
      2,
      2.0,
      32.748300,
      -96.829700
    ),
    (
      '33333333-3333-4333-8333-333333333333'::uuid,
      'Uptown Dallas apartment near trails',
      'A polished apartment near the Katy Trail with self check-in, elevator access, fast Wi-Fi, and a clean layout for business travel.',
      'Dallas',
      'TX',
      'United States',
      'Uptown',
      'Apartment',
      168,
      2,
      1,
      1.0,
      32.802800,
      -96.800900
    ),
    (
      '44444444-4444-4444-8444-444444444444'::uuid,
      'East Austin terrace loft near coffee',
      'A sunlit loft with a skyline terrace, dedicated work nook, fast Wi-Fi, and quick rides to downtown music, restaurants, and startup offices.',
      'Austin',
      'TX',
      'United States',
      'East Austin',
      'Loft',
      176,
      3,
      1,
      1.0,
      30.263500,
      -97.705900
    ),
    (
      '55555555-5555-4555-8555-555555555555'::uuid,
      'West Loop design apartment by transit',
      'A calm Chicago apartment for city trips, with a true desk setup, transit access, restaurants nearby, and self check-in for late arrivals.',
      'Chicago',
      'IL',
      'United States',
      'West Loop',
      'Apartment',
      162,
      2,
      1,
      1.0,
      41.884000,
      -87.647000
    ),
    (
      '66666666-6666-4666-8666-666666666666'::uuid,
      'Highland townhome with mountain views',
      'A Denver basecamp with mountain views, gear storage, garage parking, a full kitchen, and quick access to downtown and foothill day trips.',
      'Denver',
      'CO',
      'United States',
      'Highland',
      'Townhome',
      198,
      5,
      2,
      2.0,
      39.762000,
      -105.011000
    ),
    (
      '77777777-7777-4777-8777-777777777777'::uuid,
      'Coconut Grove villa with pool',
      'A Miami villa for families and groups, with a private pool, shaded dining, chef kitchen, parking, and a quiet residential setting.',
      'Miami',
      'FL',
      'United States',
      'Coconut Grove',
      'Villa',
      389,
      8,
      4,
      3.0,
      25.729000,
      -80.241000
    ),
    (
      '88888888-8888-4888-8888-888888888888'::uuid,
      'Upper West Side studio by the park',
      'A compact New York studio near Central Park, express trains, neighborhood cafes, fast Wi-Fi, and a quiet sleeping area.',
      'New York',
      'NY',
      'United States',
      'Upper West Side',
      'Apartment',
      206,
      2,
      1,
      1.0,
      40.787000,
      -73.975400
    )
)
insert into public.listings (
  id,
  host_id,
  title,
  description,
  city,
  state,
  country,
  neighborhood,
  property_type,
  price_per_night,
  capacity,
  bedrooms,
  bathrooms,
  latitude,
  longitude,
  is_active
)
select
  id,
  null,
  title,
  description,
  city,
  state,
  country,
  neighborhood,
  property_type,
  price_per_night,
  capacity,
  bedrooms,
  bathrooms,
  latitude,
  longitude,
  true
from seed_listings
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  city = excluded.city,
  state = excluded.state,
  country = excluded.country,
  neighborhood = excluded.neighborhood,
  property_type = excluded.property_type,
  price_per_night = excluded.price_per_night,
  capacity = excluded.capacity,
  bedrooms = excluded.bedrooms,
  bathrooms = excluded.bathrooms,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  is_active = excluded.is_active,
  updated_at = now();

delete from public.listing_images
where listing_id in (
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  '33333333-3333-4333-8333-333333333333',
  '44444444-4444-4444-8444-444444444444',
  '55555555-5555-4555-8555-555555555555',
  '66666666-6666-4666-8666-666666666666',
  '77777777-7777-4777-8777-777777777777',
  '88888888-8888-4888-8888-888888888888'
);

insert into public.listing_images (listing_id, image_url, alt_text, sort_order)
values
  ('11111111-1111-4111-8111-111111111111', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80', 'Sunlit Dallas loft living room', 0),
  ('22222222-2222-4222-8222-222222222222', 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=80', 'Dallas bungalow with bright lounge', 0),
  ('33333333-3333-4333-8333-333333333333', 'https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=1400&q=80', 'Modern Uptown Dallas apartment', 0),
  ('44444444-4444-4444-8444-444444444444', 'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1400&q=80', 'Austin terrace loft interior', 0),
  ('55555555-5555-4555-8555-555555555555', 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1400&q=80', 'Chicago apartment bedroom', 0),
  ('66666666-6666-4666-8666-666666666666', 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1400&q=80', 'Denver townhome exterior', 0),
  ('77777777-7777-4777-8777-777777777777', 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1400&q=80', 'Miami villa with pool', 0),
  ('88888888-8888-4888-8888-888888888888', 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1400&q=80', 'New York studio living space', 0);

delete from public.listing_amenities
where listing_id in (
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  '33333333-3333-4333-8333-333333333333',
  '44444444-4444-4444-8444-444444444444',
  '55555555-5555-4555-8555-555555555555',
  '66666666-6666-4666-8666-666666666666',
  '77777777-7777-4777-8777-777777777777',
  '88888888-8888-4888-8888-888888888888'
);

insert into public.listing_amenities (listing_id, amenity)
values
  ('11111111-1111-4111-8111-111111111111', 'Fast Wi-Fi'),
  ('11111111-1111-4111-8111-111111111111', 'Workspace'),
  ('11111111-1111-4111-8111-111111111111', 'Kitchen'),
  ('11111111-1111-4111-8111-111111111111', 'Parking'),
  ('11111111-1111-4111-8111-111111111111', 'Self check-in'),
  ('22222222-2222-4222-8222-222222222222', 'Fast Wi-Fi'),
  ('22222222-2222-4222-8222-222222222222', 'Kitchen'),
  ('22222222-2222-4222-8222-222222222222', 'Parking'),
  ('22222222-2222-4222-8222-222222222222', 'Washer'),
  ('22222222-2222-4222-8222-222222222222', 'Pet friendly'),
  ('33333333-3333-4333-8333-333333333333', 'Fast Wi-Fi'),
  ('33333333-3333-4333-8333-333333333333', 'Workspace'),
  ('33333333-3333-4333-8333-333333333333', 'Kitchen'),
  ('33333333-3333-4333-8333-333333333333', 'Self check-in'),
  ('44444444-4444-4444-8444-444444444444', 'Fast Wi-Fi'),
  ('44444444-4444-4444-8444-444444444444', 'Workspace'),
  ('44444444-4444-4444-8444-444444444444', 'Kitchen'),
  ('44444444-4444-4444-8444-444444444444', 'Washer'),
  ('44444444-4444-4444-8444-444444444444', 'Self check-in'),
  ('55555555-5555-4555-8555-555555555555', 'Fast Wi-Fi'),
  ('55555555-5555-4555-8555-555555555555', 'Workspace'),
  ('55555555-5555-4555-8555-555555555555', 'Kitchen'),
  ('55555555-5555-4555-8555-555555555555', 'Washer'),
  ('55555555-5555-4555-8555-555555555555', 'Self check-in'),
  ('66666666-6666-4666-8666-666666666666', 'Fast Wi-Fi'),
  ('66666666-6666-4666-8666-666666666666', 'Kitchen'),
  ('66666666-6666-4666-8666-666666666666', 'Parking'),
  ('66666666-6666-4666-8666-666666666666', 'Washer'),
  ('66666666-6666-4666-8666-666666666666', 'Self check-in'),
  ('77777777-7777-4777-8777-777777777777', 'Fast Wi-Fi'),
  ('77777777-7777-4777-8777-777777777777', 'Kitchen'),
  ('77777777-7777-4777-8777-777777777777', 'Parking'),
  ('77777777-7777-4777-8777-777777777777', 'Pool'),
  ('77777777-7777-4777-8777-777777777777', 'Washer'),
  ('88888888-8888-4888-8888-888888888888', 'Fast Wi-Fi'),
  ('88888888-8888-4888-8888-888888888888', 'Workspace'),
  ('88888888-8888-4888-8888-888888888888', 'Kitchen'),
  ('88888888-8888-4888-8888-888888888888', 'Self check-in');

commit;
