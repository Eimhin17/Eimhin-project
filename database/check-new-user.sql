-- Check if the new user was created successfully
-- This will help us understand why login is still failing

-- Check if the new user exists in auth.users
SELECT 
    id,
    email,
    encrypted_password IS NOT NULL as has_password,
    email_confirmed_at,
    created_at,
    last_sign_in_at
FROM auth.users 
WHERE email = 'eimhinohare@gmail.com';

-- Check if the new user profile exists in public.users
SELECT 
    id,
    email,
    first_name,
    last_name,
    created_at
FROM users 
WHERE email = 'eimhinohare@gmail.com';

-- Check if there are any users with similar emails (typos)
SELECT 
    email,
    created_at
FROM auth.users 
WHERE email LIKE '%eimhinohare%' OR email LIKE '%gmail%';

-- Check the total count of users in both tables
SELECT 
    'auth.users' as table_name,
    COUNT(*) as user_count
FROM auth.users

UNION ALL

SELECT 
    'public.users' as table_name,
    COUNT(*) as user_count
FROM users;

-- Check if the user was created but with different data
SELECT 
    'auth.users' as source,
    email,
    created_at
FROM auth.users 
ORDER BY created_at DESC
LIMIT 5;
