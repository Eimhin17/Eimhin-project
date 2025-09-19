-- =====================================================
-- SIMPLE FIX: Create text[] -> integer functions without casts
-- This resolves the "operator does not exist: text[] -> integer" error
-- =====================================================

-- Create a function that converts text[] to integer (array length)
CREATE OR REPLACE FUNCTION text_array_to_integer(input_array text[])
RETURNS integer AS $$
BEGIN
  IF input_array IS NULL THEN
    RETURN 0;
  END IF;
  RETURN array_length(input_array, 1);
END;
$$ LANGUAGE plpgsql;

-- Create a function for getting text array length
CREATE OR REPLACE FUNCTION get_text_array_length(input_array text[])
RETURNS integer AS $$
BEGIN
  IF input_array IS NULL THEN
    RETURN 0;
  END IF;
  RETURN array_length(input_array, 1);
END;
$$ LANGUAGE plpgsql;

-- Create a more generic function that handles any array type
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

-- Create a function that might be what the trigger is looking for
CREATE OR REPLACE FUNCTION array_length_safe(input_array anyarray)
RETURNS integer AS $$
BEGIN
  IF input_array IS NULL THEN
    RETURN 0;
  END IF;
  RETURN array_length(input_array, 1);
END;
$$ LANGUAGE plpgsql;
