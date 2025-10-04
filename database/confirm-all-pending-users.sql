-- =====================================================
-- Manually confirm all pending users who haven't confirmed their email
-- =====================================================

-- 1. Check current unconfirmed users
SELECT
    id,
    email,
    created_at,
    email_confirmed_at,
    CASE
        WHEN email_confirmed_at IS NULL THEN '❌ UNCONFIRMED'
        ELSE '✅ CONFIRMED'
    END as status
FROM auth.users
ORDER BY created_at DESC;

-- 2. Manually confirm ALL users
UPDATE auth.users
SET
    email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- 3. Verify all users are now confirmed
SELECT
    id,
    email,
    created_at,
    email_confirmed_at,
    '✅ CONFIRMED' as status
FROM auth.users
ORDER BY created_at DESC;
