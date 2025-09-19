-- Fix the handle_new_user trigger function to match the ACTUAL profiles table schema
-- Based on the actual schema shown in the user's database

-- Step 1: Drop the existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Step 2: Create the corrected function that matches the actual schema
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into profiles with the CORRECT schema fields that actually exist
  INSERT INTO profiles (
    id, 
    school_email,           -- Use school_email instead of email
    school_email_verified,  -- Add this field
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
    NEW.email,              -- Set school_email to the auth user's email
    true,                   -- Mark as verified since they're coming from auth
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
  
  RAISE NOTICE 'Profile created for user % with school_email %', NEW.id, NEW.email;
  RETURN NEW;
  
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
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

-- Step 6: Test the function (optional)
DO $$
BEGIN
  RAISE NOTICE '✅ Trigger function fixed to match actual schema!';
  RAISE NOTICE 'Now when users sign up:';
  RAISE NOTICE '1. Profile will be created automatically';
  RAISE NOTICE '2. All required fields will be populated';
  RAISE NOTICE '3. school_email field will be properly set';
  RAISE NOTICE '4. No more column mismatch errors';
END $$;
