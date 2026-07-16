-- Server-side: online/merch guest orders cannot use QR Ph (account required).
-- Guests on online/merch must supply a pickup name (GCash path).

CREATE OR REPLACE FUNCTION public.kk_orders_reject_guest_online_paymongo()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.channel IN ('online', 'merch')
     AND NEW.customer_id IS NULL
     AND NEW.payment_method = 'paymongo' THEN
    RAISE EXCEPTION 'QR Ph online checkout requires a signed-in customer account';
  END IF;

  IF NEW.channel IN ('online', 'merch')
     AND NEW.customer_id IS NULL
     AND (NEW.guest_name IS NULL OR length(trim(NEW.guest_name)) < 1 OR length(NEW.guest_name) > 80) THEN
    RAISE EXCEPTION 'Guest name is required (max 80 characters)';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_kk_orders_guest_online_pay ON public.kk_orders;
CREATE TRIGGER trg_kk_orders_guest_online_pay
  BEFORE INSERT ON public.kk_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.kk_orders_reject_guest_online_paymongo();
