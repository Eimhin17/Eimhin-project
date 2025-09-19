-- Update profiles to have correct status and completion flags
-- Run this in Supabase SQL Editor

-- 1. First, see what profiles we have
SELECT id, first_name, last_name, email, status, onboarding_completed, profile_completed 
FROM profiles 
ORDER BY created_at DESC;

-- 2. Update all profiles to have active status and completed flags
UPDATE profiles 
SET 
  status = 'active',
  onboarding_completed = true,
  profile_completed = true,
  updated_at = NOW()
WHERE id IS NOT NULL;

-- 3. Verify the update
SELECT id, first_name, last_name, email, status, onboarding_completed, profile_completed 
FROM profiles 
WHERE status = 'active' AND onboarding_completed = true;
