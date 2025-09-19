-- Fix profiles table by adding missing columns
-- Run this in Supabase SQL Editor

-- 1. First, let's see what we're working with
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 2. Add missing columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS status user_status_type DEFAULT 'active';

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed ON profiles(onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_profiles_profile_completed ON profiles(profile_completed);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);

-- 4. Update existing profiles to have correct values
UPDATE profiles 
SET 
  status = 'active',
  onboarding_completed = true,
  profile_completed = true,
  updated_at = NOW()
WHERE id IS NOT NULL;

-- 5. Verify the fix worked
SELECT id, first_name, last_name, email, status, onboarding_completed, profile_completed 
FROM profiles 
ORDER BY created_at DESC;
