-- Clerk users are not in auth.users. Drop legacy FK so kk_ensure_my_profile can INSERT gen_random_uuid() ids.

ALTER TABLE public.kk_profiles
  DROP CONSTRAINT IF EXISTS kk_profiles_id_fkey;

COMMENT ON COLUMN public.kk_profiles.id IS
  'Internal profile UUID (FK target for orders etc.). Clerk identity is kk_profiles.clerk_user_id.';

NOTIFY pgrst, 'reload schema';
