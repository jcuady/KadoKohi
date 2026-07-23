-- Force gateway payment_status/status in kk_place_order locals (RPC return + insert).
-- Trigger remains as defense in depth.
DO $patch$
DECLARE
  def text;
  old_snip text := $o$v_payment_status := coalesce(nullif(trim(payload->>'payment_status'), ''), 'unpaid');
  v_status := coalesce(nullif(trim(payload->>'status'), ''), 'pending');

  FOR v_attempt IN 1..12 LOOP$o$;
  new_snip text := $n$v_payment_status := coalesce(nullif(trim(payload->>'payment_status'), ''), 'unpaid');
  v_status := coalesce(nullif(trim(payload->>'status'), ''), 'pending');

  -- Trust boundary: non-POS gateway methods cannot self-declare paid.
  IF v_channel IS DISTINCT FROM 'pos' AND v_payment_method IN ('paymongo', 'gcash-qr') THEN
    v_payment_status := 'unpaid';
    v_status := 'pending';
  END IF;

  FOR v_attempt IN 1..12 LOOP$n$;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO def
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'kk_place_order';

  IF def IS NULL OR position(old_snip in def) = 0 THEN
    RAISE EXCEPTION 'kk_place_order patch point not found';
  END IF;

  def := replace(def, old_snip, new_snip);
  EXECUTE def;
END;
$patch$;
