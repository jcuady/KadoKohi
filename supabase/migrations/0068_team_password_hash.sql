-- Server-verified team passwords (internal portal — no Clerk Client Trust codes).

ALTER TABLE public.kk_profiles
  ADD COLUMN IF NOT EXISTS team_password_hash text;

COMMENT ON COLUMN public.kk_profiles.team_password_hash IS
  'bcrypt hash for admin/barista/staff portal login; null for customers.';

NOTIFY pgrst, 'reload schema';
