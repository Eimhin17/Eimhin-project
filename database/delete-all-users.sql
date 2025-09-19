-- Delete all users from both tables
-- This will give you a clean slate to test the fixed authentication

-- First, let's see what users exist before deletion
SELECT 'BEFORE DELETION - Users in auth.users:' as info;
SELECT 
    id,
    email,
    created_at
FROM auth.users 
ORDER BY created_at;

SELECT 'BEFORE DELETION - Users in public.users:' as info;
SELECT 
    id,
    email,
    first_name,
    last_name,
    created_at
FROM users 
ORDER BY created_at;

-- Delete all users from the public.users table
DELETE FROM users;
SELECT 'Deleted all users from public.users table' as status;

-- Delete all users from the auth.users table
DELETE FROM auth.users;
SELECT 'Deleted all users from auth.users table' as status;

-- Verify deletion
SELECT 'AFTER DELETION - Users in auth.users:' as info;
SELECT COUNT(*) as user_count FROM auth.users;

SELECT 'AFTER DELETION - Users in public.users:' as info;
SELECT COUNT(*) as user_count FROM users;

-- Success message
SELECT 'All users deleted successfully! You can now test the fixed authentication flow.' as final_status;
