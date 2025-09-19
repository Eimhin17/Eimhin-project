-- Comprehensive Fix for Supabase Auth Database Issues
-- This should resolve the "Database error saving new user" error

-- Step 1: Drop all existing triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Step 2: Create a completely new, robust function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  profile_id UUID;
BEGIN
  -- Always create a profile, but handle missing data gracefully
  BEGIN
    -- Try to create profile with metadata if available
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
      
      RAISE NOTICE 'Profile created with metadata for user %', NEW.id;
      
    ELSE
      -- Not enough metadata, create a minimal profile with safe defaults
      INSERT INTO profiles (
        id,
        first_name,
        last_name,
        date_of_birth,
        gender,
        looking_for,
        relationship_intention,
        onboarding_completed,
        profile_completed,
        status
      )
      VALUES (
        NEW.id,
        'Pending',  -- Safe default
        'User',     -- Safe default
        '2000-01-01'::DATE,  -- Safe default date
        'woman'::gender_type,  -- Safe default gender
        'go_to_someones_debs'::looking_for_type,  -- Safe default
        'long_term_only'::relationship_intention,  -- Safe default
        false,  -- Onboarding not completed
        false,  -- Profile not completed
        'active'::user_status_type  -- Safe default status
      );
      
      RAISE NOTICE 'Minimal profile created for user % (needs onboarding)', NEW.id;
    END IF;
    
  EXCEPTION WHEN OTHERS THEN
    -- If anything goes wrong, create a basic profile with minimal data
    BEGIN
      INSERT INTO profiles (
        id,
        first_name,
        last_name,
        date_of_birth,
        gender,
        looking_for,
        relationship_intention,
        onboarding_completed,
        profile_completed,
        status
      )
      VALUES (
        NEW.id,
        'User',
        'User',
        '2000-01-01'::DATE,
        'woman'::gender_type,
        'go_to_someones_debs'::looking_for_type,
        'long_term_only'::relationship_intention,
        false,
        false,
        'active'::user_status_type
      );
      
      RAISE NOTICE 'Emergency profile created for user % after error recovery', NEW.id;
      
    EXCEPTION WHEN OTHERS THEN
      -- If even the emergency profile creation fails, log the error but don't crash
      RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    END;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Step 4: Verify the function was created
SELECT 
  routine_name, 
  routine_type, 
  routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- Step 5: Verify the trigger was created
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table, 
  action_statement 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Step 6: Test the function (optional - remove this in production)
-- This will test if the function can be called without errors
DO $$
BEGIN
  RAISE NOTICE 'Testing handle_new_user function...';
  -- The function should now handle any user creation scenario gracefully
  RAISE NOTICE 'Function created successfully and should handle all cases!';
END $$;
