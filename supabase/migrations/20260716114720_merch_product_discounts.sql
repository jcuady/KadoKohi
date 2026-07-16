-- Per-merch-item sale pricing (mirrors kk_products). Sync copies discounts into
-- the hidden menu mirror so kk_place_order prices merch correctly.

ALTER TABLE public.kk_merch_products
  ADD COLUMN IF NOT EXISTS discount_type text,
  ADD COLUMN IF NOT EXISTS discount_value numeric;

ALTER TABLE public.kk_merch_products
  DROP CONSTRAINT IF EXISTS kk_merch_products_discount_check;

ALTER TABLE public.kk_merch_products
  ADD CONSTRAINT kk_merch_products_discount_check CHECK (
    (
      discount_type IS NULL
      AND (discount_value IS NULL OR discount_value = 0)
    )
    OR (
      discount_type = 'percent'
      AND discount_value IS NOT NULL
      AND discount_value > 0
      AND discount_value < 100
    )
    OR (
      discount_type = 'fixed'
      AND discount_value IS NOT NULL
      AND discount_value > 0
      AND discount_value < base_price
    )
  );

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
    discount_type,
    discount_value,
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
    NEW.discount_type,
    NEW.discount_value,
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
      discount_type = EXCLUDED.discount_type,
      discount_value = EXCLUDED.discount_value,
      image = EXCLUDED.image,
      tags = EXCLUDED.tags,
      custom_fields = EXCLUDED.custom_fields,
      visible = EXCLUDED.visible,
      sort_order = EXCLUDED.sort_order;

  RETURN NEW;
END;
$$;

-- Re-sync existing merch rows so mirrored kk_products pick up null discount columns.
UPDATE public.kk_merch_products
SET updated_at = now();
