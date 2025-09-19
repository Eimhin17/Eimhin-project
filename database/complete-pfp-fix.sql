-- Complete fix for profile_pictures table
-- This will drop and recreate everything properly

-- 1. Drop everything first
DROP TABLE IF EXISTS profile_pictures CASCADE;
DROP VIEW IF EXISTS user_pfps CASCADE;

-- 2. Create the table
CREATE TABLE profile_pictures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pfp_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- 3. Create indexes
CREATE INDEX idx_profile_pictures_user_id ON profile_pictures(user_id);
CREATE INDEX idx_profile_pictures_created_at ON profile_pictures(created_at);

-- 4. Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. Create updated_at trigger
CREATE TRIGGER update_profile_pictures_updated_at 
  BEFORE UPDATE ON profile_pictures 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Enable RLS
ALTER TABLE profile_pictures ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies
CREATE POLICY "Allow all users to read profile_pictures" ON profile_pictures
  FOR SELECT USING (true);

CREATE POLICY "Allow users to insert their own profile_pictures" ON profile_pictures
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own profile_pictures" ON profile_pictures
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own profile_pictures" ON profile_pictures
  FOR DELETE USING (auth.uid() = user_id);

-- 8. Grant permissions
GRANT ALL ON profile_pictures TO authenticated;
GRANT ALL ON profile_pictures TO anon;
GRANT ALL ON profile_pictures TO service_role;
