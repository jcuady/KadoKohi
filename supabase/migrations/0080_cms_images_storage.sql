-- CMS images (landing, events, booth, pastries admin uploads → HTTPS URLs in JSONB).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kado-cms-images',
  'kado-cms-images',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "cms_images_public_read" ON storage.objects;
CREATE POLICY "cms_images_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'kado-cms-images');

DROP POLICY IF EXISTS "cms_images_admin_write" ON storage.objects;
CREATE POLICY "cms_images_admin_write"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'kado-cms-images' AND public.kk_current_role() = 'admin')
WITH CHECK (bucket_id = 'kado-cms-images' AND public.kk_current_role() = 'admin');
