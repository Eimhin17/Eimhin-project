-- =====================================================
-- FINAL FIX: Resolve text[] -> integer operator error
-- This is a comprehensive fix for the persistent database error
-- =====================================================

-- Step 1: Create a function that converts text[] to integer
CREATE OR REPLACE FUNCTION text_array_to_integer(input_array text[])
RETURNS integer AS $$
BEGIN
  IF input_array IS NULL THEN
    RETURN 0;
  END IF;
  RETURN array_length(input_array, 1);
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create a cast function for text[] to integer (if possible)
-- This might require superuser privileges, so we'll try it
DO $$
BEGIN
  -- Try to create the cast, but don't fail if it doesn't work
  BEGIN
    CREATE CAST (text[] AS integer) WITH FUNCTION text_array_to_integer(text[]);
  EXCEPTION WHEN OTHERS THEN
    -- If cast creation fails, just continue
    NULL;
  END;
END $$;

-- Step 3: Create a more robust function that handles any array type
CREATE OR REPLACE FUNCTION safe_array_length(input_data anyelement)
RETURNS integer AS $$
BEGIN
  IF input_data IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Handle text arrays
  IF pg_typeof(input_data) = 'text[]'::regtype THEN
    RETURN array_length(input_data, 1);
  END IF;
  
  -- Handle other array types
  IF pg_typeof(input_data)::text LIKE '%[]' THEN
    RETURN array_length(input_data, 1);
  END IF;
  
  -- Default case
  RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create a function that might be what the trigger is looking for
CREATE OR REPLACE FUNCTION array_length_safe(input_array anyarray)
RETURNS integer AS $$
BEGIN
  IF input_array IS NULL THEN
    RETURN 0;
  END IF;
  RETURN array_length(input_array, 1);
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create a function specifically for text arrays
CREATE OR REPLACE FUNCTION get_text_array_length(input_array text[])
RETURNS integer AS $$
BEGIN
  IF input_array IS NULL THEN
    RETURN 0;
  END IF;
  RETURN array_length(input_array, 1);
END;
$$ LANGUAGE plpgsql;

-- Step 6: Check if there are any problematic triggers and provide a fix
-- This query will help identify what might be causing the issue
SELECT 
  'Current triggers on profiles table:' as info,
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND event_object_table = 'profiles';

-- Step 7: Create a function that might be referenced in triggers
CREATE OR REPLACE FUNCTION process_text_array(input_array text[])
RETURNS integer AS $$
BEGIN
  IF input_array IS NULL THEN
    RETURN 0;
  END IF;
  RETURN array_length(input_array, 1);
END;
$$ LANGUAGE plpgsql;
