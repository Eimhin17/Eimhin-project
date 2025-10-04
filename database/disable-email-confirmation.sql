-- Disable email confirmation requirement for testing
-- Run this in your Supabase SQL Editor

-- This will allow signups without email confirmation
-- Go to: Authentication > Email Auth > Confirm email = OFF

-- OR manually confirm all pending users:
UPDATE auth.users
SET email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- Check current auth users status:
SELECT
  id,
  email,
  email_confirmed_at,
  created_at,
  CASE
    WHEN email_confirmed_at IS NULL THEN 'UNCONFIRMED'
    ELSE 'CONFIRMED'
  END as status
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;
