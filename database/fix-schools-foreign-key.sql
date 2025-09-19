-- Fix Schools Foreign Key Relationship
-- This script creates the missing foreign key relationship between profiles and schools

-- First, let's check the current state
SELECT 
    'Current profiles table structure' as info,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('school_id', 'id')
ORDER BY column_name;

-- Check schools table structure
SELECT 
    'Current schools table structure' as info,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'schools' 
AND column_name IN ('school_id', 'id')
ORDER BY column_name;

-- Check existing foreign key constraints
SELECT 
    'Existing foreign key constraints' as info,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND (tc.table_name = 'profiles' OR tc.table_name = 'schools')
ORDER BY tc.table_name, tc.constraint_name;

-- Drop existing foreign key constraint if it exists (with wrong name)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_school_id_fkey;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS fk_profiles_school_id;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_school_id_fk;

-- Create the correct foreign key constraint
-- First, make sure the school_id column exists in profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS school_id UUID;

-- Create the foreign key constraint
ALTER TABLE profiles 
ADD CONSTRAINT profiles_school_id_fkey 
FOREIGN KEY (school_id) 
REFERENCES schools(school_id) 
ON DELETE SET NULL;

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_school_id ON profiles(school_id);

-- Verify the foreign key was created
SELECT 
    'Foreign key created successfully' as status,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'profiles'
AND tc.constraint_name = 'profiles_school_id_fkey';

-- Test the relationship by checking if we can join the tables
SELECT 
    'Testing relationship' as info,
    COUNT(*) as profiles_count,
    COUNT(s.school_id) as profiles_with_schools
FROM profiles p
LEFT JOIN schools s ON p.school_id = s.school_id;
