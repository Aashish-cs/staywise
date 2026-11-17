-- Payment prerequisites for deployments created before phase5.
-- Apply before phase30_payment_required_reservations.sql and phase58_stripe_reconciliation.sql.


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

alter table public.payment_records enable row level security;

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

alter table public.listing_availability_blocks enable row level security;

drop policy if exists "Guests and hosts read related payment records" on public.payment_records;

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

drop policy if exists "Hosts manage own availability blocks" on public.listing_availability_blocks;

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
  and (
    listing_availability_blocks.created_by is null
    or listing_availability_blocks.created_by = auth.uid()
  )
);

grant select on public.payment_records to authenticated;

grant select, insert, update, delete on public.listing_availability_blocks to authenticated;

grant all on public.payment_records, public.listing_availability_blocks to service_role;

notify pgrst, 'reload schema';
