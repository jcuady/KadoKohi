-- Customers must read/update their own profile; staff/admin manage all profiles.

ALTER TABLE public.kk_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS kk_profiles_select_own ON public.kk_profiles;
CREATE POLICY kk_profiles_select_own
  ON public.kk_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS kk_profiles_select_staff ON public.kk_profiles;
CREATE POLICY kk_profiles_select_staff
  ON public.kk_profiles FOR SELECT
  TO authenticated
  USING (public.kk_current_role() IN ('admin', 'barista', 'staff'));

DROP POLICY IF EXISTS kk_profiles_update_own ON public.kk_profiles;
CREATE POLICY kk_profiles_update_own
  ON public.kk_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS kk_profiles_admin_all ON public.kk_profiles;
CREATE POLICY kk_profiles_admin_all
  ON public.kk_profiles FOR ALL
  TO authenticated
  USING (public.kk_current_role() = 'admin')
  WITH CHECK (public.kk_current_role() = 'admin');
