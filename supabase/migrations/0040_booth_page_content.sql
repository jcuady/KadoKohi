-- Booth booking page CMS: hero copy + showcase gallery (admin-published JSON on settings row).

ALTER TABLE public.kk_app_settings
  ADD COLUMN IF NOT EXISTS booth_content jsonb;
