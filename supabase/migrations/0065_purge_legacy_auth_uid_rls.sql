-- Legacy RLS policies (pre-Clerk names) still call auth.uid(), which throws 22P02 for Clerk subs.
-- They were never dropped because 0059 used different policy names. Remove them; keep kk_* Clerk policies.

-- kk_orders
DROP POLICY IF EXISTS orders_customer_select ON public.kk_orders;
DROP POLICY IF EXISTS orders_staff_update ON public.kk_orders;

-- kk_order_items
DROP POLICY IF EXISTS order_items_select ON public.kk_order_items;

-- kk_profiles (0015-era names)
DROP POLICY IF EXISTS profiles_select_own ON public.kk_profiles;
DROP POLICY IF EXISTS profiles_update_own ON public.kk_profiles;
DROP POLICY IF EXISTS profiles_insert_own ON public.kk_profiles;

-- kk_payment_transactions
DROP POLICY IF EXISTS payments_select ON public.kk_payment_transactions;

-- kk_audit_logs (duplicate insert policy)
DROP POLICY IF EXISTS audit_authenticated_insert ON public.kk_audit_logs;

-- kk_loyalty_vouchers
DROP POLICY IF EXISTS kk_loyalty_vouchers_select_own ON public.kk_loyalty_vouchers;
CREATE POLICY kk_loyalty_vouchers_select_own
  ON public.kk_loyalty_vouchers FOR SELECT TO authenticated
  USING (
    customer_id = public.requesting_profile_id()
    OR public.kk_current_role() IN ('admin', 'barista', 'staff')
  );

-- kk_event_registrations
DROP POLICY IF EXISTS kk_event_registrations_select ON public.kk_event_registrations;
CREATE POLICY kk_event_registrations_select
  ON public.kk_event_registrations FOR SELECT TO authenticated
  USING (
    customer_id = public.requesting_profile_id()
    OR public.kk_current_role() IN ('admin', 'barista', 'staff')
  );

NOTIFY pgrst, 'reload schema';
