-- Apply after phase30_payment_required_reservations.sql.
-- Stripe webhook retries update the payment and reservation in one transaction.
create or replace function public.apply_stripe_checkout_event(
  requested_reservation_id uuid,
  requested_checkout_id text,
  requested_payment_intent_id text,
  requested_amount_cents integer,
  requested_currency text,
  requested_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  payment public.payment_records%rowtype;
begin
  if requested_status is null or requested_status not in ('succeeded', 'failed') then
    raise exception 'invalid_payment_status';
  end if;
  select * into payment
  from public.payment_records
  where reservation_id = requested_reservation_id
  for update;
  if not found then
    raise exception 'payment_not_found';
  end if;
  if payment.provider <> 'stripe'
    or payment.provider_checkout_id is distinct from requested_checkout_id
    or requested_amount_cents is distinct from payment.amount_cents
    or lower(requested_currency) is distinct from lower(payment.currency) then
    raise exception 'checkout_details_mismatch';
  end if;
  -- An expired or replayed event must never overwrite a successful payment.
  if payment.status in ('succeeded', 'refunded') then
    return;
  end if;
  update public.payment_records
  set status = requested_status,
      provider_payment_intent_id = coalesce(requested_payment_intent_id, provider_payment_intent_id),
      updated_at = now()
  where id = payment.id;
  update public.reservations
  set status = case when requested_status = 'succeeded' then 'confirmed' else 'cancelled' end,
      updated_at = now()
  where id = requested_reservation_id
    and status = 'awaiting_payment';
end;
$$;
revoke all on function public.apply_stripe_checkout_event(uuid, text, text, integer, text, text) from public, anon, authenticated;
grant execute on function public.apply_stripe_checkout_event(uuid, text, text, integer, text, text) to service_role;
