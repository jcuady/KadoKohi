-- Career application review status (admin workflow).
-- Additive only: default 'new'; existing rows backfilled; no data deleted.

ALTER TABLE public.kk_career_applications
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new';

ALTER TABLE public.kk_career_applications
  DROP CONSTRAINT IF EXISTS kk_career_applications_status_check;

ALTER TABLE public.kk_career_applications
  ADD CONSTRAINT kk_career_applications_status_check
  CHECK (status IN ('new', 'reviewing', 'interview', 'hired', 'rejected'));

CREATE INDEX IF NOT EXISTS idx_kk_career_applications_status
  ON public.kk_career_applications (status);

DROP POLICY IF EXISTS kk_career_applications_admin_update ON public.kk_career_applications;
CREATE POLICY kk_career_applications_admin_update
  ON public.kk_career_applications FOR UPDATE TO authenticated
  USING (public.kk_current_role() = 'admin')
  WITH CHECK (public.kk_current_role() = 'admin');

NOTIFY pgrst, 'reload schema';
