-- PayMongo QR Ph checkout session tracking on orders.

ALTER TABLE public.kk_orders
  ADD COLUMN IF NOT EXISTS paymongo_checkout_session_id text,
  ADD COLUMN IF NOT EXISTS paymongo_payment_id text;

CREATE INDEX IF NOT EXISTS idx_kk_orders_paymongo_checkout_session
  ON public.kk_orders (paymongo_checkout_session_id)
  WHERE paymongo_checkout_session_id IS NOT NULL;
