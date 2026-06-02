-- branch_id on kk_profiles is text (e.g. branch_marikina), not uuid.

CREATE OR REPLACE FUNCTION public.kk_handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_branch_id text;
BEGIN
  v_role := COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'role'), ''), 'customer');
  IF v_role NOT IN ('admin', 'barista', 'staff', 'customer') THEN
    v_role := 'customer';
  END IF;

  v_branch_id := NULLIF(trim(NEW.raw_user_meta_data->>'branch_id'), '');

  INSERT INTO public.kk_profiles (id, email, name, role, branch_id, loyalty_stamps)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'name'), ''), split_part(COALESCE(NEW.email, 'user'), '@', 1)),
    v_role,
    CASE WHEN v_role IN ('admin', 'customer') THEN NULL ELSE v_branch_id END,
    0
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(NULLIF(EXCLUDED.name, ''), public.kk_profiles.name),
    role = EXCLUDED.role,
    branch_id = CASE
      WHEN EXCLUDED.role IN ('admin', 'customer') THEN NULL
      ELSE COALESCE(EXCLUDED.branch_id, public.kk_profiles.branch_id)
    END;

  RETURN NEW;
END;
$$;
