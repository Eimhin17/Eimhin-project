-- =====================================================
-- MANUAL PFP TABLE CREATION
-- Run this in Supabase SQL Editor
-- =====================================================

-- Create the profile_pictures table
CREATE TABLE IF NOT EXISTS profile_pictures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pfp_url VARCHAR(500) NOT NULL,
  original_photo_url VARCHAR(500) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one PFP per user
  UNIQUE(user_id)
);

-- Create indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_profile_pictures_user_id ON profile_pictures(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_pictures_created_at ON profile_pictures(created_at);

-- Enable RLS
ALTER TABLE profile_pictures ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON profile_pictures;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profile_pictures;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON profile_pictures;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON profile_pictures;

-- Create RLS policies
CREATE POLICY "Enable read access for all users" ON profile_pictures
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON profile_pictures
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for users based on user_id" ON profile_pictures
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id" ON profile_pictures
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_profile_pictures_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trg_update_profile_pictures_updated_at ON profile_pictures;
CREATE TRIGGER trg_update_profile_pictures_updated_at
  BEFORE UPDATE ON profile_pictures
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_pictures_updated_at();

-- Test the table
SELECT 'profile_pictures table created successfully' as status;
