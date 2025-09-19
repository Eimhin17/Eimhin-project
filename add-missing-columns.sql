-- Add missing columns to profiles table
-- Run this in Supabase SQL Editor

-- 1. First, check what columns exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 2. Add the missing onboarding_completed column if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- 3. Add the missing profile_completed column if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false;

-- 4. Add the missing status column if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS status user_status_type DEFAULT 'active';

-- 5. Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed ON profiles(onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_profiles_profile_completed ON profiles(profile_completed);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);

-- 6. Update existing profiles to have the correct values
UPDATE profiles 
SET 
  status = 'active',
  onboarding_completed = true,
  profile_completed = true,
  updated_at = NOW()
WHERE id IS NOT NULL;

-- 7. Verify the columns exist and have data
SELECT id, first_name, last_name, email, status, onboarding_completed, profile_completed 
FROM profiles 
ORDER BY created_at DESC;
