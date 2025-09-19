-- =====================================================
-- MIGRATION SCRIPT: Current Profiles → Redesigned Profiles
-- =====================================================

-- Step 1: Create the new table (without dropping the old one yet)
CREATE TABLE IF NOT EXISTS profiles_new (
  -- Primary Key
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 1. School Information
  school_id UUID REFERENCES schools(id),
  school_name VARCHAR(200),
  
  -- 2. Contact Information  
  email VARCHAR(255) NOT NULL,
  
  -- 3. Notification Preferences
  notifications_enabled BOOLEAN DEFAULT true,
  
  -- 4. Basic Personal Information
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE NOT NULL,
  age INTEGER,
  gender gender_type NOT NULL,
  
  -- 5. Profile Content
  bio TEXT,
  
  -- 6. Legal Compliance
  agreed_to_terms_and_conditions BOOLEAN DEFAULT false,
  
  -- 7. Match Preferences
  match_preferences JSONB,
  
  -- 8. Relationship Preferences
  looking_for_friends_or_dates VARCHAR(50),
  relationship_status VARCHAR(50),
  looking_for_debs looking_for_type NOT NULL,
  dating_intentions relationship_intention NOT NULL,
  
  -- 9. Interests and Content
  interests TEXT[],
  -- photos column removed - photos are now stored in user_photos table
  profile_prompts JSONB,
  
  -- 10. Activity Tracking
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  account_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 11. System Fields
  status user_status_type DEFAULT 'active',
  onboarding_completed BOOLEAN DEFAULT false,
  profile_completed BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Migrate existing data
INSERT INTO profiles_new (
  id,
  school_id,
  school_name,
  email,
  notifications_enabled,
  first_name,
  last_name,
  date_of_birth,
  gender,
  bio,
  agreed_to_terms_and_conditions,
  match_preferences,
  looking_for_friends_or_dates,
  relationship_status,
  looking_for_debs,
  dating_intentions,
  interests,
  photos,
  profile_prompts,
  last_active_at,
  account_created_at,
  status,
  onboarding_completed,
  profile_completed,
  updated_at
)
SELECT 
  p.id,
  p.school_id,
  s.name as school_name,
  COALESCE(p.email, au.email) as email,
  COALESCE(p.push_notifications_enabled, true) as notifications_enabled,
  p.first_name,
  p.last_name,
  p.date_of_birth,
  EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.date_of_birth))::INTEGER as age,
  p.gender,
  p.bio,
  COALESCE(p.terms_of_service_accepted, false) as agreed_to_terms_and_conditions,
  '{}'::jsonb as match_preferences, -- Empty for now
  'both' as looking_for_friends_or_dates, -- Default value
  'single' as relationship_status, -- Default value
  p.looking_for as looking_for_debs,
  p.relationship_intention as dating_intentions,
  ARRAY[]::TEXT[] as interests, -- Empty for now
  ARRAY[]::TEXT[] as photos, -- Empty for now
  '{}'::jsonb as profile_prompts, -- Empty for now
  COALESCE(p.last_active, p.created_at) as last_active_at,
  p.created_at as account_created_at,
  COALESCE(p.status, 'active'::user_status_type) as status,
  COALESCE(p.onboarding_completed, false) as onboarding_completed,
  COALESCE(p.profile_completed, false) as profile_completed,
  p.updated_at
FROM profiles p
LEFT JOIN schools s ON p.school_id = s.id
LEFT JOIN auth.users au ON p.id = au.id;

-- Step 3: Create indexes
CREATE INDEX idx_profiles_new_school_id ON profiles_new(school_id);
CREATE INDEX idx_profiles_new_gender ON profiles_new(gender);
CREATE INDEX idx_profiles_new_looking_for_debs ON profiles_new(looking_for_debs);
CREATE INDEX idx_profiles_new_dating_intentions ON profiles_new(dating_intentions);
CREATE INDEX idx_profiles_new_status ON profiles_new(status);
CREATE INDEX idx_profiles_new_age ON profiles_new(age);
CREATE INDEX idx_profiles_new_last_active ON profiles_new(last_active_at);
CREATE INDEX idx_profiles_new_interests ON profiles_new USING GIN(interests);
CREATE INDEX idx_profiles_new_photos ON profiles_new USING GIN(photos);

-- Step 4: Set up RLS
ALTER TABLE profiles_new ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON profiles_new
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON profiles_new
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for users based on user_id" ON profiles_new
  FOR UPDATE USING (auth.uid() = id);

-- Step 5: Verify migration
SELECT 
  'Original profiles count' as table_name, 
  COUNT(*) as count 
FROM profiles
UNION ALL
SELECT 
  'New profiles count' as table_name, 
  COUNT(*) as count 
FROM profiles_new;

-- Step 6: Show sample of migrated data
SELECT 
  id,
  first_name,
  last_name,
  email,
  school_name,
  gender,
  looking_for_debs,
  dating_intentions,
  status,
  onboarding_completed
FROM profiles_new
LIMIT 5;
