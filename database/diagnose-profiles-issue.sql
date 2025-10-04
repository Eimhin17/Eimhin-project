-- Diagnose the profiles foreign key issue

-- 1. Check what the profiles table actually looks like
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 2. Check foreign key constraints on profiles
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_schema AS foreign_schema,
    ccu.table_name AS foreign_table,
    ccu.column_name AS foreign_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'profiles';

-- 3. Check if there's a public.users table
SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'users'
) AS public_users_exists;

-- 4. Check recent auth.users
SELECT
    id,
    email,
    email_confirmed_at,
    created_at,
    CASE
        WHEN email_confirmed_at IS NULL THEN 'UNCONFIRMED ⚠️'
        ELSE 'CONFIRMED ✅'
    END as status
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 5. Check profiles table
SELECT
    id,
    email,
    username,
    first_name,
    created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 5;
