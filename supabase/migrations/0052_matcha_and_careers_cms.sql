-- Matcha bar booking page CMS + careers page CMS (admin-published JSON on settings row).

ALTER TABLE public.kk_app_settings
  ADD COLUMN IF NOT EXISTS matcha_content jsonb;

ALTER TABLE public.kk_app_settings
  ADD COLUMN IF NOT EXISTS careers_content jsonb;
