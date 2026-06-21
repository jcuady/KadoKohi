-- Scoped order reads for ops dashboards: indexes + explicit SELECT RLS.

CREATE INDEX IF NOT EXISTS kk_orders_branch_status_created_idx
  ON public.kk_orders (branch_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS kk_orders_customer_created_idx
  ON public.kk_orders (customer_id, created_at DESC)
  WHERE customer_id IS NOT NULL;

ALTER TABLE public.kk_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS kk_orders_select_customer ON public.kk_orders;
CREATE POLICY kk_orders_select_customer
  ON public.kk_orders
  FOR SELECT
  TO authenticated
  USING (
    public.kk_current_role() = 'customer'
    AND customer_id = auth.uid()
  );

DROP POLICY IF EXISTS kk_orders_select_branch_ops ON public.kk_orders;
CREATE POLICY kk_orders_select_branch_ops
  ON public.kk_orders
  FOR SELECT
  TO authenticated
  USING (
    public.kk_current_role() IN ('barista', 'staff')
    AND (
      public.kk_current_branch() IS NULL
      OR branch_id = public.kk_current_branch()
    )
  );

DROP POLICY IF EXISTS kk_orders_select_admin ON public.kk_orders;
CREATE POLICY kk_orders_select_admin
  ON public.kk_orders
  FOR SELECT
  TO authenticated
  USING (public.kk_current_role() = 'admin');
