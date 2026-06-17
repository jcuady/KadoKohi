-- kk_place_order calls increment_promo_uses after recording a promo claim; define it if missing.

CREATE OR REPLACE FUNCTION public.increment_promo_uses(code_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.kk_promo_codes
  SET uses = uses + 1,
      updated_at = now()
  WHERE id = code_id;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_promo_uses(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_promo_uses(uuid) TO authenticated, anon, service_role;
