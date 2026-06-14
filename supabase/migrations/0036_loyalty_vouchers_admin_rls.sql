-- Admin dashboard: read/manage loyalty vouchers for customer support.

DROP POLICY IF EXISTS kk_loyalty_vouchers_admin ON public.kk_loyalty_vouchers;
CREATE POLICY kk_loyalty_vouchers_admin
  ON public.kk_loyalty_vouchers FOR ALL
  USING (public.kk_current_role() = 'admin')
  WITH CHECK (public.kk_current_role() = 'admin');
