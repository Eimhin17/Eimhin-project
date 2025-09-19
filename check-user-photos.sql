-- Check user-photos bucket status
SELECT id, name, public, created_at 
FROM storage.buckets 
WHERE id = 'user-photos';

-- Check user-photos RLS policies
SELECT 
    policyname,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE 'user-photos%'
ORDER BY policyname;
