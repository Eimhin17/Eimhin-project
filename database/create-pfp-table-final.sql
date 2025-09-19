-- Create profile_pictures table
CREATE TABLE IF NOT EXISTS profile_pictures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pfp_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profile_pictures_user_id ON profile_pictures(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_pictures_created_at ON profile_pictures(created_at);

-- Enable RLS
ALTER TABLE profile_pictures ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow all users to read profile_pictures" ON profile_pictures
  FOR SELECT USING (true);

CREATE POLICY "Allow users to insert their own profile_pictures" ON profile_pictures
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own profile_pictures" ON profile_pictures
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own profile_pictures" ON profile_pictures
  FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profile_pictures_updated_at 
  BEFORE UPDATE ON profile_pictures 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
