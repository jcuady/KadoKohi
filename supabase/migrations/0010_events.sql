-- Kado Booth events in Supabase (admin-managed, publicly readable) with realtime + seed.

CREATE TABLE IF NOT EXISTS public.kk_events (
  id text PRIMARY KEY,
  branch_id text,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  cover text,
  cta jsonb,
  visible boolean NOT NULL DEFAULT true,
  highlight boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kk_events_starts_at ON public.kk_events(starts_at);

DROP TRIGGER IF EXISTS trg_kk_events_updated_at ON public.kk_events;
CREATE TRIGGER trg_kk_events_updated_at
BEFORE UPDATE ON public.kk_events
FOR EACH ROW
EXECUTE FUNCTION public.kk_set_updated_at();

ALTER TABLE public.kk_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS kk_events_select_public ON public.kk_events;
CREATE POLICY kk_events_select_public
ON public.kk_events
FOR SELECT
TO anon, authenticated
USING (
  visible = true
  OR public.kk_current_role() IN ('admin', 'barista', 'staff')
);

DROP POLICY IF EXISTS kk_events_admin_insert ON public.kk_events;
CREATE POLICY kk_events_admin_insert
ON public.kk_events
FOR INSERT
TO authenticated
WITH CHECK (public.kk_current_role() = 'admin');

DROP POLICY IF EXISTS kk_events_admin_update ON public.kk_events;
CREATE POLICY kk_events_admin_update
ON public.kk_events
FOR UPDATE
TO authenticated
USING (public.kk_current_role() = 'admin')
WITH CHECK (public.kk_current_role() = 'admin');

DROP POLICY IF EXISTS kk_events_admin_delete ON public.kk_events;
CREATE POLICY kk_events_admin_delete
ON public.kk_events
FOR DELETE
TO authenticated
USING (public.kk_current_role() = 'admin');

DO $m$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'kk_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.kk_events;
  END IF;
END $m$;

ALTER TABLE public.kk_events REPLICA IDENTITY FULL;

INSERT INTO public.kk_events (id, branch_id, title, description, starts_at, ends_at, cover, cta, visible, highlight, sort_order)
VALUES
  (
    'evt_latte_art',
    'branch_marikina',
    'Latte Art Throwdown',
    'Watch local baristas compete in our monthly latte art showdown. Free tasting for attendees!',
    '2026-05-15T14:00:00+08:00',
    '2026-05-15T17:00:00+08:00',
    'https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80&w=1200&auto=format&fit=crop',
    '{"label":"RSVP Now","href":"/contact"}'::jsonb,
    true,
    true,
    0
  ),
  (
    'evt_cupping',
    'branch_marikina',
    'Coffee Cupping Session',
    'Learn how we taste and evaluate beans from our roaster partners. Limited to 12 seats.',
    '2026-05-22T10:00:00+08:00',
    '2026-05-22T12:00:00+08:00',
    'https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=1200&auto=format&fit=crop',
    NULL,
    true,
    false,
    1
  ),
  (
    'evt_greenhills_opening',
    'branch_greenhills',
    'Greenhills Grand Opening',
    'Be among the first to visit our new Greenhills Mall branch. Free drink for the first 100 guests!',
    '2026-06-01T09:00:00+08:00',
    NULL,
    'https://images.unsplash.com/photo-1453614512568-c4024d13c247?q=80&w=1200&auto=format&fit=crop',
    '{"label":"Get Notified","href":"/contact"}'::jsonb,
    true,
    false,
    2
  )
ON CONFLICT (id) DO NOTHING;
