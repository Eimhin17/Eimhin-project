-- =====================================================
-- FIX: Fix PFP trigger functions causing text[] -> integer error
-- This resolves the issue with generate_user_pfp() and generate_user_pfp_from_profiles()
-- =====================================================

-- Step 1: Fix the generate_user_pfp() function
CREATE OR REPLACE FUNCTION generate_user_pfp()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if photos array exists and has content
  IF NEW.photos IS NOT NULL AND array_length(NEW.photos, 1) > 0 THEN
    -- Get the first photo as the main photo
    DECLARE
      main_photo_url text;
      pfp_url text;
    BEGIN
      main_photo_url := NEW.photos[1];
      
      -- Generate PFP URL (simple approach for now)
      pfp_url := main_photo_url || '?circular=true&w=200&h=200&fit=crop&crop=center';
      
      -- Insert or update PFP in profile_pictures table
      INSERT INTO profile_pictures (user_id, pfp_url, original_photo_url)
      VALUES (NEW.id, pfp_url, main_photo_url)
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        pfp_url = EXCLUDED.pfp_url,
        original_photo_url = EXCLUDED.original_photo_url,
        updated_at = NOW();
      
      RAISE NOTICE '✅ PFP generated for user %', NEW.id;
    END;
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Don't fail the main operation if PFP generation fails
  RAISE WARNING '❌ Failed to generate PFP for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Fix the generate_user_pfp_from_profiles() function
CREATE OR REPLACE FUNCTION generate_user_pfp_from_profiles()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if photos array exists and has content
  IF NEW.photos IS NOT NULL AND array_length(NEW.photos, 1) > 0 THEN
    -- Get the first photo as the main photo
    DECLARE
      main_photo_url text;
      pfp_url text;
    BEGIN
      main_photo_url := NEW.photos[1];
      
      -- Generate PFP URL (simple approach for now)
      pfp_url := main_photo_url || '?circular=true&w=200&h=200&fit=crop&crop=center';
      
      -- Insert or update PFP in profile_pictures table
      INSERT INTO profile_pictures (user_id, pfp_url, original_photo_url)
      VALUES (NEW.id, pfp_url, main_photo_url)
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        pfp_url = EXCLUDED.pfp_url,
        original_photo_url = EXCLUDED.original_photo_url,
        updated_at = NOW();
      
      RAISE NOTICE '✅ PFP generated from profiles for user %', NEW.id;
    END;
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Don't fail the main operation if PFP generation fails
  RAISE WARNING '❌ Failed to generate PFP from profiles for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create helper functions for array operations
CREATE OR REPLACE FUNCTION safe_array_length(input_array text[])
RETURNS integer AS $$
BEGIN
  IF input_array IS NULL THEN
    RETURN 0;
  END IF;
  RETURN array_length(input_array, 1);
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create a function to safely get array element
CREATE OR REPLACE FUNCTION safe_array_element(input_array text[], index integer)
RETURNS text AS $$
BEGIN
  IF input_array IS NULL OR array_length(input_array, 1) IS NULL OR array_length(input_array, 1) < index THEN
    RETURN NULL;
  END IF;
  RETURN input_array[index];
END;
$$ LANGUAGE plpgsql;
