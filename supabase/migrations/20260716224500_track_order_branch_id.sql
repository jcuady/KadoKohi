-- Guest track order: include branch_id for confirmation UI + barista push routing.

DROP FUNCTION IF EXISTS public.kk_track_order(text);

CREATE OR REPLACE FUNCTION public.kk_track_order(order_id text)
RETURNS TABLE (
  id text,
  short_code text,
  channel text,
  branch_id text,
  status text,
  payment_status text,
  payment_method text,
  guest_name text,
  subtotal numeric,
  modifiers_total numeric,
  tax numeric,
  total numeric,
  has_payment_proof boolean,
  items jsonb,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    o.id,
    o.short_code,
    o.channel,
    o.branch_id,
    o.status,
    o.payment_status,
    o.payment_method,
    o.guest_name,
    o.subtotal,
    o.modifiers_total,
    coalesce(o.tax, 0),
    o.total,
    (o.payment_proof_image IS NOT NULL AND length(o.payment_proof_image) > 0),
    coalesce(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', i.id,
            'product_id', i.product_id,
            'product_name_snapshot', i.product_name_snapshot,
            'product_image', nullif(trim(p.image), ''),
            'milk_label_snapshot', i.milk_label_snapshot,
            'size_label_snapshot', i.size_label_snapshot,
            'temperature', i.temperature,
            'qty', i.qty,
            'unit_price', i.unit_price,
            'line_total', i.line_total
          )
          ORDER BY i.created_at
        )
        FROM public.kk_order_items i
        LEFT JOIN public.kk_products p ON p.id = i.product_id
        WHERE i.order_id = o.id
      ),
      '[]'::jsonb
    ),
    o.created_at,
    o.updated_at
  FROM public.kk_orders o
  WHERE o.id = order_id
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.kk_track_order(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kk_track_order(text) TO anon, authenticated;
