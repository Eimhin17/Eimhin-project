-- Cleanup Existing Profiles SQL Script
-- Run this in your Supabase SQL Editor to remove the old profiles without passwords

-- Delete the two existing profiles that don't have passwords set
DELETE FROM users 
WHERE school_email IN (
  '19-0120@stkieranscollege.ie',  -- Eimhin's profile
  'eimhinohare@gmail.com'          -- Ly's profile
);

-- Verify the cleanup
SELECT 
  COUNT(*) as remaining_users,
  COUNT(CASE WHEN password_hash IS NOT NULL THEN 1 END) as users_with_passwords,
  COUNT(CASE WHEN password_hash IS NULL THEN 1 END) as users_without_passwords
FROM users;

-- Show remaining users (should be 0 if cleanup was successful)
SELECT 
  school_email,
  first_name,
  last_name,
  CASE 
    WHEN password_hash IS NOT NULL THEN 'Has Password'
    ELSE 'No Password'
  END as password_status
FROM users
ORDER BY created_at;
