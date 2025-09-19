-- Comprehensive Foreign Key Fix
-- This script ensures the foreign key relationship is properly established

-- Step 1: Check current state
SELECT 
    'Current profiles table columns' as info,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('school_id', 'id')
ORDER BY column_name;

-- Step 2: Check schools table structure
SELECT 
    'Current schools table columns' as info,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'schools' 
AND column_name IN ('school_id', 'id')
ORDER BY column_name;

-- Step 3: Check existing constraints
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
AND tc.table_name = 'profiles'
ORDER BY tc.constraint_name;

-- Step 4: Drop ALL existing foreign key constraints on profiles.school_id
DO $$ 
DECLARE
    constraint_name text;
BEGIN
    -- Get all foreign key constraints on profiles.school_id
    FOR constraint_name IN 
        SELECT tc.constraint_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'profiles'
        AND kcu.column_name = 'school_id'
    LOOP
        EXECUTE 'ALTER TABLE profiles DROP CONSTRAINT IF EXISTS ' || constraint_name;
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END LOOP;
END $$;

-- Step 5: Ensure school_id column exists in profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS school_id UUID;

-- Step 6: Create the foreign key constraint with the exact name the code expects
ALTER TABLE profiles 
ADD CONSTRAINT profiles_school_id_fkey 
FOREIGN KEY (school_id) 
REFERENCES schools(school_id) 
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Step 7: Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_school_id ON profiles(school_id);

-- Step 8: Verify the constraint was created
SELECT 
    'Foreign key constraint verification' as info,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule,
    rc.update_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
    AND tc.table_schema = rc.constraint_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'profiles'
AND tc.constraint_name = 'profiles_school_id_fkey';

-- Step 9: Test the relationship
SELECT 
    'Testing relationship' as info,
    COUNT(*) as profiles_count,
    COUNT(s.school_id) as profiles_with_schools,
    COUNT(CASE WHEN p.school_id IS NOT NULL AND s.school_id IS NULL THEN 1 END) as orphaned_references
FROM profiles p
LEFT JOIN schools s ON p.school_id = s.school_id;

-- Step 10: Show sample data
SELECT 
    'Sample profiles with school data' as info,
    p.id,
    p.first_name,
    p.username,
    p.school_id,
    s.school_name,
    s.county
FROM profiles p
LEFT JOIN schools s ON p.school_id = s.school_id
LIMIT 5;
