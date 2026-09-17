-- Phase 18 trip management hardening.
-- Run this in Supabase SQL Editor after phase7_booking_hardening.sql.
-- Keeps cancellation status-based: only the guest can cancel their own
-- future confirmed reservation.

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
    and status = 'confirmed'
    and start_date >= current_date;
end;
$$;

grant execute on function public.cancel_reservation(uuid) to authenticated;
