-- Align customer-facing RPCs with requesting_profile_id() so ownership checks
-- never diverge from the kk_* RLS policies (which all use requesting_profile_id()).
-- Mirrors the 0059 patch already applied to kk_place_order. On native Supabase
-- Auth (sub = profile UUID) this is a no-op; it future-proofs Clerk-style subs.

DO $patch$
DECLARE
  v_target text;
  v_def text;
BEGIN
  FOREACH v_target IN ARRAY ARRAY[
    'kk_place_booth_booking(jsonb)',
    'kk_submit_booth_payment_proof(text, text)',
    'kk_register_for_event(jsonb)',
    'kk_claim_loyalty_reward(text)'
  ] LOOP
    SELECT pg_get_functiondef(('public.' || v_target)::regprocedure) INTO v_def;
    IF v_def IS NULL THEN
      CONTINUE;
    END IF;

    -- Only the customer-identity reads use auth.uid() in these functions.
    v_def := replace(v_def, 'auth.uid()', 'public.requesting_profile_id()');

    EXECUTE v_def;
  END LOOP;
END
$patch$;

-- Defense in depth: admin-only booth RPCs should not be callable by anon.
-- (They still enforce kk_current_role() internally; this removes the public route.)
REVOKE EXECUTE ON FUNCTION public.kk_admin_patch_booth_booking(jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.kk_admin_set_event_date_kind(date, text, text) FROM anon;

NOTIFY pgrst, 'reload schema';
