-- Fix for the auth trigger that's causing "Database error saving new user"
-- This should be run in your Supabase SQL Editor

-- First, drop the existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create a new, more robust function that handles missing metadata gracefully
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create profile if we have the minimum required data
  -- For OTP signups, we might not have all the metadata yet
  IF NEW.raw_user_meta_data IS NOT NULL 
     AND NEW.raw_user_meta_data->>'first_name' IS NOT NULL
     AND NEW.raw_user_meta_data->>'last_name' IS NOT NULL
     AND NEW.raw_user_meta_data->>'date_of_birth' IS NOT NULL
     AND NEW.raw_user_meta_data->>'gender' IS NOT NULL
     AND NEW.raw_user_meta_data->>'looking_for' IS NOT NULL
     AND NEW.raw_user_meta_data->>'relationship_intention' IS NOT NULL THEN
    
    -- All required fields are present, create the profile
    INSERT INTO profiles (
      id, 
      first_name, 
      last_name, 
      date_of_birth, 
      gender, 
      looking_for, 
      relationship_intention
    )
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'last_name',
      (NEW.raw_user_meta_data->>'date_of_birth')::DATE,
      (NEW.raw_user_meta_data->>'gender')::gender_type,
      (NEW.raw_user_meta_data->>'looking_for')::looking_for_type,
      (NEW.raw_user_meta_data->>'relationship_intention')::relationship_intention
    );
    
    RAISE NOTICE 'Profile created automatically for user %', NEW.id;
  ELSE
    -- Not enough metadata, create a minimal profile with defaults
    -- This allows the user to complete their profile later
    INSERT INTO profiles (
      id,
      first_name,
      last_name,
      date_of_birth,
      gender,
      looking_for,
      relationship_intention,
      onboarding_completed,
      profile_completed
    )
    VALUES (
      NEW.id,
      'Pending',  -- Will be updated during onboarding
      'User',     -- Will be updated during onboarding
      '2000-01-01'::DATE,  -- Default date, will be updated during onboarding
      'woman'::gender_type,  -- Default gender, will be updated during onboarding
      'go_to_someones_debs'::looking_for_type,  -- Default value
      'long_term_only'::relationship_intention,  -- Default value
      false,  -- Onboarding not completed
      false   -- Profile not completed
    );
    
    RAISE NOTICE 'Minimal profile created for user % (needs onboarding)', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Test the function (optional - you can remove this)
-- SELECT handle_new_user_test();
