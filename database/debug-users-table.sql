-- Debug script to identify users table issues
-- Run this in your Supabase SQL Editor to see what's happening

-- 1. Check if the users table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') 
        THEN '✅ Users table exists' 
        ELSE '❌ Users table does NOT exist' 
    END as table_status;

-- 2. If table exists, show its structure
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
        RAISE NOTICE 'Users table structure:';
        RAISE NOTICE '----------------------';
    ELSE
        RAISE NOTICE 'Users table does not exist!';
        RETURN;
    END IF;
END $$;

-- 3. Show detailed table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 4. Check for any constraints
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'users';

-- 5. Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'users';

-- 6. Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users';

-- 7. Try to insert a test user to see what error occurs
DO $$
DECLARE
    test_id UUID := gen_random_uuid();
    insert_error TEXT;
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
            'Debug',
            'User',
            'debug@test.com',
            true,
            false,
            false,
            true
        );
        
        RAISE NOTICE '✅ Test user inserted successfully with ID: %', test_id;
        
        -- Clean up test user
        DELETE FROM users WHERE id = test_id;
        RAISE NOTICE '✅ Test user cleaned up';
        
    EXCEPTION WHEN OTHERS THEN
        insert_error := SQLERRM;
        RAISE NOTICE '❌ Error inserting test user: %', insert_error;
        RAISE NOTICE 'Error code: %', SQLSTATE;
    END;
END $$;

-- 8. Check if there are any triggers
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users';
