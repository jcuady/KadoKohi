-- Surgical audit patch for kk_place_order: named kk_write_audit args avoid overload resolution failures.

DO $patch$
DECLARE
  v_def text;
  v_audit text := $audit$

  PERFORM public.kk_write_audit(
    p_actor_id := v_uid,
    p_actor_email := (SELECT u.email::text FROM auth.users u WHERE u.id = v_uid),
    p_actor_role := (
      CASE
        WHEN v_uid IS NULL THEN 'guest'
        WHEN v_role IN ('admin', 'barista', 'staff') THEN v_role::text
        ELSE coalesce(v_role::text, 'customer')
      END
    ),
    p_action := 'order.created'::text,
    p_entity_type := 'order'::text,
    p_entity_id := v_order_id::text,
    p_branch_id := v_branch_id,
    p_summary := ('Order ' || v_short_code)::text,
    p_metadata := jsonb_build_object(
      'channel', v_channel,
      'short_code', v_short_code,
      'total', v_total
    )
  );
$audit$;
  v_marker constant text := E'  RETURN jsonb_build_object(\n    ''id'', v_order_id,';
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_def
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'kk_place_order'
    AND pg_get_function_arguments(p.oid) = 'payload jsonb';

  IF v_def IS NULL THEN
    RAISE EXCEPTION 'kk_place_order(jsonb) not found';
  END IF;

  IF v_def LIKE '%kk_write_audit%' THEN
    RETURN;
  END IF;

  IF position(v_marker in v_def) = 0 THEN
    RAISE EXCEPTION 'kk_place_order return marker not found; manual patch required';
  END IF;

  v_def := replace(v_def, v_marker, v_audit || v_marker);
  EXECUTE v_def;
END $patch$;

NOTIFY pgrst, 'reload schema';
