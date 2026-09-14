-- Phase 6 real location foundation for StayWise.
-- Run this once in Supabase SQL Editor after phase5_marketplace_foundation.sql.
-- It adds provider-backed location metadata columns without rewriting existing listings.

alter table public.listings
  add column if not exists place_provider text not null default 'manual',
  add column if not exists place_provider_id text,
  add column if not exists formatted_address text,
  add column if not exists address_city text,
  add column if not exists address_region text,
  add column if not exists address_country text,
  add column if not exists address_country_code text,
  add column if not exists bounds_south numeric(10, 7),
  add column if not exists bounds_north numeric(10, 7),
  add column if not exists bounds_west numeric(10, 7),
  add column if not exists bounds_east numeric(10, 7);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'listings_place_provider_check'
      and conrelid = 'public.listings'::regclass
  ) then
    alter table public.listings
      add constraint listings_place_provider_check
      check (place_provider in ('manual', 'nominatim'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'listings_bounds_check'
      and conrelid = 'public.listings'::regclass
  ) then
    alter table public.listings
      add constraint listings_bounds_check
      check (
        (
          bounds_south is null
          and bounds_north is null
          and bounds_west is null
          and bounds_east is null
        )
        or (
          bounds_south between -90 and 90
          and bounds_north between -90 and 90
          and bounds_west between -180 and 180
          and bounds_east between -180 and 180
          and bounds_south <= bounds_north
          and bounds_west <= bounds_east
        )
      );
  end if;
end $$;

create index if not exists listings_place_provider_idx
  on public.listings (place_provider, place_provider_id);
create index if not exists listings_address_city_region_idx
  on public.listings (address_city, address_region);
