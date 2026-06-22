-- Reliable admin event delete (SECURITY DEFINER; registrations cascade via FK).

CREATE OR REPLACE FUNCTION public.kk_admin_delete_event(p_event_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.kk_current_role() <> 'admin' THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  DELETE FROM public.kk_events WHERE id = p_event_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found or already deleted';
  END IF;

  RETURN jsonb_build_object('ok', true, 'id', p_event_id);
END;
$$;

REVOKE ALL ON FUNCTION public.kk_admin_delete_event(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kk_admin_delete_event(text) TO authenticated;
