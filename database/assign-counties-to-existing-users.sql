-- Quick Migration: Assign Counties to Existing Users
-- This script updates existing users with counties based on their school selections

-- First, let's see what we're working with
SELECT 
    'Current profiles' as info,
    p.id,
    p.first_name,
    p.username,
    p.school_id,
    p.county,
    s.school_name,
    s.county as school_county
FROM profiles p
LEFT JOIN schools s ON p.school_id = s.school_id
ORDER BY p.id;

-- Update existing profiles with county data based on their school_id
UPDATE profiles 
SET county = (
    SELECT county 
    FROM schools 
    WHERE schools.school_id = profiles.school_id
)
WHERE profiles.school_id IS NOT NULL 
AND profiles.county IS NULL;

-- Show how many rows were affected
SELECT 
    'Update completed' as status,
    COUNT(*) as users_with_county
FROM profiles 
WHERE county IS NOT NULL;

-- Show the final results
SELECT 
    'Final results' as info,
    p.id,
    p.first_name,
    p.username,
    s.school_name,
    p.county
FROM profiles p
LEFT JOIN schools s ON p.school_id = s.school_id
WHERE p.county IS NOT NULL
ORDER BY p.county, s.school_name;
