-- Idempotent reconcile: all active Kado Kohi storage buckets + public/admin RLS.
-- Payment-proof guest/owner policies stay in 0027/0029/0059 (not duplicated here).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'kado-menu-images',
    'kado-menu-images',
    true,
    5242880,
    ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/heic', 'image/heif']
  ),
  (
    'kado-gcash-qr',
    'kado-gcash-qr',
    true,
    2097152,
    ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/heic', 'image/heif']
  ),
  (
    'kado-blog-images',
    'kado-blog-images',
    true,
    5242880,
    ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/heic', 'image/heif']
  ),
  (
    'kado-cms-images',
    'kado-cms-images',
    true,
    5242880,
    ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/heic', 'image/heif']
  ),
  (
    'kado-payment-proofs',
    'kado-payment-proofs',
    false,
    5242880,
    ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/heic', 'image/heif']
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "menu_images_public_read" ON storage.objects;
CREATE POLICY "menu_images_public_read"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'kado-menu-images');

DROP POLICY IF EXISTS "menu_images_admin_write" ON storage.objects;
CREATE POLICY "menu_images_admin_write"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'kado-menu-images' AND public.kk_current_role() = 'admin')
WITH CHECK (bucket_id = 'kado-menu-images' AND public.kk_current_role() = 'admin');

DROP POLICY IF EXISTS "gcash_qr_public_read" ON storage.objects;
CREATE POLICY "gcash_qr_public_read"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'kado-gcash-qr');

DROP POLICY IF EXISTS "gcash_qr_admin_write" ON storage.objects;
CREATE POLICY "gcash_qr_admin_write"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'kado-gcash-qr' AND public.kk_current_role() = 'admin')
WITH CHECK (bucket_id = 'kado-gcash-qr' AND public.kk_current_role() = 'admin');

DROP POLICY IF EXISTS "blog_images_public_read" ON storage.objects;
CREATE POLICY "blog_images_public_read"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'kado-blog-images');

DROP POLICY IF EXISTS "blog_images_admin_write" ON storage.objects;
CREATE POLICY "blog_images_admin_write"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'kado-blog-images' AND public.kk_current_role() = 'admin')
WITH CHECK (bucket_id = 'kado-blog-images' AND public.kk_current_role() = 'admin');

DROP POLICY IF EXISTS "cms_images_public_read" ON storage.objects;
CREATE POLICY "cms_images_public_read"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'kado-cms-images');

DROP POLICY IF EXISTS "cms_images_admin_write" ON storage.objects;
CREATE POLICY "cms_images_admin_write"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'kado-cms-images' AND public.kk_current_role() = 'admin')
WITH CHECK (bucket_id = 'kado-cms-images' AND public.kk_current_role() = 'admin');
