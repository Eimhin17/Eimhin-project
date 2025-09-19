-- Fix Orphaned School IDs
-- This script fixes profiles that reference non-existent schools

-- First, let's see what's happening
SELECT 
    'Orphaned school IDs in profiles' as info,
    p.id,
    p.first_name,
    p.username,
    p.school_id,
    s.school_id as school_exists,
    s.school_name
FROM profiles p
LEFT JOIN schools s ON p.school_id = s.school_id
WHERE p.school_id IS NOT NULL 
AND s.school_id IS NULL;

-- Check if the specific school_id exists in schools table
SELECT 
    'Checking specific school_id' as info,
    school_id,
    school_name,
    county
FROM schools 
WHERE school_id = '27082f53-70cc-4bce-8612-3b602a9c9227';

-- Check all school_ids in profiles table
SELECT 
    'All school_ids in profiles' as info,
    p.school_id,
    COUNT(*) as profile_count,
    s.school_name,
    CASE 
        WHEN s.school_id IS NULL THEN 'MISSING FROM SCHOOLS TABLE'
        ELSE 'EXISTS IN SCHOOLS TABLE'
    END as status
FROM profiles p
LEFT JOIN schools s ON p.school_id = s.school_id
WHERE p.school_id IS NOT NULL
GROUP BY p.school_id, s.school_name, s.school_id
ORDER BY status, p.school_id;

-- Option 1: Set orphaned school_ids to NULL (safest option)
UPDATE profiles 
SET school_id = NULL
WHERE school_id IS NOT NULL 
AND school_id NOT IN (SELECT school_id FROM schools);

-- Show how many profiles were affected
SELECT 
    'Profiles with school_id set to NULL' as info,
    COUNT(*) as affected_profiles
FROM profiles 
WHERE school_id IS NULL;

-- Verify no more orphaned references
SELECT 
    'Verification - orphaned references' as info,
    COUNT(*) as orphaned_count
FROM profiles p
LEFT JOIN schools s ON p.school_id = s.school_id
WHERE p.school_id IS NOT NULL 
AND s.school_id IS NULL;

-- Show final state
SELECT 
    'Final profiles state' as info,
    p.id,
    p.first_name,
    p.username,
    p.school_id,
    s.school_name,
    s.county
FROM profiles p
LEFT JOIN schools s ON p.school_id = s.school_id
ORDER BY p.id;
