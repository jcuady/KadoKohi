-- GCash shop QR: public storage bucket + ensure singleton settings row exists.

INSERT INTO public.kk_app_settings (id, tax_rate, gcash_qr_image, order_hours)
VALUES (true, 0, null, '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kado-gcash-qr',
  'kado-gcash-qr',
  true,
  2097152,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "gcash_qr_public_read" ON storage.objects;
CREATE POLICY "gcash_qr_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'kado-gcash-qr');

DROP POLICY IF EXISTS "gcash_qr_admin_write" ON storage.objects;
CREATE POLICY "gcash_qr_admin_write"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'kado-gcash-qr' AND public.kk_current_role() = 'admin')
WITH CHECK (bucket_id = 'kado-gcash-qr' AND public.kk_current_role() = 'admin');
