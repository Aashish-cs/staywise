-- StayWise Phase 20 review migration.
-- Run this in the Supabase SQL Editor if public.reviews is missing.
-- It is safe to run more than once.

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

create index if not exists reviews_listing_created_idx
  on public.reviews (listing_id, created_at desc);
create index if not exists reviews_guest_idx on public.reviews (guest_id);

alter table public.reviews enable row level security;

drop policy if exists "Public can read reviews for active listings" on public.reviews;
drop policy if exists "Hosts read own listing reviews" on public.reviews;
drop policy if exists "Guests create eligible reviews" on public.reviews;
drop policy if exists "Guests update own reviews" on public.reviews;

create policy "Public can read reviews for active listings"
on public.reviews for select
using (
  exists (
    select 1 from public.listings
    where listings.id = reviews.listing_id
      and listings.is_active = true
  )
);

create policy "Hosts read own listing reviews"
on public.reviews for select
using (
  exists (
    select 1 from public.listings
    where listings.id = reviews.listing_id
      and listings.host_id = auth.uid()
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
