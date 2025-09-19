-- =====================================================
-- REDESIGNED PROFILES TABLE - Optimized for Easy Data Retrieval
-- =====================================================

-- Drop existing profiles table (CAREFUL - this will delete all data!)
-- DROP TABLE IF EXISTS profiles CASCADE;

-- Create new optimized profiles table
CREATE TABLE profiles_redesigned (
  -- Primary Key
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 1. School Information
  school_id UUID REFERENCES schools(id),
  school_name VARCHAR(200), -- Denormalized for easy access
  
  -- 2. Contact Information  
  email VARCHAR(255) NOT NULL,
  
  -- 3. Notification Preferences
  notifications_enabled BOOLEAN DEFAULT true,
  
  -- 4. Basic Personal Information
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE NOT NULL,
  age INTEGER, -- We'll calculate this in the application or use a trigger
  gender gender_type NOT NULL,
  
  -- 5. Profile Content
  bio TEXT,
  
  -- 6. Legal Compliance
  agreed_to_terms_and_conditions BOOLEAN DEFAULT false,
  
  -- 7. Match Preferences
  match_preferences JSONB, -- Flexible structure for various preferences
  
  -- 8. Relationship Preferences
  looking_for_friends_or_dates VARCHAR(50), -- 'friends', 'dates', 'both'
  relationship_status VARCHAR(50), -- 'single', 'in_relationship', 'complicated', etc.
  looking_for_debs looking_for_type NOT NULL, -- 'go_to_someones_debs', 'bring_someone_to_my_debs'
  dating_intentions relationship_intention NOT NULL,
  
  -- 9. Interests and Content
  interests TEXT[], -- Array of interest strings
  -- photos column removed - photos are now stored in user_photos table
  profile_prompts JSONB, -- Flexible structure for prompts and responses
  
  -- 10. Activity Tracking
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  account_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 11. System Fields
  status user_status_type DEFAULT 'active',
  onboarding_completed BOOLEAN DEFAULT false,
  profile_completed BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for optimal performance
CREATE INDEX idx_profiles_redesigned_school_id ON profiles_redesigned(school_id);
CREATE INDEX idx_profiles_redesigned_gender ON profiles_redesigned(gender);
CREATE INDEX idx_profiles_redesigned_looking_for_debs ON profiles_redesigned(looking_for_debs);
CREATE INDEX idx_profiles_redesigned_dating_intentions ON profiles_redesigned(dating_intentions);
CREATE INDEX idx_profiles_redesigned_status ON profiles_redesigned(status);
CREATE INDEX idx_profiles_redesigned_age ON profiles_redesigned(age);
CREATE INDEX idx_profiles_redesigned_last_active ON profiles_redesigned(last_active_at);
CREATE INDEX idx_profiles_redesigned_interests ON profiles_redesigned USING GIN(interests);
CREATE INDEX idx_profiles_redesigned_photos ON profiles_redesigned USING GIN(photos);

-- Create RLS policies
ALTER TABLE profiles_redesigned ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON profiles_redesigned
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON profiles_redesigned
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for users based on user_id" ON profiles_redesigned
  FOR UPDATE USING (auth.uid() = id);

-- Sample data structure for reference
COMMENT ON COLUMN profiles_redesigned.match_preferences IS 'JSON structure: {"max_distance": 50, "min_age": 18, "max_age": 25, "schools": ["school1", "school2"]}';
COMMENT ON COLUMN profiles_redesigned.profile_prompts IS 'JSON structure: {"prompt1": "response1", "prompt2": "response2"}';
COMMENT ON COLUMN profiles_redesigned.interests IS 'Array of strings: ["Music", "Dancing", "Travel"]';
COMMENT ON COLUMN profiles_redesigned.photos IS 'Array of photo URLs: ["url1", "url2", "url3"]';
