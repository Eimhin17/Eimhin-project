-- Disable problematic triggers that might be causing database errors
-- Run this in your Supabase SQL Editor

-- 1. Check what triggers exist on the users table
SELECT 'Current triggers on users table:' as info;
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users';

-- 2. Disable the on_auth_user_created trigger if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'on_auth_user_created'
    ) THEN
        ALTER TABLE users DISABLE TRIGGER on_auth_user_created;
        RAISE NOTICE '✅ Disabled on_auth_user_created trigger';
    ELSE
        RAISE NOTICE 'ℹ️ on_auth_user_created trigger not found';
    END IF;
END $$;

-- 3. Disable the update_users_updated_at trigger if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_users_updated_at'
    ) THEN
        ALTER TABLE users DISABLE TRIGGER update_users_updated_at;
        RAISE NOTICE '✅ Disabled update_users_updated_at trigger';
    ELSE
        RAISE NOTICE 'ℹ️ update_users_updated_at trigger not found';
    END IF;
END $$;

-- 4. Check if there are any functions that might be called automatically
SELECT 'Functions that might be called automatically:' as info;
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name IN (
    'handle_new_user',
    'on_auth_user_created',
    'auth_user_created'
);

-- 5. Drop any problematic functions if they exist
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'handle_new_user'
    ) THEN
        DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
        RAISE NOTICE '✅ Dropped handle_new_user function';
    ELSE
        RAISE NOTICE 'ℹ️ handle_new_user function not found';
    END IF;
END $$;

-- 6. Verify triggers are disabled
SELECT 'Triggers status after changes:' as info;
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users';
