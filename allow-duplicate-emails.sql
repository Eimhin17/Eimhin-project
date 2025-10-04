-- =====================================================
-- Remove Email Uniqueness Constraint (For Testing Only)
-- This allows multiple accounts with the same email
-- =====================================================

-- Drop the unique constraint on email column
ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_email_key;

-- Verify the change
SELECT
  table_name,
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name = 'email';
