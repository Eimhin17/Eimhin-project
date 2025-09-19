-- Test database connection and users table setup
-- Run this in your Supabase SQL Editor to diagnose issues

-- 1. Check if we can connect and run basic queries
SELECT '✅ Database connection successful' as status;

-- 2. Check if the users table exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') 
    THEN '✅ Users table exists' 
    ELSE '❌ Users table does not exist' 
  END as table_status;

-- 3. If users table exists, show its structure
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    RAISE NOTICE 'Users table structure:';
    PERFORM column_name, data_type, is_nullable, column_default 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    ORDER BY ordinal_position;
  END IF;
END $$;

-- 4. Check if we can insert a test user (this will help identify the exact issue)
DO $$
DECLARE
  test_user_id UUID := gen_random_uuid();
  insert_error TEXT;
BEGIN
  -- Try to insert a test user
  BEGIN
    INSERT INTO users (
      id, 
      first_name, 
      last_name, 
      date_of_birth,
      school_email,
      school_email_verified,
      phone_verified,
      onboarding_completed,
      is_active
    ) VALUES (
      test_user_id,
      'Test',
      'User',
      '2000-01-01',
      'test@school.ie',
      true,
      false,
      false,
      true
    );
    
    RAISE NOTICE '✅ Test user insert successful';
    
    -- Clean up the test user
    DELETE FROM users WHERE id = test_user_id;
    RAISE NOTICE '✅ Test user cleaned up';
    
  EXCEPTION WHEN OTHERS THEN
    insert_error := SQLERRM;
    RAISE NOTICE '❌ Test user insert failed: %', insert_error;
  END;
END $$;

-- 5. Check for any missing columns or constraints
SELECT 
  'Missing columns check' as check_type,
  column_name,
  'Column missing' as issue
FROM (
  SELECT 'school_email' as column_name
  UNION SELECT 'school_email_verified'
  UNION SELECT 'phone_verified'
  UNION SELECT 'onboarding_completed'
  UNION SELECT 'is_active'
  UNION SELECT 'last_active'
  UNION SELECT 'created_at'
  UNION SELECT 'updated_at'
) required_columns
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'users' 
  AND column_name = required_columns.column_name
);

-- 6. Final status
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') 
    THEN '✅ Database setup appears correct' 
    ELSE '❌ Database setup incomplete - run setup-fresh.sql first' 
  END as final_status;
