-- StayWise Phase 26 image storage migration.
-- Run this in Supabase SQL Editor before testing host photo uploads.
-- It is safe to run more than once.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'listing-images',
  'listing-images',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read listing images" on storage.objects;
drop policy if exists "Hosts upload listing images" on storage.objects;
drop policy if exists "Hosts update listing images" on storage.objects;
drop policy if exists "Hosts delete listing images" on storage.objects;

create policy "Public can read listing images"
on storage.objects for select
using (bucket_id = 'listing-images');

create policy "Hosts upload listing images"
on storage.objects for insert
with check (
  bucket_id = 'listing-images'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'host'
  )
);

create policy "Hosts update listing images"
on storage.objects for update
using (
  bucket_id = 'listing-images'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'listing-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Hosts delete listing images"
on storage.objects for delete
using (
  bucket_id = 'listing-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
