-- Merch catalog in Supabase (admin-managed, customer-readable) with realtime + seed data.

CREATE TABLE IF NOT EXISTS public.kk_merch_categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.kk_merch_products (
  id text PRIMARY KEY,
  category_id text NOT NULL REFERENCES public.kk_merch_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  base_price numeric(12,2) NOT NULL DEFAULT 0,
  image text,
  variants jsonb NOT NULL DEFAULT '[]'::jsonb,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  visible boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kk_merch_products_category_sort
  ON public.kk_merch_products(category_id, sort_order);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'kk_set_updated_at'
      AND pronamespace = 'public'::regnamespace
  ) THEN
    CREATE FUNCTION public.kk_set_updated_at()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $f$
    BEGIN
      NEW.updated_at := now();
      RETURN NEW;
    END;
    $f$;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_kk_merch_categories_updated_at ON public.kk_merch_categories;
CREATE TRIGGER trg_kk_merch_categories_updated_at
BEFORE UPDATE ON public.kk_merch_categories
FOR EACH ROW
EXECUTE FUNCTION public.kk_set_updated_at();

DROP TRIGGER IF EXISTS trg_kk_merch_products_updated_at ON public.kk_merch_products;
CREATE TRIGGER trg_kk_merch_products_updated_at
BEFORE UPDATE ON public.kk_merch_products
FOR EACH ROW
EXECUTE FUNCTION public.kk_set_updated_at();

-- Keep merch order placement compatible with kk_place_order by mirroring merch SKUs into kk_products.
INSERT INTO public.kk_menu_categories (id, branch_id, name, sort_order, visible)
VALUES ('cat_hidden_merch', null, 'Merch (Hidden)', 9999, false)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    visible = EXCLUDED.visible,
    sort_order = EXCLUDED.sort_order;

CREATE OR REPLACE FUNCTION public.kk_sync_merch_product_into_menu()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.kk_products
    WHERE id = OLD.id
      AND coalesce(custom_fields->>'source', '') = 'merch';
    RETURN OLD;
  END IF;

  INSERT INTO public.kk_products (
    id,
    category_id,
    branch_id,
    name,
    description,
    base_price,
    image,
    temperature,
    sizes,
    milks,
    tags,
    custom_fields,
    visible,
    sort_order
  ) VALUES (
    NEW.id,
    'cat_hidden_merch',
    null,
    NEW.name,
    NEW.description,
    NEW.base_price,
    NEW.image,
    'both',
    '[]'::jsonb,
    '[]'::jsonb,
    coalesce(NEW.tags, '[]'::jsonb),
    jsonb_build_object(
      'source', 'merch',
      'variants', coalesce(NEW.variants, '[]'::jsonb)
    ),
    NEW.visible,
    NEW.sort_order
  )
  ON CONFLICT (id) DO UPDATE
  SET category_id = EXCLUDED.category_id,
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      base_price = EXCLUDED.base_price,
      image = EXCLUDED.image,
      tags = EXCLUDED.tags,
      custom_fields = EXCLUDED.custom_fields,
      visible = EXCLUDED.visible,
      sort_order = EXCLUDED.sort_order;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_kk_merch_products_sync_to_menu ON public.kk_merch_products;
CREATE TRIGGER trg_kk_merch_products_sync_to_menu
AFTER INSERT OR UPDATE OR DELETE ON public.kk_merch_products
FOR EACH ROW
EXECUTE FUNCTION public.kk_sync_merch_product_into_menu();

ALTER TABLE public.kk_merch_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kk_merch_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS kk_merch_categories_select_public ON public.kk_merch_categories;
CREATE POLICY kk_merch_categories_select_public
ON public.kk_merch_categories
FOR SELECT
TO anon, authenticated
USING (
  visible = true
  OR public.kk_current_role() IN ('admin', 'barista', 'staff')
);

DROP POLICY IF EXISTS kk_merch_products_select_public ON public.kk_merch_products;
CREATE POLICY kk_merch_products_select_public
ON public.kk_merch_products
FOR SELECT
TO anon, authenticated
USING (
  visible = true
  OR public.kk_current_role() IN ('admin', 'barista', 'staff')
);

DROP POLICY IF EXISTS kk_merch_categories_admin_insert ON public.kk_merch_categories;
CREATE POLICY kk_merch_categories_admin_insert
ON public.kk_merch_categories
FOR INSERT
TO authenticated
WITH CHECK (public.kk_current_role() = 'admin');

DROP POLICY IF EXISTS kk_merch_categories_admin_update ON public.kk_merch_categories;
CREATE POLICY kk_merch_categories_admin_update
ON public.kk_merch_categories
FOR UPDATE
TO authenticated
USING (public.kk_current_role() = 'admin')
WITH CHECK (public.kk_current_role() = 'admin');

DROP POLICY IF EXISTS kk_merch_categories_admin_delete ON public.kk_merch_categories;
CREATE POLICY kk_merch_categories_admin_delete
ON public.kk_merch_categories
FOR DELETE
TO authenticated
USING (public.kk_current_role() = 'admin');

DROP POLICY IF EXISTS kk_merch_products_admin_insert ON public.kk_merch_products;
CREATE POLICY kk_merch_products_admin_insert
ON public.kk_merch_products
FOR INSERT
TO authenticated
WITH CHECK (public.kk_current_role() = 'admin');

DROP POLICY IF EXISTS kk_merch_products_admin_update ON public.kk_merch_products;
CREATE POLICY kk_merch_products_admin_update
ON public.kk_merch_products
FOR UPDATE
TO authenticated
USING (public.kk_current_role() = 'admin')
WITH CHECK (public.kk_current_role() = 'admin');

DROP POLICY IF EXISTS kk_merch_products_admin_delete ON public.kk_merch_products;
CREATE POLICY kk_merch_products_admin_delete
ON public.kk_merch_products
FOR DELETE
TO authenticated
USING (public.kk_current_role() = 'admin');

DO $m$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'kk_merch_categories'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.kk_merch_categories;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'kk_merch_products'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.kk_merch_products;
  END IF;
END $m$;

ALTER TABLE public.kk_merch_categories REPLICA IDENTITY FULL;
ALTER TABLE public.kk_merch_products REPLICA IDENTITY FULL;

INSERT INTO public.kk_merch_categories (id, name, sort_order, visible)
VALUES
  ('mcat_apparel', 'Apparel', 0, true),
  ('mcat_accessories', 'Accessories', 1, true)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    sort_order = EXCLUDED.sort_order,
    visible = EXCLUDED.visible;

INSERT INTO public.kk_merch_products (
  id, category_id, name, description, base_price, image, variants, tags, visible, sort_order
)
VALUES
  (
    'merch_tee_classic',
    'mcat_apparel',
    'Kado Classic Tee',
    'Heavyweight cotton tee with the Kado logo on the chest.',
    650,
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=400&auto=format&fit=crop',
    '[
      {"id":"sv_tee_classic","name":"Size","required":true,"options":[
        {"id":"sv_tee_classic_s","label":"S","priceDelta":0},
        {"id":"sv_tee_classic_m","label":"M","priceDelta":0},
        {"id":"sv_tee_classic_l","label":"L","priceDelta":0},
        {"id":"sv_tee_classic_xl","label":"XL","priceDelta":50}
      ]}
    ]'::jsonb,
    '["bestseller"]'::jsonb,
    true,
    0
  ),
  (
    'merch_tee_kanji',
    'mcat_apparel',
    'Kanji Oversized Tee',
    'Relaxed-fit tee with the full Kado Kohi print on the back.',
    750,
    'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=400&auto=format&fit=crop',
    '[
      {"id":"sv_tee_kanji","name":"Size","required":true,"options":[
        {"id":"sv_tee_kanji_s","label":"S","priceDelta":0},
        {"id":"sv_tee_kanji_m","label":"M","priceDelta":0},
        {"id":"sv_tee_kanji_l","label":"L","priceDelta":0},
        {"id":"sv_tee_kanji_xl","label":"XL","priceDelta":50}
      ]}
    ]'::jsonb,
    '["new"]'::jsonb,
    true,
    1
  ),
  (
    'merch_cap',
    'mcat_apparel',
    'Kado Dad Cap',
    'Washed cotton dad cap with embroidered Kado logo.',
    450,
    'https://images.unsplash.com/photo-1588850561407-ed78c334e67a?q=80&w=400&auto=format&fit=crop',
    '[
      {"id":"sv_cap_color","name":"Color","required":true,"options":[
        {"id":"sv_cap_black","label":"Black","priceDelta":0},
        {"id":"sv_cap_cream","label":"Cream","priceDelta":0},
        {"id":"sv_cap_red","label":"Kado Red","priceDelta":0}
      ]}
    ]'::jsonb,
    '[]'::jsonb,
    true,
    2
  ),
  (
    'merch_mug',
    'mcat_accessories',
    'Ceramic Mug 12oz',
    'Matte-finish ceramic mug with the Kado Kohi wordmark.',
    350,
    'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=400&auto=format&fit=crop',
    '[
      {"id":"sv_mug_color","name":"Color","required":true,"options":[
        {"id":"sv_mug_cream","label":"Cream","priceDelta":0},
        {"id":"sv_mug_black","label":"Matte Black","priceDelta":30}
      ]}
    ]'::jsonb,
    '[]'::jsonb,
    true,
    0
  ),
  (
    'merch_tote',
    'mcat_accessories',
    'Canvas Tote Bag',
    '12oz natural canvas tote with screen-printed Kado artwork.',
    280,
    'https://images.unsplash.com/photo-1597633425046-08f5110420b5?q=80&w=400&auto=format&fit=crop',
    '[]'::jsonb,
    '[]'::jsonb,
    true,
    1
  ),
  (
    'merch_stickers',
    'mcat_accessories',
    'Sticker Pack (6pc)',
    'Die-cut vinyl stickers featuring Kado Kohi characters and motifs.',
    120,
    'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?q=80&w=400&auto=format&fit=crop',
    '[]'::jsonb,
    '[]'::jsonb,
    true,
    2
  )
ON CONFLICT (id) DO UPDATE
SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  base_price = EXCLUDED.base_price,
  image = EXCLUDED.image,
  variants = EXCLUDED.variants,
  tags = EXCLUDED.tags,
  visible = EXCLUDED.visible,
  sort_order = EXCLUDED.sort_order;
