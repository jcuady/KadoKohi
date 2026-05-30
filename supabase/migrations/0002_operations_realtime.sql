-- Realtime for admin / barista operational dashboards.
-- kk_orders is already in supabase_realtime; add the rest safely.

DO $m$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'kk_profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.kk_profiles;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'kk_menu_categories'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.kk_menu_categories;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'kk_products'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.kk_products;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'kk_tables'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.kk_tables;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'kk_branches'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.kk_branches;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'kk_app_settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.kk_app_settings;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'kk_audit_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.kk_audit_logs;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'kk_promo_codes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.kk_promo_codes;
  END IF;
END $m$;

-- Full row images help Realtime deliver UPDATE/DELETE events under RLS.
ALTER TABLE public.kk_orders REPLICA IDENTITY FULL;
ALTER TABLE public.kk_profiles REPLICA IDENTITY FULL;
ALTER TABLE public.kk_menu_categories REPLICA IDENTITY FULL;
ALTER TABLE public.kk_products REPLICA IDENTITY FULL;
ALTER TABLE public.kk_tables REPLICA IDENTITY FULL;
ALTER TABLE public.kk_branches REPLICA IDENTITY FULL;
ALTER TABLE public.kk_app_settings REPLICA IDENTITY FULL;
ALTER TABLE public.kk_audit_logs REPLICA IDENTITY FULL;
ALTER TABLE public.kk_promo_codes REPLICA IDENTITY FULL;
