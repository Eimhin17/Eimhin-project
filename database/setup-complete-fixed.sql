-- DebsMatch Complete Database Setup Script (FIXED VERSION)
-- Run this in your Supabase SQL Editor to completely reset and recreate the database
-- This includes all fields needed for the complete onboarding flow

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (in correct order due to foreign key constraints)
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS swipes CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS user_voice_prompts CASCADE;
DROP TABLE IF EXISTS user_profile_prompts CASCADE;
DROP TABLE IF EXISTS user_interests CASCADE;
DROP TABLE IF EXISTS user_photos CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS schools CASCADE;
DROP TABLE IF EXISTS interests CASCADE;
DROP TABLE IF EXISTS profile_prompts CASCADE;
DROP TABLE IF EXISTS mock_profiles CASCADE;

-- Drop existing types if they exist
DROP TYPE IF EXISTS gender_type CASCADE;
DROP TYPE IF EXISTS swipe_direction CASCADE;
DROP TYPE IF EXISTS relationship_intention CASCADE;
DROP TYPE IF EXISTS looking_for_type CASCADE;
DROP TYPE IF EXISTS mock_profile_status CASCADE;

-- Create custom types
CREATE TYPE gender_type AS ENUM ('woman', 'man', 'non_binary');
CREATE TYPE swipe_direction AS ENUM ('left', 'right');
CREATE TYPE relationship_intention AS ENUM (
  'one_night_thing',
  'short_term_only', 
  'short_term_but_open_to_long_term',
  'long_term_only',
  'long_term_but_open_to_short_term'
);
CREATE TYPE looking_for_type AS ENUM (
  'go_to_someones_debs',
  'bring_someone_to_my_debs'
);
CREATE TYPE mock_profile_status AS ENUM ('active', 'inactive', 'testing');

-- Schools table
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  county VARCHAR(100),
  address TEXT,
  phone VARCHAR(20),
  website VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Interests table
CREATE TABLE interests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(50),
  icon_name VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profile prompts table
CREATE TABLE profile_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_text TEXT NOT NULL,
  category VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) UNIQUE,
  phone_verified BOOLEAN DEFAULT false,
  school_id UUID REFERENCES schools(id),
  school_email VARCHAR(255) UNIQUE,
  school_email_verified BOOLEAN DEFAULT false,
  first_name VARCHAR(100) DEFAULT 'Pending',
  last_name VARCHAR(100) DEFAULT 'User',
  date_of_birth DATE DEFAULT '2000-01-01',
  gender gender_type,
  looking_for looking_for_type,
  relationship_intention relationship_intention,
  bio TEXT,
  discovery_source VARCHAR(100),
  push_notifications_enabled BOOLEAN DEFAULT true,
  privacy_policy_accepted BOOLEAN DEFAULT false,
  onboarding_completed BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mock Profiles table for testing and development
CREATE TABLE mock_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE NOT NULL,
  gender gender_type NOT NULL,
  looking_for looking_for_type NOT NULL,
  relationship_intention relationship_intention NOT NULL,
  bio TEXT,
  school_id UUID REFERENCES schools(id),
  discovery_source VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  status mock_profile_status DEFAULT 'active',
  created_by UUID REFERENCES auth.users(id), -- who created this mock profile
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User photos table
CREATE TABLE user_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_order INTEGER NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mock profile photos table
CREATE TABLE mock_profile_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mock_profile_id UUID NOT NULL REFERENCES mock_profiles(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_order INTEGER NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User interests junction table
CREATE TABLE user_interests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interest_id UUID NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, interest_id)
);

-- Mock profile interests junction table
CREATE TABLE mock_profile_interests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mock_profile_id UUID NOT NULL REFERENCES mock_profiles(id) ON DELETE CASCADE,
  interest_id UUID NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(mock_profile_id, interest_id)
);

-- User profile prompts table
CREATE TABLE user_profile_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES profile_prompts(id) ON DELETE CASCADE,
  response TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mock profile prompts table
CREATE TABLE mock_profile_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mock_profile_id UUID NOT NULL REFERENCES mock_profiles(id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES profile_prompts(id) ON DELETE CASCADE,
  response TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User voice prompts table
CREATE TABLE user_voice_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  audio_url TEXT NOT NULL,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Swipes table (includes both real users and mock profiles)
CREATE TABLE swipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  swiper_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  swiped_user_id UUID, -- can be NULL for mock profiles
  swiped_mock_profile_id UUID REFERENCES mock_profiles(id) ON DELETE CASCADE,
  swipe_direction swipe_direction NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure only one of the swiped IDs is set
  CONSTRAINT swipes_check CHECK (
    (swiped_user_id IS NOT NULL AND swiped_mock_profile_id IS NULL) OR
    (swiped_user_id IS NULL AND swiped_mock_profile_id IS NOT NULL)
  ),
  -- Ensure unique swipes per user
  UNIQUE(swiper_id, swiped_user_id),
  UNIQUE(swiper_id, swiped_mock_profile_id)
);

-- Matches table (includes both real users and mock profiles)
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID, -- can be NULL for mock profiles
  mock_profile_id UUID REFERENCES mock_profiles(id) ON DELETE CASCADE,
  matched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure only one of the matched IDs is set
  CONSTRAINT matches_check CHECK (
    (user2_id IS NOT NULL AND mock_profile_id IS NULL) OR
    (user2_id IS NULL AND mock_profile_id IS NOT NULL)
  ),
  -- Ensure unique matches
  UNIQUE(user1_id, user2_id),
  UNIQUE(user1_id, mock_profile_id)
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User preferences table
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  min_age INTEGER DEFAULT 18,
  max_age INTEGER DEFAULT 100,
  max_distance_km INTEGER DEFAULT 50,
  preferred_genders gender_type[],
  preferred_schools UUID[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_school_id ON users(school_id);
CREATE INDEX idx_users_gender ON users(gender);
CREATE INDEX idx_users_looking_for ON users(looking_for);
CREATE INDEX idx_users_date_of_birth ON users(date_of_birth);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_last_active ON users(last_active);

CREATE INDEX idx_mock_profiles_school_id ON mock_profiles(school_id);
CREATE INDEX idx_mock_profiles_gender ON mock_profiles(gender);
CREATE INDEX idx_mock_profiles_looking_for ON mock_profiles(looking_for);
CREATE INDEX idx_mock_profiles_date_of_birth ON mock_profiles(date_of_birth);
CREATE INDEX idx_mock_profiles_is_active ON mock_profiles(is_active);
CREATE INDEX idx_mock_profiles_status ON mock_profiles(status);

CREATE INDEX idx_user_photos_user_id ON user_photos(user_id);
CREATE INDEX idx_user_photos_is_primary ON user_photos(is_primary);

CREATE INDEX idx_mock_profile_photos_mock_profile_id ON mock_profile_photos(mock_profile_id);
CREATE INDEX idx_mock_profile_photos_is_primary ON mock_profile_photos(is_primary);

CREATE INDEX idx_user_interests_user_id ON user_interests(user_id);
CREATE INDEX idx_user_interests_interest_id ON user_interests(interest_id);

CREATE INDEX idx_mock_profile_interests_mock_profile_id ON mock_profile_interests(mock_profile_id);
CREATE INDEX idx_mock_profile_interests_interest_id ON mock_profile_interests(interest_id);

CREATE INDEX idx_swipes_swiper_id ON swipes(swiper_id);
CREATE INDEX idx_swipes_swiped_user_id ON swipes(swiped_user_id);
CREATE INDEX idx_swipes_swiped_mock_profile_id ON swipes(swiped_mock_profile_id);
CREATE INDEX idx_swipes_created_at ON swipes(created_at);

CREATE INDEX idx_matches_user1_id ON matches(user1_id);
CREATE INDEX idx_matches_user2_id ON matches(user2_id);
CREATE INDEX idx_matches_mock_profile_id ON matches(mock_profile_id);
CREATE INDEX idx_matches_is_active ON matches(is_active);

CREATE INDEX idx_messages_match_id ON messages(match_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_is_read ON messages(is_read);

-- Create RLS (Row Level Security) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_profile_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_profile_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profile_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_profile_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_voice_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile and other active users' basic info
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view other active users" ON users
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Mock profiles policies - anyone can view active mock profiles
CREATE POLICY "Anyone can view active mock profiles" ON mock_profiles
  FOR SELECT USING (is_active = true AND status = 'active');

CREATE POLICY "Users can create mock profiles" ON mock_profiles
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own mock profiles" ON mock_profiles
  FOR UPDATE USING (auth.uid() = created_by);

-- User photos policies
CREATE POLICY "Users can view own photos" ON user_photos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view other users' photos" ON user_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = user_photos.user_id 
      AND users.is_active = true
    )
  );

CREATE POLICY "Users can manage own photos" ON user_photos
  FOR ALL USING (auth.uid() = user_id);

-- Mock profile photos policies - anyone can view active mock profile photos
CREATE POLICY "Anyone can view active mock profile photos" ON mock_profile_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM mock_profiles 
      WHERE mock_profiles.id = mock_profile_photos.mock_profile_id 
      AND mock_profiles.is_active = true AND mock_profiles.status = 'active'
    )
  );

-- User interests policies
CREATE POLICY "Users can view own interests" ON user_interests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view other users' interests" ON user_interests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = user_interests.user_id 
      AND users.is_active = true
    )
  );

CREATE POLICY "Users can manage own interests" ON user_interests
  FOR ALL USING (auth.uid() = user_id);

-- Mock profile interests policies
CREATE POLICY "Anyone can view active mock profile interests" ON mock_profile_interests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM mock_profiles 
      WHERE mock_profiles.id = mock_profile_interests.mock_profile_id 
      AND mock_profiles.is_active = true AND mock_profiles.status = 'active'
    )
  );

-- Swipes policies
CREATE POLICY "Users can view own swipes" ON swipes
  FOR SELECT USING (auth.uid() = swiper_id);

CREATE POLICY "Users can create swipes" ON swipes
  FOR INSERT WITH CHECK (auth.uid() = swiper_id);

-- Matches policies
CREATE POLICY "Users can view own matches" ON matches
  FOR SELECT USING (auth.uid() = user1_id);

CREATE POLICY "Users can create matches" ON matches
  FOR INSERT WITH CHECK (auth.uid() = user1_id);

-- Messages policies
CREATE POLICY "Users can view messages in their matches" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM matches 
      WHERE matches.id = messages.match_id 
      AND matches.user1_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages in their matches" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM matches 
      WHERE matches.id = messages.match_id 
      AND matches.user1_id = auth.uid()
    )
  );

-- User preferences policies
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Create functions for common operations
CREATE OR REPLACE FUNCTION get_user_age(birth_date DATE)
RETURNS INTEGER AS $$
BEGIN
  RETURN EXTRACT(YEAR FROM AGE(birth_date));
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mock_profiles_updated_at
  BEFORE UPDATE ON mock_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profile_prompts_updated_at
  BEFORE UPDATE ON user_profile_prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mock_profile_prompts_updated_at
  BEFORE UPDATE ON mock_profile_prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for schools (Irish secondary schools)
INSERT INTO schools (name, county) VALUES
('St. Mary''s College, Dundalk', 'Louth'),
('Dundalk Grammar School', 'Louth'),
('Coláiste Rís', 'Louth'),
('St. Vincent''s Secondary School', 'Dublin'),
('Mount Anville Secondary School', 'Dublin'),
('Blackrock College', 'Dublin'),
('St. Michael''s College', 'Dublin'),
('Gonzaga College', 'Dublin'),
('Belvedere College', 'Dublin'),
('St. Patrick''s Cathedral Grammar School', 'Dublin'),
('Cork Grammar School', 'Cork'),
('St. Angela''s College', 'Cork'),
('Presentation Brothers College', 'Cork'),
('St. Mary''s Secondary School', 'Cork'),
('Limerick Grammar School', 'Limerick'),
('Crescent College Comprehensive', 'Limerick'),
('St. Clement''s College', 'Limerick'),
('St. Munchin''s College', 'Limerick'),
('Galway Grammar School', 'Galway'),
('St. Joseph''s College', 'Galway'),
('Coláiste Iognáid', 'Galway'),
('St. Mary''s College', 'Galway');

-- Insert sample interests (FIXED - removed duplicate Photography)
INSERT INTO interests (name, category) VALUES
('Football', 'Sports'),
('Gaelic Football', 'Sports'),
('Hurling', 'Sports'),
('Rugby', 'Sports'),
('Swimming', 'Sports'),
('Running', 'Sports'),
('Gym', 'Sports'),
('Tennis', 'Sports'),
('Basketball', 'Sports'),
('Music', 'Arts'),
('Guitar', 'Arts'),
('Piano', 'Arts'),
('Singing', 'Arts'),
('Dancing', 'Arts'),
('Art', 'Arts'),
('Photography', 'Arts'),
('Reading', 'Leisure'),
('Gaming', 'Leisure'),
('Cooking', 'Leisure'),
('Travel', 'Leisure'),
('Movies', 'Leisure'),
('Netflix', 'Leisure'),
('Social Media', 'Technology'),
('Coding', 'Technology'),
('Fashion', 'Lifestyle'),
('Makeup', 'Lifestyle'),
('Hair Styling', 'Lifestyle'),
('Fitness', 'Lifestyle'),
('Yoga', 'Lifestyle'),
('Meditation', 'Lifestyle');

-- Insert sample profile prompts
INSERT INTO profile_prompts (prompt_text, category) VALUES
('My ideal first date is...', 'Dating'),
('I get way too excited about...', 'Personality'),
('My biggest fear is...', 'Personality'),
('My most controversial opinion is...', 'Opinions'),
('I''m looking for someone who...', 'Dating'),
('My friends would describe me as...', 'Personality'),
('My biggest accomplishment is...', 'Achievements'),
('I spend way too much money on...', 'Lifestyle'),
('My favorite way to spend a weekend is...', 'Lifestyle'),
('I''m most attracted to people who...', 'Dating'),
('My biggest pet peeve is...', 'Personality'),
('I''m currently obsessed with...', 'Interests'),
('My love language is...', 'Dating'),
('I''m looking for someone to...', 'Dating'),
('My most used emoji is...', 'Personality');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
