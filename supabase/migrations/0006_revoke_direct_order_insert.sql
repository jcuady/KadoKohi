-- Belt-and-suspenders: orders must use kk_place_order (SECURITY DEFINER), not table INSERT.

DROP POLICY IF EXISTS kk_orders_insert_all ON public.kk_orders;
DROP POLICY IF EXISTS kk_order_items_insert_all ON public.kk_order_items;

REVOKE INSERT ON TABLE public.kk_orders FROM anon, authenticated;
REVOKE INSERT ON TABLE public.kk_order_items FROM anon, authenticated;
