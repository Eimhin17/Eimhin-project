-- Fix RLS issue with database trigger
-- The trigger needs to bypass RLS when creating profiles

-- Step 1: Drop the existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Step 2: Create a new function that bypasses RLS
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Use SECURITY DEFINER to run with elevated privileges
  -- This allows the function to bypass RLS policies
  INSERT INTO profiles (
    id, 
    email,                    -- Primary email field (what login uses)
    school_email,             -- School email for compatibility
    school_email_verified,    -- School email verification status
    email_verified,           -- Primary email verification status
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
    true,                     -- Mark school email as verified
    true,                     -- Mark primary email as verified
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
  
  RAISE NOTICE '✅ Profile created for user % with email %', NEW.id, NEW.email;
  RETURN NEW;
  
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '❌ Failed to create profile for user %: %', NEW.id, SQLERRM;
  RETURN NEW; -- Don't fail the auth user creation
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Step 4: Grant necessary permissions to the function
GRANT EXECUTE ON FUNCTION handle_new_user() TO postgres;
GRANT EXECUTE ON FUNCTION handle_new_user() TO service_role;

-- Step 5: Verify the trigger was created
SELECT '✅ Trigger function created:' as info;
SELECT 
  routine_name, 
  routine_type
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

SELECT '✅ Trigger created:' as info;
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
