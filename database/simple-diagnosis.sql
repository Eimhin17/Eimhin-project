-- Simple diagnosis to find what's causing the database error
-- Run this in your Supabase SQL Editor

-- 1. Check if users table exists and its structure
SELECT 'Users table check:' as info;
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') 
        THEN '✅ Users table exists' 
        ELSE '❌ Users table does NOT exist' 
    END as status;

-- 2. Show table structure
SELECT 'Table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 

WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 3. Check for any triggers
SELECT 'Triggers:' as info;
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers 
WHERE event_object_table = 'users';

-- 4. Check for any functions
SELECT 'Functions:' as info;
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name LIKE '%user%' 
   OR routine_name LIKE '%auth%';

-- 5. Try a simple insert to see what error occurs
DO $$
DECLARE
    test_id UUID := gen_random_uuid();
BEGIN
    BEGIN
        INSERT INTO users (
            id,
            first_name,
            last_name,
            school_email,
            school_email_verified,
            phone_verified,
            onboarding_completed,
            is_active
        ) VALUES (
            test_id,
            'Test',
            'User',
            'test@example.com',
            true,
            false,
            false,
            true
        );
        
        RAISE NOTICE '✅ Test insert successful!';
        
        -- Clean up
        DELETE FROM users WHERE id = test_id;
        RAISE NOTICE '✅ Test user cleaned up';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Error: %', SQLERRM;
        RAISE NOTICE 'Error code: %', SQLSTATE;
    END;
END $$;
