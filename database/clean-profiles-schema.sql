-- =====================================================
-- CLEAN PROFILES TABLE SCHEMA
-- Exact column order as requested
-- =====================================================

-- Drop existing profiles table if it exists
DROP TABLE IF EXISTS profiles CASCADE;

-- Create new profiles table with EXACT column order as specified
CREATE TABLE profiles (
  -- Primary Key
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 1. School - school_id, school_name
  school_id UUID REFERENCES schools(id),
  school_name VARCHAR(200),
  
  -- 2. Email - email
  email VARCHAR(255) NOT NULL,
  
  -- 3. Notifications - notifications_enabled (Yes/No)
  notifications_enabled BOOLEAN DEFAULT true,
  
  -- 4. First Name - first_name
  first_name VARCHAR(100) NOT NULL,
  
  -- 5. Last Name - last_name
  last_name VARCHAR(100) NOT NULL,
  
  -- 6. DOB - date_of_birth
  date_of_birth DATE NOT NULL,
  
  -- 7. Age - age (auto-calculated)
  age INTEGER,
  
  -- 8. Gender - gender
  gender gender_type NOT NULL,
  
  -- 9. Bio - bio
  bio TEXT,
  
  -- 10. Agreed to T&C - agreed_to_terms_and_conditions
  agreed_to_terms_and_conditions BOOLEAN DEFAULT false,
  
  -- 11. Match Preferences - match_preferences (JSONB)
  match_preferences JSONB DEFAULT '{}',
  
  -- 12. Looking for (Friends/Dates) - looking_for_friends_or_dates
  looking_for_friends_or_dates VARCHAR(50) DEFAULT 'both',
  
  -- 13. Relationship Status - relationship_status
  relationship_status VARCHAR(50) DEFAULT 'single',
  
  -- 14. Looking for (Debs) - looking_for_debs
  looking_for_debs looking_for_type NOT NULL,
  
  -- 15. Dating Intentions - dating_intentions
  dating_intentions relationship_intention NOT NULL,
  
  -- 16. Interests - interests (TEXT array)
  interests TEXT[] DEFAULT '{}',
  
  -- 17. Photos - photos (TEXT array)
  -- photos column removed - photos are now stored in user_photos table
  
  -- 18. Profile Prompts - profile_prompts (JSONB)
  profile_prompts JSONB DEFAULT '{}',
  
  -- 19. Last Active At - last_active_at
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- System fields (not in the main list)
  status user_status_type DEFAULT 'active',
  onboarding_completed BOOLEAN DEFAULT false,
  profile_completed BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for optimal performance
CREATE INDEX idx_profiles_school_id ON profiles(school_id);
CREATE INDEX idx_profiles_gender ON profiles(gender);
CREATE INDEX idx_profiles_looking_for_debs ON profiles(looking_for_debs);
CREATE INDEX idx_profiles_dating_intentions ON profiles(dating_intentions);
CREATE INDEX idx_profiles_status ON profiles(status);
CREATE INDEX idx_profiles_age ON profiles(age);
CREATE INDEX idx_profiles_last_active ON profiles(last_active_at);
CREATE INDEX idx_profiles_interests ON profiles USING GIN(interests);
-- Photos are now stored in user_photos table, not in profiles.photos

-- Create RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON profiles
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for users based on user_id" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create age calculation trigger
CREATE OR REPLACE FUNCTION calculate_age_from_dob()
RETURNS TRIGGER AS $$
BEGIN
  NEW.age := EXTRACT(YEAR FROM AGE(CURRENT_DATE, NEW.date_of_birth))::INTEGER;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculate_age
  BEFORE INSERT OR UPDATE OF date_of_birth ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION calculate_age_from_dob();
