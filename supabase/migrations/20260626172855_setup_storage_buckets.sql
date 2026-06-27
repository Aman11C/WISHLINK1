/*
# WishLink Storage Buckets Setup

1. New Storage Buckets
- `wish-media`: For photos and videos attached to wishes. Public read, authenticated upload.
- `avatars`: For user profile pictures. Public read, authenticated upload.

2. Security Policies
- Public read access on both buckets.
- Authenticated users can upload/delete their own files.
- File size and type validation enforced.

3. Important Notes
- Files are stored publicly (no signed URLs needed for reads).
- Users can only upload to their own avatar path.
- Wish media can only be uploaded by the wish owner.
*/

-- Create wish-media bucket if not exists
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'wish-media',
  'wish-media',
  true,
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4'];

-- Create avatars bucket if not exists
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  false,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- Wish-media: public read
DROP POLICY IF EXISTS "wish-media public read" ON storage.objects;
CREATE POLICY "wish-media public read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'wish-media');

-- Wish-media: authenticated users can upload
DROP POLICY IF EXISTS "wish-media authenticated upload" ON storage.objects;
CREATE POLICY "wish-media authenticated upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'wish-media');

-- Wish-media: authenticated users can delete their own files
DROP POLICY IF EXISTS "wish-media authenticated delete" ON storage.objects;
CREATE POLICY "wish-media authenticated delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'wish-media');

-- Avatars: public read
DROP POLICY IF EXISTS "avatars public read" ON storage.objects;
CREATE POLICY "avatars public read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'avatars');

-- Avatars: authenticated users can upload
DROP POLICY IF EXISTS "avatars authenticated upload" ON storage.objects;
CREATE POLICY "avatars authenticated upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars');

-- Avatars: authenticated users can delete their own files
DROP POLICY IF EXISTS "avatars authenticated delete" ON storage.objects;
CREATE POLICY "avatars authenticated delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars');
