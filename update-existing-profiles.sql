-- Update existing profiles to have correct status and completion flags
-- This script should be run in the Supabase SQL Editor

-- First, let's see what profiles we have
SELECT id, first_name, last_name, email, status, onboarding_completed, profile_completed 
FROM profiles 
ORDER BY created_at DESC;

-- Update profiles to have active status and completed flags
UPDATE profiles 
SET 
  status = 'active',
  onboarding_completed = true,
  profile_completed = true,
  updated_at = NOW()
WHERE id IN (
  '85a9cf8c-c9af-448d-9b47-8e9a5...',  -- Replace with actual IDs from your database
  '90ea614e-5242-4979-8c57-84c3c...'   -- Replace with actual IDs from your database
);

-- Verify the update
SELECT id, first_name, last_name, email, status, onboarding_completed, profile_completed 
FROM profiles 
WHERE status = 'active' AND onboarding_completed = true;


