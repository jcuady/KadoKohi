-- Reliable admin table delete (bypasses RLS edge cases, keeps order history via ON DELETE SET NULL).

CREATE OR REPLACE FUNCTION public.kk_admin_delete_table(p_table_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.kk_current_role() <> 'admin' THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  DELETE FROM public.kk_tables WHERE id = p_table_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Table not found or already deleted';
  END IF;

  RETURN jsonb_build_object('ok', true, 'id', p_table_id);
END;
$$;

REVOKE ALL ON FUNCTION public.kk_admin_delete_table(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kk_admin_delete_table(text) TO authenticated;
