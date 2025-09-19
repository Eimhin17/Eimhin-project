-- COMPREHENSIVE FIX FOR SCHEMA MISMATCHES
-- This will align your database schema with what your code expects

-- Step 1: Check current profiles table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Step 2: Add missing columns that the code expects
-- Add email column (the code expects this)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email VARCHAR;

-- Add email_verified column (the code expects this)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- Step 3: Update existing records to populate the new email field
-- Copy school_email to email for existing users
UPDATE profiles 
SET email = school_email 
WHERE email IS NULL AND school_email IS NOT NULL;

-- Step 4: Make email field NOT NULL after populating it
-- This ensures the trigger function can insert into it
ALTER TABLE profiles 
ALTER COLUMN email SET NOT NULL;

-- Step 5: Drop and recreate the trigger function with correct schema
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into profiles with the CORRECT schema fields
  INSERT INTO profiles (
    id, 
    email,                    -- Use email field (what the code expects)
    school_email,             -- Also set school_email for compatibility
    school_email_verified,    -- Mark as verified
    first_name, 
    last_name, 
    date_of_birth, 
    gender, 
    looking_for, 
    relationship_intention,
    discovery_source,
    status,
    onboarding_completed,
    profile_completed,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,                -- Set email to auth user's email
    NEW.email,                -- Also set school_email to same value
    true,                     -- Mark as verified since they're coming from auth
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'Pending'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'User'),
    COALESCE((NEW.raw_user_meta_data->>'date_of_birth')::DATE, '2000-01-01'::DATE),
    COALESCE((NEW.raw_user_meta_data->>'gender')::gender_type, 'woman'::gender_type),
    COALESCE((NEW.raw_user_meta_data->>'looking_for')::looking_for_type, 'go_to_someones_debs'::looking_for_type),
    COALESCE((NEW.raw_user_meta_data->>'relationship_intention')::relationship_intention, 'long_term_only'::relationship_intention),
    COALESCE(NEW.raw_user_meta_data->>'discovery_source', 'app_signup'),
    'active'::user_status_type,
    false, -- onboarding_completed
    false, -- profile_completed
    NOW(),
    NOW()
  );
  
  RAISE NOTICE 'Profile created for user % with email %', NEW.id, NEW.email;
  RETURN NEW;
  
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Step 7: Verify the function was created
SELECT 
  routine_name, 
  routine_type
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- Step 8: Verify the trigger was created
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Step 9: Test if we can now access the user's profile
SELECT 
  id,
  email,
  school_email,
  first_name,
  last_name,
  onboarding_completed,
  status
FROM profiles 
WHERE email = 'eimhinohare@gmail.com' OR school_email = 'eimhinohare@gmail.com';

-- Step 10: Show final table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;
