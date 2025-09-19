-- Check if the user profile exists in the users table
-- This will help diagnose the login issue

-- First, let's see what's in the users table
SELECT 
    id,
    email,
    first_name,
    last_name,
    created_at,
    status,
    is_active,
    school_email,
    school_email_verified
FROM users 
WHERE email = '19-0120@stkieranscollege.ie';

-- If no results, the user profile wasn't created
-- Let's also check the auth.users table to see the Supabase Auth user
SELECT 
    id,
    email,
    created_at,
    last_sign_in_at
FROM auth.users 
WHERE email = '19-0120@stkieranscollege.ie';

-- Check if the users table has any data at all
SELECT COUNT(*) as total_users FROM users;

-- Check the structure of the users table
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
