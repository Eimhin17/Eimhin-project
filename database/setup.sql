-- DebsMatch Database Setup Script
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE NOT NULL,
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

-- User photos table
CREATE TABLE user_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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

-- User profile prompts table
CREATE TABLE user_profile_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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

-- Swipes table
CREATE TABLE swipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  swiper_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  swiped_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  swipe_direction swipe_direction NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(swiper_id, swiped_user_id)
);

-- Matches table
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  matched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
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

CREATE INDEX idx_user_photos_user_id ON user_photos(user_id);
CREATE INDEX idx_user_photos_is_primary ON user_photos(is_primary);

CREATE INDEX idx_user_interests_user_id ON user_interests(user_id);
CREATE INDEX idx_user_interests_interest_id ON user_interests(interest_id);

CREATE INDEX idx_swipes_swiper_id ON swipes(swiper_id);
CREATE INDEX idx_swipes_swiped_user_id ON swipes(swiped_user_id);
CREATE INDEX idx_swipes_created_at ON swipes(created_at);

CREATE INDEX idx_matches_user1_id ON matches(user1_id);
CREATE INDEX idx_matches_user2_id ON matches(user2_id);
CREATE INDEX idx_matches_is_active ON matches(is_active);

CREATE INDEX idx_messages_match_id ON messages(match_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_is_read ON messages(is_read);

-- Create RLS (Row Level Security) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profile_prompts ENABLE ROW LEVEL SECURITY;
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

-- Swipes policies
CREATE POLICY "Users can view own swipes" ON swipes
  FOR SELECT USING (auth.uid() = swiper_id);

CREATE POLICY "Users can create swipes" ON swipes
  FOR INSERT WITH CHECK (auth.uid() = swiper_id);

-- Matches policies
CREATE POLICY "Users can view own matches" ON matches
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create matches" ON matches
  FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Messages policies
CREATE POLICY "Users can view messages in their matches" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM matches 
      WHERE matches.id = messages.match_id 
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their matches" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM matches 
      WHERE matches.id = messages.match_id 
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
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

CREATE TRIGGER update_user_profile_prompts_updated_at
  BEFORE UPDATE ON user_profile_prompts
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

-- Insert sample interests
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
('Photography', 'Technology'),
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
