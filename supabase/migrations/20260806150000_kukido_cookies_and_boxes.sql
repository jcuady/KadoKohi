-- Kukidō collab: cookie photos @ ₱100, Kuki Box SKUs, hide Cookie Latte from pastry grid.
-- Images live in public storage bucket kado-menu-images (uploaded via scripts/upload_kukido_cookies.py).

DO $$
DECLARE
  v_cat text;
  v_base text := 'https://idwtlujcdfnnndxmlaco.supabase.co/storage/v1/object/public/kado-menu-images/products/';
BEGIN
  SELECT id INTO v_cat
  FROM public.kk_menu_categories
  WHERE id = 'cat_pastries'
  LIMIT 1;

  IF v_cat IS NULL THEN
    SELECT id INTO v_cat
    FROM public.kk_menu_categories
    WHERE lower(trim(name)) = 'pastries'
    ORDER BY sort_order NULLS LAST, id
    LIMIT 1;
  END IF;

  IF v_cat IS NULL THEN
    RAISE EXCEPTION 'Pastries category missing';
  END IF;

  UPDATE public.kk_products SET
    category_id = v_cat,
    base_price = 100,
    image = v_base || id || '.webp',
    description = 'Handcrafted kukidō cookie. Build a Kuki Box from 4 pcs, or grab singles for pickup.',
    tags = '["cookie","kukido"]'::jsonb,
    visible = true,
    in_stock = true
  WHERE id IN (
    'cookie_klassic',
    'cookie_campfire',
    'cookie_double_dark',
    'cookie_birthday',
    'cookie_blondie',
    'cookie_white_walnut'
  );

  UPDATE public.kk_products SET name = 'Klassic Cookie' WHERE id = 'cookie_klassic';
  UPDATE public.kk_products SET name = 'Campfire' WHERE id = 'cookie_campfire';
  UPDATE public.kk_products SET name = 'Double Dark' WHERE id = 'cookie_double_dark';
  UPDATE public.kk_products SET name = 'Birthday Bake' WHERE id = 'cookie_birthday';
  UPDATE public.kk_products SET name = 'Blondie' WHERE id = 'cookie_blondie';
  UPDATE public.kk_products SET name = 'White Chocolate Walnut' WHERE id = 'cookie_white_walnut';

  UPDATE public.kk_products
  SET visible = false
  WHERE id = 'pastry_kukilatte';

  INSERT INTO public.kk_products (
    id, category_id, name, description, base_price, image, temperature,
    sizes, milks, tags, custom_fields, visible, in_stock, sort_order
  ) VALUES
    (
      'kuki_box_4', v_cat, 'Kuki Box - 4 pcs',
      'Build a 4-piece kukidō cookie box. Choose any mix of flavors.',
      400, v_base || 'kuki_box.webp', 'both',
      '[]'::jsonb, '[]'::jsonb, '["kuki-box","kukido","cookie-box"]'::jsonb, '[]'::jsonb,
      true, true, 94
    ),
    (
      'kuki_box_5', v_cat, 'Kuki Box - 5 pcs',
      'Build a 5-piece kukidō cookie box. Choose any mix of flavors.',
      500, v_base || 'kuki_box.webp', 'both',
      '[]'::jsonb, '[]'::jsonb, '["kuki-box","kukido","cookie-box"]'::jsonb, '[]'::jsonb,
      true, true, 95
    ),
    (
      'kuki_box_6', v_cat, 'Kuki Box - 6 pcs',
      'Build a 6-piece kukidō cookie box. Cookies are ₱90 each in 6-pc and 10-pc boxes.',
      540, v_base || 'kuki_box.webp', 'both',
      '[]'::jsonb, '[]'::jsonb, '["kuki-box","kukido","cookie-box"]'::jsonb, '[]'::jsonb,
      true, true, 96
    ),
    (
      'kuki_box_10', v_cat, 'Kuki Box - 10 pcs',
      'Build a 10-piece kukidō cookie box. Cookies are ₱90 each in 6-pc and 10-pc boxes.',
      900, v_base || 'kuki_box.webp', 'both',
      '[]'::jsonb, '[]'::jsonb, '["kuki-box","kukido","cookie-box"]'::jsonb, '[]'::jsonb,
      true, true, 100
    ),
    (
      'kuki_pack_single', v_cat, 'Single cookie box (+₱10)',
      'Optional kukidō packaging upgrade.',
      10, v_base || 'kuki_box.webp', 'both',
      '[]'::jsonb, '[]'::jsonb, '["kuki-pack","kukido"]'::jsonb, '[]'::jsonb,
      true, true, 200
    ),
    (
      'kuki_pack_big', v_cat, 'Big box packaging (+₱25)',
      'Optional kukidō packaging upgrade.',
      25, v_base || 'kuki_box.webp', 'both',
      '[]'::jsonb, '[]'::jsonb, '["kuki-pack","kukido"]'::jsonb, '[]'::jsonb,
      true, true, 201
    )
  ON CONFLICT (id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    base_price = EXCLUDED.base_price,
    image = COALESCE(EXCLUDED.image, public.kk_products.image),
    tags = EXCLUDED.tags,
    visible = true,
    in_stock = true,
    sort_order = EXCLUDED.sort_order;
END $$;
