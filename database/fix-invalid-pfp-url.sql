-- Fix invalid PFP URL by removing and recreating with correct URL
-- This script removes the user with the example.com URL and recreates their PFP

-- Step 1: Remove the PFP with invalid URL
DELETE FROM profile_pictures 
WHERE user_id = 'e8512772-53a8-4511-b5f2-fbbe6f7a2573' 
AND pfp_url LIKE '%example.com%';

-- Step 2: Get the user's first photo and create new PFP
-- First, let's see what photos the user has
SELECT 
    id, 
    first_name, 
    photos[1] as first_photo_url
FROM profiles 
WHERE id = 'e8512772-53a8-4511-b5f2-fbbe6f7a2573';

-- Step 3: Insert new PFP with correct URL
-- Note: Replace 'YOUR_PHOTO_URL_HERE' with the actual photo URL from step 2
INSERT INTO profile_pictures (user_id, pfp_url)
SELECT 
    id,
    photos[1] as pfp_url
FROM profiles 
WHERE id = 'e8512772-53a8-4511-b5f2-fbbe6f7a2573'
AND photos IS NOT NULL 
AND array_length(photos, 1) > 0;

-- Step 4: Verify the fix
SELECT 
    pp.id,
    pp.user_id,
    p.first_name,
    pp.pfp_url,
    pp.created_at,
    pp.updated_at
FROM profile_pictures pp
JOIN profiles p ON pp.user_id = p.id
WHERE pp.user_id = 'e8512772-53a8-4511-b5f2-fbbe6f7a2573';

-- Step 5: Show all PFPs to verify everything is working
SELECT 
    pp.id,
    pp.user_id,
    p.first_name,
    LEFT(pp.pfp_url, 50) as pfp_url_preview,
    pp.created_at
FROM profile_pictures pp
JOIN profiles p ON pp.user_id = p.id
ORDER BY pp.created_at;
