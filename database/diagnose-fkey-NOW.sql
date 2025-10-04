-- =====================================================
-- DIAGNOSE: What foreign keys exist on profiles table
-- =====================================================

-- Method 1: Check using pg_constraint (most reliable)
SELECT
    conname as constraint_name,
    conrelid::regclass as table_name,
    confrelid::regclass as foreign_table_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
    AND contype = 'f'  -- f = foreign key
ORDER BY conname;

-- Method 2: Check all constraints on profiles
SELECT
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints
WHERE table_name = 'profiles'
    AND table_schema = 'public';

-- Method 3: Check if public.users table exists (it shouldn't!)
SELECT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'users'
) as public_users_table_exists;

-- Method 4: Check if auth.users exists (it should!)
SELECT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'auth'
    AND tablename = 'users'
) as auth_users_table_exists;

-- Method 5: Check recent users in auth.users
SELECT
    id,
    email,
    created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 3;
