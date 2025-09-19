-- Verify the current state of the database
-- This will show us what's working and what still needs fixing

-- 1. Check if the user profile exists and what columns it has
SELECT 
    id,
    email,
    first_name,
    last_name,
    created_at,
    status,
    is_active,
    school_email,
    school_email_verified,
    email_verified,
    phone_number,
    date_of_birth,
    gender,
    looking_for,
    relationship_intention
FROM users 
WHERE email = '19-0120@stkieranscollege.ie';

-- 2. Check what columns actually exist in the users table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN (
    'is_active', 
    'school_email', 
    'school_email_verified', 
    'status',
    'email_verified',
    'phone_number',
    'date_of_birth',
    'gender',
    'looking_for',
    'relationship_intention'
)
ORDER BY column_name;

-- 3. Check if there are any other users in the table
SELECT COUNT(*) as total_users FROM users;

-- 4. Check the auth.users table to confirm the Supabase Auth user
SELECT 
    id,
    email,
    created_at,
    last_sign_in_at
FROM auth.users 
WHERE email = '19-0120@stkieranscollege.ie';
