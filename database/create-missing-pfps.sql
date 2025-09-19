-- =====================================================
-- CREATE MISSING PFPs FOR EXISTING USERS
-- This script creates PFPs for users who don't have one yet
-- =====================================================

-- First, ensure the profile_pictures table exists
CREATE TABLE IF NOT EXISTS profile_pictures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pfp_url VARCHAR(500) NOT NULL,
  original_photo_url VARCHAR(500) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_profile_pictures_user_id ON profile_pictures(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_pictures_created_at ON profile_pictures(created_at);

-- Enable RLS if not already enabled
ALTER TABLE profile_pictures ENABLE ROW LEVEL SECURITY;

-- Create RLS policies if they don't exist
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Enable read access for all users" ON profile_pictures;
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profile_pictures;
    DROP POLICY IF EXISTS "Enable update for users based on user_id" ON profile_pictures;
    DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON profile_pictures;
    
    -- Create new policies
    CREATE POLICY "Enable read access for all users" ON profile_pictures
      FOR SELECT USING (true);

    CREATE POLICY "Enable insert for authenticated users only" ON profile_pictures
      FOR INSERT WITH CHECK (auth.role() = 'authenticated');

    CREATE POLICY "Enable update for users based on user_id" ON profile_pictures
      FOR UPDATE USING (auth.uid() = user_id);

    CREATE POLICY "Enable delete for users based on user_id" ON profile_pictures
      FOR DELETE USING (auth.uid() = user_id);
END $$;

-- Create function to update updated_at timestamp if it doesn't exist
CREATE OR REPLACE FUNCTION update_profile_pictures_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at if it doesn't exist
DROP TRIGGER IF EXISTS trg_update_profile_pictures_updated_at ON profile_pictures;
CREATE TRIGGER trg_update_profile_pictures_updated_at
  BEFORE UPDATE ON profile_pictures
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_pictures_updated_at();

-- =====================================================
-- CREATE MISSING PFPs
-- =====================================================

-- Insert PFPs for users who have photos but no PFP
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

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Show how many PFPs were created
SELECT 
  'PFPs created for users with photos' as status,
  COUNT(*) as count
FROM profile_pictures pp
JOIN profiles p ON pp.user_id = p.id
WHERE p.photos IS NOT NULL AND array_length(p.photos, 1) > 0;

-- Show users who still don't have PFPs (but have photos)
SELECT 
  'Users with photos but no PFP' as status,
  COUNT(*) as count
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
  );

-- Show all PFPs created
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

-- Show summary statistics
SELECT 
  'Total profiles with photos' as metric,
  COUNT(*) as count
FROM profiles 
WHERE photos IS NOT NULL AND array_length(photos, 1) > 0

UNION ALL

SELECT 
  'Total PFPs created' as metric,
  COUNT(*) as count
FROM profile_pictures

UNION ALL

SELECT 
  'Coverage percentage' as metric,
  ROUND(
    (COUNT(pp.id)::DECIMAL / COUNT(p.id)::DECIMAL) * 100, 
    2
  ) as count
FROM profiles p
LEFT JOIN profile_pictures pp ON pp.user_id = p.id
WHERE p.photos IS NOT NULL AND array_length(p.photos, 1) > 0;
