-- Keep kukidō cookie catalog durable: ₱100 seeds, preserve uploaded images,
-- do not let ensure_mix_match overwrite collab pricing.

CREATE OR REPLACE FUNCTION public.kk_ensure_mix_match_catalog()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_cookies int;
  v_tagged int;
  v_base text := 'https://idwtlujcdfnnndxmlaco.supabase.co/storage/v1/object/public/kado-menu-images/products/';
BEGIN
  INSERT INTO public.kk_menu_categories (id, branch_id, name, sort_order, visible)
  VALUES ('cat_pastries', null, 'Pastries', 4, true)
  ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order, visible = EXCLUDED.visible, updated_at = now();

  INSERT INTO public.kk_products (
    id, category_id, branch_id, name, description, base_price, image,
    temperature, sizes, milks, tags, custom_fields, visible, sort_order, in_stock
  ) VALUES
    ('cookie_klassic', 'cat_pastries', null, 'Klassic Cookie',
     'Handcrafted kukidō cookie. Build a Kuki Box from 4 pcs, or grab singles for pickup.',
     100, v_base || 'cookie_klassic.webp', 'both', '[]'::jsonb, '[]'::jsonb,
     '["cookie","kukido"]'::jsonb, '[]'::jsonb, true, 10, true),
    ('cookie_campfire', 'cat_pastries', null, 'Campfire',
     'Handcrafted kukidō cookie. Build a Kuki Box from 4 pcs, or grab singles for pickup.',
     100, v_base || 'cookie_campfire.webp', 'both', '[]'::jsonb, '[]'::jsonb,
     '["cookie","kukido"]'::jsonb, '[]'::jsonb, true, 11, true),
    ('cookie_double_dark', 'cat_pastries', null, 'Double Dark',
     'Handcrafted kukidō cookie. Build a Kuki Box from 4 pcs, or grab singles for pickup.',
     100, v_base || 'cookie_double_dark.webp', 'both', '[]'::jsonb, '[]'::jsonb,
     '["cookie","kukido"]'::jsonb, '[]'::jsonb, true, 12, true),
    ('cookie_birthday', 'cat_pastries', null, 'Birthday Bake',
     'Handcrafted kukidō cookie. Build a Kuki Box from 4 pcs, or grab singles for pickup.',
     100, v_base || 'cookie_birthday.webp', 'both', '[]'::jsonb, '[]'::jsonb,
     '["cookie","kukido"]'::jsonb, '[]'::jsonb, true, 13, true),
    ('cookie_blondie', 'cat_pastries', null, 'Blondie',
     'Handcrafted kukidō cookie. Build a Kuki Box from 4 pcs, or grab singles for pickup.',
     100, v_base || 'cookie_blondie.webp', 'both', '[]'::jsonb, '[]'::jsonb,
     '["cookie","kukido"]'::jsonb, '[]'::jsonb, true, 14, true),
    ('cookie_white_walnut', 'cat_pastries', null, 'White Chocolate Walnut',
     'Handcrafted kukidō cookie. Build a Kuki Box from 4 pcs, or grab singles for pickup.',
     100, v_base || 'cookie_white_walnut.webp', 'both', '[]'::jsonb, '[]'::jsonb,
     '["cookie","kukido"]'::jsonb, '[]'::jsonb, true, 15, true),
    ('pastry_kukilatte', 'cat_pastries', null, 'Cookie Latte',
     'Iced Kado Latte with muscovado brûlée and cookie crumble.',
     220, '/mix-match/pastries-poster.jpg', 'iced', '[]'::jsonb, '[]'::jsonb,
     '["featured","featured-drink"]'::jsonb, '[]'::jsonb, false, 0, true)
  ON CONFLICT (id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    base_price = EXCLUDED.base_price,
    -- Preserve admin/storage uploads; only fill blank or legacy mix-match placeholders
    image = CASE
      WHEN coalesce(nullif(trim(public.kk_products.image), ''), '') = '' THEN EXCLUDED.image
      WHEN public.kk_products.image LIKE '/mix-match/%' THEN EXCLUDED.image
      ELSE public.kk_products.image
    END,
    tags = EXCLUDED.tags,
    visible = EXCLUDED.visible,
    sort_order = EXCLUDED.sort_order,
    in_stock = EXCLUDED.in_stock,
    updated_at = now();

  INSERT INTO public.kk_products (
    id, category_id, branch_id, name, description, base_price, image,
    temperature, sizes, milks, tags, custom_fields, visible, sort_order, in_stock
  ) VALUES
    ('kuki_box_4', 'cat_pastries', null, 'Kuki Box - 4 pcs',
     'Build a 4-piece kukidō cookie box. Choose any mix of flavors.',
     400, v_base || 'kuki_box.webp', 'both', '[]'::jsonb, '[]'::jsonb,
     '["kuki-box","kukido","cookie-box"]'::jsonb, '[]'::jsonb, true, 94, true),
    ('kuki_box_5', 'cat_pastries', null, 'Kuki Box - 5 pcs',
     'Build a 5-piece kukidō cookie box. Choose any mix of flavors.',
     500, v_base || 'kuki_box.webp', 'both', '[]'::jsonb, '[]'::jsonb,
     '["kuki-box","kukido","cookie-box"]'::jsonb, '[]'::jsonb, true, 95, true),
    ('kuki_box_6', 'cat_pastries', null, 'Kuki Box - 6 pcs',
     'Build a 6-piece kukidō cookie box. Cookies are ₱90 each in 6-pc and 10-pc boxes.',
     540, v_base || 'kuki_box.webp', 'both', '[]'::jsonb, '[]'::jsonb,
     '["kuki-box","kukido","cookie-box"]'::jsonb, '[]'::jsonb, true, 96, true),
    ('kuki_box_10', 'cat_pastries', null, 'Kuki Box - 10 pcs',
     'Build a 10-piece kukidō cookie box. Cookies are ₱90 each in 6-pc and 10-pc boxes.',
     900, v_base || 'kuki_box.webp', 'both', '[]'::jsonb, '[]'::jsonb,
     '["kuki-box","kukido","cookie-box"]'::jsonb, '[]'::jsonb, true, 100, true),
    ('kuki_pack_single', 'cat_pastries', null, 'Single cookie box (+₱10)',
     'Optional kukidō packaging upgrade.',
     10, v_base || 'kuki_box.webp', 'both', '[]'::jsonb, '[]'::jsonb,
     '["kuki-pack","kukido"]'::jsonb, '[]'::jsonb, true, 200, true),
    ('kuki_pack_big', 'cat_pastries', null, 'Big box packaging (+₱25)',
     'Optional kukidō packaging upgrade.',
     25, v_base || 'kuki_box.webp', 'both', '[]'::jsonb, '[]'::jsonb,
     '["kuki-pack","kukido"]'::jsonb, '[]'::jsonb, true, 201, true)
  ON CONFLICT (id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    base_price = EXCLUDED.base_price,
    image = CASE
      WHEN coalesce(nullif(trim(public.kk_products.image), ''), '') = '' THEN EXCLUDED.image
      WHEN public.kk_products.image LIKE '/mix-match/%' THEN EXCLUDED.image
      ELSE public.kk_products.image
    END,
    tags = EXCLUDED.tags,
    visible = true,
    sort_order = EXCLUDED.sort_order,
    in_stock = true,
    updated_at = now();

  -- Keep mix-match drink tags for legacy bundle pricing (if still used server-side)
  UPDATE public.kk_products p
  SET tags = (
    SELECT coalesce(jsonb_agg(DISTINCT t), '[]'::jsonb)
    FROM (
      SELECT jsonb_array_elements_text(coalesce(p.tags, '[]'::jsonb)) AS t
      UNION ALL
      SELECT 'mix-match'
    ) s
  ),
  updated_at = now()
  WHERE p.id IN (
    'prod_kado_latte', 'prod_ube_shio', 'prod_nori_salted', 'prod_yuzu_amerikado',
    'prod_matcha_oat', 'prod_matcha_straw', 'prod_hojicha_oat'
  );

  SELECT count(*)::int INTO v_cookies
  FROM public.kk_products
  WHERE category_id = 'cat_pastries' AND public.kk_is_mix_match_cookie(kk_products.*);

  SELECT count(*)::int INTO v_tagged
  FROM public.kk_products
  WHERE public.kk_product_has_tag(kk_products.*, 'mix-match')
    AND category_id <> 'cat_pastries';

  RETURN jsonb_build_object('cookies', v_cookies, 'mix_match_drinks', v_tagged);
END;
$function$;
