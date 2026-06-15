-- Blog posts (admin-managed CMS, publicly readable when visible).

CREATE TABLE IF NOT EXISTS public.kk_blog_posts (
  id text PRIMARY KEY,
  slug text NOT NULL,
  title text NOT NULL,
  excerpt text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  published_at timestamptz NOT NULL DEFAULT now(),
  read_minutes int NOT NULL DEFAULT 3,
  image_url text,
  image_alt text NOT NULL DEFAULT '',
  body jsonb NOT NULL DEFAULT '[]'::jsonb,
  visible boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT kk_blog_posts_slug_unique UNIQUE (slug)
);

CREATE INDEX IF NOT EXISTS idx_kk_blog_posts_published_at ON public.kk_blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_kk_blog_posts_visible ON public.kk_blog_posts(visible);

DROP TRIGGER IF EXISTS trg_kk_blog_posts_updated_at ON public.kk_blog_posts;
CREATE TRIGGER trg_kk_blog_posts_updated_at
BEFORE UPDATE ON public.kk_blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.kk_set_updated_at();

ALTER TABLE public.kk_blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS kk_blog_posts_select_public ON public.kk_blog_posts;
CREATE POLICY kk_blog_posts_select_public
ON public.kk_blog_posts
FOR SELECT
TO anon, authenticated
USING (
  visible = true
  OR public.kk_current_role() IN ('admin', 'barista', 'staff')
);

DROP POLICY IF EXISTS kk_blog_posts_admin_insert ON public.kk_blog_posts;
CREATE POLICY kk_blog_posts_admin_insert
ON public.kk_blog_posts
FOR INSERT
TO authenticated
WITH CHECK (public.kk_current_role() = 'admin');

DROP POLICY IF EXISTS kk_blog_posts_admin_update ON public.kk_blog_posts;
CREATE POLICY kk_blog_posts_admin_update
ON public.kk_blog_posts
FOR UPDATE
TO authenticated
USING (public.kk_current_role() = 'admin')
WITH CHECK (public.kk_current_role() = 'admin');

DROP POLICY IF EXISTS kk_blog_posts_admin_delete ON public.kk_blog_posts;
CREATE POLICY kk_blog_posts_admin_delete
ON public.kk_blog_posts
FOR DELETE
TO authenticated
USING (public.kk_current_role() = 'admin');

DO $m$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'kk_blog_posts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.kk_blog_posts;
  END IF;
END $m$;

ALTER TABLE public.kk_blog_posts REPLICA IDENTITY FULL;

INSERT INTO public.kk_blog_posts (
  id, slug, title, excerpt, category, published_at, read_minutes, image_url, image_alt, body, visible, sort_order
)
VALUES
  (
    'blog_kado_run',
    'kado-run-community-morning',
    'Kado Run: Coffee, Community & Marikina Mornings',
    'Our first community run brought neighbors, regulars, and new friends together — espresso after the finish line included.',
    'Community',
    '2026-03-15T00:00:00+08:00',
    4,
    '/images/hero-interior.png',
    'Kado Kohi cafe interior after a community morning event',
    '["Kado Run started as a simple idea: move together, then recover together over matcha and espresso at the corner.","Runners gathered at Sta. Elena before sunrise. We kept the route neighborhood-friendly — flat stretches along familiar Marikina streets so first-timers felt welcome.","At the cafe, baristas poured KADO Latte and Matcha Oat Latte while the team shared pastries from the day''s bake. The energy felt like our tambayan at its best: warm, unhurried, and full of conversation.","More community mornings are coming. Follow @kadocoffeeph for the next Kado Run date and sign-up details."]'::jsonb,
    true,
    0
  ),
  (
    'blog_tambayan',
    'tambayan-nights-at-the-corner',
    'Tambayan Nights at the Corner',
    'Slow evenings, vinyl-adjacent playlists, and the kind of conversations that only happen when the cups stay full.',
    'Events',
    '2026-02-28T00:00:00+08:00',
    3,
    '/images/hero-coffee.png',
    'Specialty coffee prepared at Kado Kohi',
    '["Tambayan nights are our love letter to the neighborhood — no stage, no pressure, just good coffee and people who stay a little longer.","We rotate small activations: latte art throwdowns, guest baristas, and seasonal drink previews for the Kado Circle.","If you have an idea for a community night, reach out through our contact page or say hi in-store on J.P. Laurel."]'::jsonb,
    true,
    1
  ),
  (
    'blog_booth',
    'mobile-booth-season-guide',
    'Booking the Kado Mobile Booth This Season',
    'Weddings, birthdays, and corporate gatherings — what to expect when Kado Kohi rolls up to your event.',
    'Booth',
    '2026-01-10T00:00:00+08:00',
    5,
    '/booth-photos/booth-1.jpg',
    'Kado Kohi mobile coffee booth setup at an outdoor event',
    '["Our mobile booth brings the same quality bar as the cafe — curated menu, branded cups, and a team that knows how to keep lines moving without losing warmth.","Start with the booth booking form so we can estimate guest count, power access, and setup window. We''ll follow up with a quote and menu options.","Peak season fills quickly. Book early for weekends and holiday dates in Metro Manila and Marikina."]'::jsonb,
    true,
    2
  )
ON CONFLICT (id) DO NOTHING;
