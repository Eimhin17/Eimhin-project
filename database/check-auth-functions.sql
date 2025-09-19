-- Check for Supabase Auth functions that might be causing the database error
-- Run this in your Supabase SQL Editor

-- 1. Check for any functions that handle new user creation
SELECT 'Auth functions:' as info;
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name LIKE '%user%' 
   OR routine_name LIKE '%auth%'
   OR routine_name LIKE '%handle%'
ORDER BY routine_name;

-- 2. Check for the specific function mentioned in the trigger
SELECT 'handle_new_user function:' as info;
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- 3. Check for any triggers on the auth.users table
SELECT 'Triggers on auth.users:' as info;
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
   OR event_object_schema = 'auth';

-- 4. Check if there are any RLS policies on auth.users
SELECT 'RLS on auth.users:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'auth' AND tablename = 'users';

-- 5. Check for any database functions that might be called during auth
SELECT 'Functions called during auth:' as info;
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name IN (
    'handle_new_user',
    'on_auth_user_created',
    'auth_user_created'
);
