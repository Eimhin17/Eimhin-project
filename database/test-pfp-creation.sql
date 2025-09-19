-- =====================================================
-- TEST: Manually test PFP creation
-- =====================================================

-- Step 1: Find a user with photos
SELECT 'Users with photos:' as info;
SELECT 
  id,
  first_name,
  last_name,
  photos,
  array_length(photos, 1) as photo_count
FROM profiles 
WHERE photos IS NOT NULL 
AND array_length(photos, 1) > 0
LIMIT 3;

-- Step 2: Manually create a PFP for a user (replace USER_ID with actual ID)
-- This will test if the PFP creation logic works
DO $$
DECLARE
  user_record RECORD;
  main_photo_url text;
  pfp_url text;
BEGIN
  -- Get a user with photos
  SELECT id, photos INTO user_record
  FROM profiles 
  WHERE photos IS NOT NULL 
  AND array_length(photos, 1) > 0
  LIMIT 1;
  
  IF user_record.id IS NOT NULL THEN
    -- Get the first photo
    main_photo_url := user_record.photos[1];
    pfp_url := main_photo_url || '?circular=true&w=200&h=200&fit=crop&crop=center';
    
    -- Insert PFP
    INSERT INTO profile_pictures (user_id, pfp_url, original_photo_url)
    VALUES (user_record.id, pfp_url, main_photo_url)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      pfp_url = EXCLUDED.pfp_url,
      original_photo_url = EXCLUDED.original_photo_url,
      updated_at = NOW();
    
    RAISE NOTICE '✅ Manual PFP created for user %', user_record.id;
  ELSE
    RAISE NOTICE '❌ No users with photos found';
  END IF;
END $$;

-- Step 3: Check if PFP was created
SELECT 'PFPs after manual creation:' as info;
SELECT 
  user_id,
  pfp_url,
  original_photo_url,
  created_at
FROM profile_pictures
ORDER BY created_at DESC
LIMIT 5;
