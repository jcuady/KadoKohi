-- Blog cover images (admin upload → HTTPS URL on kk_blog_posts.image_url).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kado-blog-images',
  'kado-blog-images',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "blog_images_public_read" ON storage.objects;
CREATE POLICY "blog_images_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'kado-blog-images');

DROP POLICY IF EXISTS "blog_images_admin_write" ON storage.objects;
CREATE POLICY "blog_images_admin_write"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'kado-blog-images' AND public.kk_current_role() = 'admin')
WITH CHECK (bucket_id = 'kado-blog-images' AND public.kk_current_role() = 'admin');
