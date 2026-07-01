-- Pastries page CMS copy (hero, poster images, CTA) — admin-published JSONB.

ALTER TABLE kk_app_settings
  ADD COLUMN IF NOT EXISTS pastries_content jsonb;
