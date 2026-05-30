-- Capability-based order status lookup for guest (anon) browsers.
-- kk_orders RLS only allows a customer to read their own orders, so a guest
-- who placed an order cannot read it back. This SECURITY DEFINER function
-- returns only public-safe status fields for a SINGLE order, looked up by its
-- unguessable UUID. No listing capability is exposed.
create or replace function public.kk_track_order(order_id text)
returns table (
  id text,
  short_code text,
  channel text,
  status text,
  payment_status text,
  guest_name text,
  total numeric,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select o.id, o.short_code, o.channel, o.status, o.payment_status,
         o.guest_name, o.total, o.created_at, o.updated_at
  from public.kk_orders o
  where o.id = order_id
  limit 1;
$$;

revoke all on function public.kk_track_order(text) from public;
grant execute on function public.kk_track_order(text) to anon, authenticated;
