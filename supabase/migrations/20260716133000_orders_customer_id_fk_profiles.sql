-- kk_place_order sets customer_id / staff_id from requesting_profile_id()
-- (kk_profiles.id). After Clerk bridge, profile.id may differ from auth.users.id.
-- Legacy FKs to auth.users caused 409 on place order for those accounts.
-- Drop auth.users FKs first, then remap, then add kk_profiles FKs.

ALTER TABLE public.kk_orders
  DROP CONSTRAINT IF EXISTS kk_orders_customer_id_fkey,
  DROP CONSTRAINT IF EXISTS kk_orders_staff_id_fkey;

ALTER TABLE public.kk_promo_claims
  DROP CONSTRAINT IF EXISTS kk_promo_claims_customer_id_fkey;

-- Remap auth uid → profile id via clerk_user_id.
UPDATE public.kk_orders o
SET customer_id = p.id
FROM public.kk_profiles p
WHERE o.customer_id IS NOT NULL
  AND p.clerk_user_id = o.customer_id::text
  AND NOT EXISTS (SELECT 1 FROM public.kk_profiles p2 WHERE p2.id = o.customer_id);

UPDATE public.kk_orders o
SET staff_id = p.id
FROM public.kk_profiles p
WHERE o.staff_id IS NOT NULL
  AND p.clerk_user_id = o.staff_id::text
  AND NOT EXISTS (SELECT 1 FROM public.kk_profiles p2 WHERE p2.id = o.staff_id);

UPDATE public.kk_promo_claims c
SET customer_id = p.id
FROM public.kk_profiles p
WHERE c.customer_id IS NOT NULL
  AND p.clerk_user_id = c.customer_id::text
  AND NOT EXISTS (SELECT 1 FROM public.kk_profiles p2 WHERE p2.id = c.customer_id);

UPDATE public.kk_orders o
SET customer_id = NULL
WHERE o.customer_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.kk_profiles p WHERE p.id = o.customer_id);

UPDATE public.kk_orders o
SET staff_id = NULL
WHERE o.staff_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.kk_profiles p WHERE p.id = o.staff_id);

UPDATE public.kk_promo_claims c
SET customer_id = NULL
WHERE c.customer_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.kk_profiles p WHERE p.id = c.customer_id);

ALTER TABLE public.kk_orders
  ADD CONSTRAINT kk_orders_customer_id_fkey
    FOREIGN KEY (customer_id) REFERENCES public.kk_profiles(id) ON DELETE SET NULL,
  ADD CONSTRAINT kk_orders_staff_id_fkey
    FOREIGN KEY (staff_id) REFERENCES public.kk_profiles(id) ON DELETE SET NULL;

ALTER TABLE public.kk_promo_claims
  ADD CONSTRAINT kk_promo_claims_customer_id_fkey
    FOREIGN KEY (customer_id) REFERENCES public.kk_profiles(id) ON DELETE SET NULL;

-- Prefer auth uid as profile id for new rows when sub is a UUID (Supabase Auth).
CREATE OR REPLACE FUNCTION public.kk_ensure_my_profile(p_name text DEFAULT NULL::text)
RETURNS kk_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_sub text := public.kk_requesting_user_sub();
  v_email text := COALESCE(NULLIF(trim(auth.jwt() ->> 'email'), ''), '');
  v_name text;
  v_row public.kk_profiles;
  v_new_id uuid;
BEGIN
  IF v_sub IS NULL OR v_sub = '' THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_name := COALESCE(
    NULLIF(trim(p_name), ''),
    NULLIF(trim(auth.jwt() -> 'user_metadata' ->> 'name'), ''),
    NULLIF(trim(auth.jwt() -> 'unsafe_metadata' ->> 'name'), ''),
    split_part(NULLIF(v_email, ''), '@', 1),
    'User'
  );

  SELECT * INTO v_row
  FROM public.kk_profiles
  WHERE clerk_user_id = v_sub
  LIMIT 1;

  IF FOUND THEN
    UPDATE public.kk_profiles
    SET
      name = COALESCE(NULLIF(trim(p_name), ''), name),
      email = CASE WHEN v_email <> '' THEN v_email ELSE email END
    WHERE id = v_row.id
    RETURNING * INTO v_row;
    RETURN v_row;
  END IF;

  SELECT * INTO v_row
  FROM public.kk_profiles
  WHERE id = public.kk_try_uuid_from_text(v_sub)
  LIMIT 1;

  IF FOUND THEN
    UPDATE public.kk_profiles
    SET
      clerk_user_id = COALESCE(clerk_user_id, v_sub),
      name = COALESCE(NULLIF(trim(p_name), ''), name),
      email = CASE WHEN v_email <> '' THEN v_email ELSE email END
    WHERE id = v_row.id
    RETURNING * INTO v_row;
    RETURN v_row;
  END IF;

  IF v_email <> '' THEN
    SELECT * INTO v_row
    FROM public.kk_profiles
    WHERE lower(email) = lower(v_email)
    LIMIT 1;

    IF FOUND THEN
      UPDATE public.kk_profiles
      SET
        clerk_user_id = v_sub,
        name = COALESCE(NULLIF(trim(p_name), ''), name),
        email = v_email
      WHERE id = v_row.id
      RETURNING * INTO v_row;
      RETURN v_row;
    END IF;
  END IF;

  v_new_id := COALESCE(public.kk_try_uuid_from_text(v_sub), gen_random_uuid());

  BEGIN
    INSERT INTO public.kk_profiles (id, clerk_user_id, email, name, role, loyalty_stamps)
    VALUES (v_new_id, v_sub, COALESCE(v_email, ''), v_name, 'customer', 0)
    RETURNING * INTO v_row;
  EXCEPTION
    WHEN unique_violation THEN
      SELECT * INTO v_row
      FROM public.kk_profiles
      WHERE clerk_user_id = v_sub
         OR id = public.kk_try_uuid_from_text(v_sub)
      LIMIT 1;

      IF NOT FOUND THEN
        RAISE;
      END IF;

      UPDATE public.kk_profiles
      SET
        clerk_user_id = COALESCE(clerk_user_id, v_sub),
        name = COALESCE(NULLIF(trim(p_name), ''), name),
        email = CASE WHEN v_email <> '' THEN v_email ELSE email END
      WHERE id = v_row.id
      RETURNING * INTO v_row;
  END;

  RETURN v_row;
END;
$function$;

NOTIFY pgrst, 'reload schema';
