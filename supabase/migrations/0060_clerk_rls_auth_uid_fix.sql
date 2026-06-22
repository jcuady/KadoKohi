-- Fix kk_profiles RLS 500s: Clerk JWT sub is user_… (not a UUID). auth.uid() must not be called for Clerk subs.

CREATE OR REPLACE FUNCTION public.kk_is_uuid_text(p_text text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT p_text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
$$;

CREATE OR REPLACE FUNCTION public.kk_requesting_user_sub()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(trim(auth.jwt() ->> 'sub'), '');
$$;

CREATE OR REPLACE FUNCTION public.requesting_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT p.id
      FROM public.kk_profiles p
      WHERE p.clerk_user_id = public.kk_requesting_user_sub()
      LIMIT 1
    ),
    (
      SELECT p.id
      FROM public.kk_profiles p
      WHERE public.kk_is_uuid_text(public.kk_requesting_user_sub())
        AND p.id = public.kk_requesting_user_sub()::uuid
      LIMIT 1
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.kk_current_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.role
  FROM public.kk_profiles p
  WHERE p.id = public.requesting_profile_id()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.kk_current_branch()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.branch_id
  FROM public.kk_profiles p
  WHERE p.id = public.requesting_profile_id()
  LIMIT 1;
$$;

-- Allow authenticated users to read their own row by Clerk id before requesting_profile_id() is populated.
DROP POLICY IF EXISTS kk_profiles_select_self_or_internal ON public.kk_profiles;

CREATE POLICY kk_profiles_select_self_or_internal
  ON public.kk_profiles FOR SELECT TO authenticated
  USING (
    clerk_user_id = public.kk_requesting_user_sub()
    OR id = public.requesting_profile_id()
    OR public.kk_current_role() = 'admin'
    OR (
      public.kk_current_role() IN ('barista', 'staff')
      AND branch_id = public.kk_current_branch()
    )
  );

GRANT EXECUTE ON FUNCTION public.kk_is_uuid_text(text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.kk_ensure_my_profile(text) TO authenticated;

NOTIFY pgrst, 'reload schema';
