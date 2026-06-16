-- Homepage custom sections + booth package/addon catalog (admin-published JSON on settings row).

ALTER TABLE public.kk_app_settings
  ADD COLUMN IF NOT EXISTS home_sections jsonb;

ALTER TABLE public.kk_app_settings
  ADD COLUMN IF NOT EXISTS booth_catalog jsonb;
