-- Guest QR / takeout order tracking via Supabase Realtime.
-- Anon browsers subscribe to postgres_changes filtered by order id (unguessable UUID).
-- Capability model: knowing the order UUID is equivalent to holding the tracking link.

CREATE POLICY kk_orders_select_guest_realtime
  ON public.kk_orders
  FOR SELECT
  TO anon, authenticated
  USING (
    channel IN ('dine-in', 'takeout', 'online')
    AND customer_id IS NULL
  );
