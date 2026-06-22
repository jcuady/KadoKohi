-- Baristas/staff without branch_id must not see every branch's orders (NULL branch was a wildcard).

DROP POLICY IF EXISTS kk_orders_select_branch_ops ON public.kk_orders;

CREATE POLICY kk_orders_select_branch_ops
  ON public.kk_orders
  FOR SELECT
  TO authenticated
  USING (
    public.kk_current_role() IN ('barista', 'staff')
    AND public.kk_current_branch() IS NOT NULL
    AND branch_id = public.kk_current_branch()
  );

NOTIFY pgrst, 'reload schema';
