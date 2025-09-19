-- =====================================================
-- COMPLETE PFP TABLE FIX
-- This script will fix all PFP table issues
-- =====================================================

-- Step 1: Drop any existing views or tables that might conflict
DROP VIEW IF EXISTS user_pfps CASCADE;
DROP TABLE IF EXISTS profile_pictures CASCADE;

-- Step 2: Create the profile_pictures table properly
CREATE TABLE profile_pictures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pfp_url VARCHAR(500) NOT NULL,
  original_photo_url VARCHAR(500) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Step 3: Create indexes for performance
CREATE INDEX idx_profile_pictures_user_id ON profile_pictures(user_id);
CREATE INDEX idx_profile_pictures_created_at ON profile_pictures(created_at);

-- Step 4: Enable RLS
ALTER TABLE profile_pictures ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON profile_pictures;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profile_pictures;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON profile_pictures;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON profile_pictures;
DROP POLICY IF EXISTS "Service role can do everything" ON profile_pictures;

-- Step 6: Create proper RLS policies
CREATE POLICY "Enable read access for all users" ON profile_pictures
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON profile_pictures
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for users based on user_id" ON profile_pictures
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id" ON profile_pictures
  FOR DELETE USING (auth.uid() = user_id);

-- Allow service role to do everything (for admin operations)
CREATE POLICY "Service role can do everything" ON profile_pictures
  FOR ALL USING (auth.role() = 'service_role');

-- Step 7: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_profile_pictures_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create trigger for updated_at
CREATE TRIGGER trg_update_profile_pictures_updated_at
  BEFORE UPDATE ON profile_pictures
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_pictures_updated_at();

-- Step 9: Test the table by inserting a test record using a real user ID
-- First, get a real user ID from profiles table
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Get the first user ID from profiles table
    SELECT id INTO test_user_id FROM profiles LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Insert test record with real user ID
        INSERT INTO profile_pictures (user_id, pfp_url, original_photo_url)
        VALUES (
            test_user_id,
            'https://example.com/test-pfp.jpg',
            'https://example.com/test-original.jpg'
        );
        
        -- Verify the table works
        RAISE NOTICE 'Table created successfully';
        RAISE NOTICE 'Test record inserted for user: %', test_user_id;
        
        -- Clean up test record
        DELETE FROM profile_pictures WHERE user_id = test_user_id AND pfp_url = 'https://example.com/test-pfp.jpg';
        RAISE NOTICE 'Test record cleaned up';
    ELSE
        RAISE NOTICE 'No users found in profiles table, skipping test insert';
    END IF;
END $$;

-- Step 12: Create PFPs for existing users with photos
INSERT INTO profile_pictures (user_id, pfp_url, original_photo_url)
SELECT 
  p.id as user_id,
  p.photos[1] || '?circular=true&w=200&h=200&fit=crop&crop=center' as pfp_url,
  p.photos[1] as original_photo_url
FROM profiles p
WHERE 
  p.photos IS NOT NULL 
  AND array_length(p.photos, 1) > 0
  AND p.photos[1] IS NOT NULL
  AND p.photos[1] != ''
  AND NOT EXISTS (
    SELECT 1 
    FROM profile_pictures pp 
    WHERE pp.user_id = p.id
  )
ON CONFLICT (user_id) DO NOTHING;

-- Step 13: Show final results
SELECT 'PFPs created successfully' as status;
SELECT 
  'Total PFPs created' as metric,
  COUNT(*) as count
FROM profile_pictures;

SELECT 
  'Users with photos' as metric,
  COUNT(*) as count
FROM profiles 
WHERE photos IS NOT NULL AND array_length(photos, 1) > 0;

-- Show all created PFPs
SELECT 
  pp.id,
  pp.user_id,
  p.first_name,
  p.last_name,
  pp.pfp_url,
  pp.original_photo_url,
  pp.created_at
FROM profile_pictures pp
JOIN profiles p ON pp.user_id = p.id
ORDER BY pp.created_at DESC;
