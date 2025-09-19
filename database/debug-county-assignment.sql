-- Debug County Assignment Issues
-- This script helps diagnose why counties aren't being assigned

-- 1. Check if county column exists in profiles table
SELECT 
    'Checking profiles table structure' as step,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('county', 'school_id', 'first_name', 'username')
ORDER BY column_name;

-- 2. Check if select_count column exists in schools table
SELECT 
    'Checking schools table structure' as step,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'schools' 
AND column_name IN ('school_id', 'school_name', 'county', 'select_count')
ORDER BY column_name;

-- 3. Check all profiles and their data
SELECT 
    'All profiles data' as step,
    p.id,
    p.first_name,
    p.username,
    p.school_id,
    p.county,
    CASE 
        WHEN p.county IS NULL THEN 'NULL'
        ELSE p.county
    END as county_status
FROM profiles p
ORDER BY p.id;

-- 4. Check all schools and their data
SELECT 
    'All schools data' as step,
    s.school_id,
    s.school_name,
    s.county,
    s.select_count
FROM schools s
ORDER BY s.school_name
LIMIT 10;

-- 5. Check for matching school_id between profiles and schools
SELECT 
    'Profile-School matching' as step,
    p.id as profile_id,
    p.first_name,
    p.username,
    p.school_id as profile_school_id,
    s.school_id as school_table_id,
    s.school_name,
    s.county as school_county,
    CASE 
        WHEN p.school_id = s.school_id THEN 'MATCH'
        ELSE 'NO MATCH'
    END as match_status
FROM profiles p
LEFT JOIN schools s ON p.school_id = s.school_id
ORDER BY p.id;

-- 6. Try to manually assign a county to see if it works
UPDATE profiles 
SET county = 'Test County'
WHERE id = (SELECT id FROM profiles LIMIT 1);

-- 7. Check if the manual update worked
SELECT 
    'Manual update test' as step,
    p.id,
    p.first_name,
    p.username,
    p.county
FROM profiles p
WHERE p.county = 'Test County';

-- 8. Reset the test county
UPDATE profiles 
SET county = NULL
WHERE county = 'Test County';
