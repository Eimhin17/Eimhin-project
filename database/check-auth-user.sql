-- Check the current state of the auth user
-- This will help us understand why login is still failing

-- Check the auth.users table
SELECT 
    id,
    email,
    encrypted_password IS NOT NULL as has_password,
    email_confirmed_at,
    created_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data
FROM auth.users 
WHERE email = '19-0120@stkieranscollege.ie';

-- Check if there are any auth policies blocking access
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'users' OR tablename = 'auth_users';

-- Check the current RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'users';

-- Check if the user exists in both tables
SELECT 
    'auth.users' as table_name,
    COUNT(*) as user_count
FROM auth.users 
WHERE email = '19-0120@stkieranscollege.ie'

UNION ALL

SELECT 
    'public.users' as table_name,
    COUNT(*) as user_count
FROM users 
WHERE email = '19-0120@stkieranscollege.ie';
