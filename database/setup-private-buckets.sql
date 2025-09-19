-- =============================================
-- SETUP PRIVATE BUCKETS WITH SIGNED URLS
-- =============================================

-- 1. Make user-photos bucket private
UPDATE storage.buckets
SET public = false
WHERE id = 'user-photos';

-- 2. Make user-pfps bucket private (if it exists)
UPDATE storage.buckets
SET public = false
WHERE id = 'user-pfps';

-- 3. Delete existing policies for user-photos
DROP POLICY IF EXISTS "user-photos-upload-policy" ON storage.objects;
DROP POLICY IF EXISTS "user-photos-read-policy" ON storage.objects;
DROP POLICY IF EXISTS "user-photos-delete-policy" ON storage.objects;
DROP POLICY IF EXISTS "user-photos-public-read-policy" ON storage.objects;

-- 4. Create new policies for user-photos (private bucket)
CREATE POLICY "user-photos-upload-policy" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'user-photos'
    AND (storage.foldername(name))[1] = (SELECT username FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "user-photos-read-policy" ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'user-photos'
    AND (storage.foldername(name))[1] = (SELECT username FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "user-photos-delete-policy" ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'user-photos'
    AND (storage.foldername(name))[1] = (SELECT username FROM public.profiles WHERE id = auth.uid())
);

-- 5. Delete existing policies for user-pfps
DROP POLICY IF EXISTS "user-pfps-upload-policy" ON storage.objects;
DROP POLICY IF EXISTS "user-pfps-read-policy" ON storage.objects;
DROP POLICY IF EXISTS "user-pfps-delete-policy" ON storage.objects;

-- 6. Create new policies for user-pfps (private bucket)
CREATE POLICY "user-pfps-upload-policy" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'user-pfps'
    AND (storage.foldername(name))[1] = (SELECT username FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "user-pfps-read-policy" ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'user-pfps'
    AND (storage.foldername(name))[1] = (SELECT username FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "user-pfps-delete-policy" ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'user-pfps'
    AND (storage.foldername(name))[1] = (SELECT username FROM public.profiles WHERE id = auth.uid())
);

-- 7. Verify bucket settings
SELECT id, name, public, created_at 
FROM storage.buckets 
WHERE id IN ('user-photos', 'user-pfps')
ORDER BY id;

-- 8. Verify policies
SELECT 
    policyname,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND (policyname LIKE 'user-photos%' OR policyname LIKE 'user-pfps%')
ORDER BY policyname;
