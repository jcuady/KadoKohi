-- Maintain kk_orders.updated_at on every row change (matches staff UI expectations).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'kk_set_updated_at' AND pronamespace = 'public'::regnamespace
  ) THEN
    CREATE FUNCTION public.kk_set_updated_at()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $fn$
    BEGIN
      NEW.updated_at := now();
      RETURN NEW;
    END;
    $fn$;
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_kk_orders_updated_at ON public.kk_orders;
CREATE TRIGGER trg_kk_orders_updated_at
  BEFORE UPDATE ON public.kk_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.kk_set_updated_at();

-- Store full production scan URLs in kk_tables (visible in Supabase Table Editor).
UPDATE public.kk_tables
SET qr_payload = 'https://www.kadokohi.com' || qr_payload
WHERE qr_payload LIKE '/order/%';
