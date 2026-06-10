-- Admin-only order delete (removes line items, then the order).

CREATE OR REPLACE FUNCTION public.kk_admin_delete_order(p_order_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.kk_current_role() <> 'admin' THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  DELETE FROM public.kk_order_items WHERE order_id = p_order_id;
  DELETE FROM public.kk_orders WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found or already deleted';
  END IF;

  RETURN jsonb_build_object('ok', true, 'id', p_order_id);
END;
$$;

REVOKE ALL ON FUNCTION public.kk_admin_delete_order(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kk_admin_delete_order(text) TO authenticated;
