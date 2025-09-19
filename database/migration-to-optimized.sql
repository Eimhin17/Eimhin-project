-- =====================================================
-- Migration Script: Current Schema → Optimized Schema
-- Run this AFTER creating the optimized schema
-- =====================================================

-- Step 1: Backup existing data (if any)
-- This creates backup tables of your current data
CREATE TABLE IF NOT EXISTS users_backup AS SELECT * FROM users;
CREATE TABLE IF NOT EXISTS schools_backup AS SELECT * FROM schools;
CREATE TABLE IF NOT EXISTS interests_backup AS SELECT * FROM interests;
CREATE TABLE IF NOT EXISTS profile_prompts_backup AS SELECT * FROM profile_prompts;

-- Step 2: Update existing users table structure
-- Add new columns to existing users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS identity_verified VARCHAR(20) DEFAULT 'unverified',
ADD COLUMN IF NOT EXISTS current_location POINT,
ADD COLUMN IF NOT EXISTS privacy_level VARCHAR(20) DEFAULT 'public',
ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS sms_notifications_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS terms_of_service_accepted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS age_verification_accepted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS data_processing_consent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false;

-- Step 3: Migrate existing data
-- Update email field from school_email
UPDATE users 
SET email = school_email 
WHERE email IS NULL AND school_email IS NOT NULL;

-- Update verification fields
UPDATE users 
SET email_verified = school_email_verified 
WHERE email_verified IS NULL AND school_email_verified IS NOT NULL;

-- Update relationship_intention from debs_preferences if needed
-- (This depends on your current data structure)

-- Step 4: Create new tables that don't exist yet
-- User Photos table
CREATE TABLE IF NOT EXISTS user_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  moderation_status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for user_photos
CREATE INDEX IF NOT EXISTS idx_user_photos_user_id ON user_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_user_photos_order ON user_photos(user_id, photo_order);
CREATE INDEX IF NOT EXISTS idx_user_photos_moderation ON user_photos(moderation_status);

-- Create unique constraint for primary photo (only one primary per user)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_photos_primary ON user_photos(user_id) WHERE is_primary = true;

-- User Voice Prompts table
CREATE TABLE IF NOT EXISTS user_voice_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL,
  audio_url TEXT NOT NULL,
  duration_seconds INTEGER,
  transcription TEXT,
  moderation_status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  min_age INTEGER DEFAULT 16,
  max_age INTEGER DEFAULT 20,
  max_distance_km INTEGER DEFAULT 50,
  preferred_schools UUID[] DEFAULT '{}',
  min_common_interests INTEGER DEFAULT 1,
  must_have_photos BOOLEAN DEFAULT true,
  must_have_bio BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Legal Documents table
CREATE TABLE IF NOT EXISTS legal_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_type VARCHAR(100) NOT NULL,
  version VARCHAR(20) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  effective_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(document_type, version)
);

-- User Legal Acceptances table
CREATE TABLE IF NOT EXISTS user_legal_acceptances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES legal_documents(id) ON DELETE CASCADE,
  accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  
  UNIQUE(user_id, document_id)
);

-- Content Reports table
CREATE TABLE IF NOT EXISTS content_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_type VARCHAR(50) NOT NULL,
  content_id UUID,
  reason VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  moderator_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Voice Prompts table
CREATE TABLE IF NOT EXISTS voice_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_text TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_required BOOLEAN DEFAULT false,
  max_duration_seconds INTEGER DEFAULT 60,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_user_voice_prompts_user_id ON user_voice_prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_voice_prompts_prompt_id ON user_voice_prompts(prompt_id);
CREATE INDEX IF NOT EXISTS idx_user_voice_prompts_moderation ON user_voice_prompts(moderation_status);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_legal_documents_type ON legal_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_legal_documents_active ON legal_documents(is_active);
CREATE INDEX IF NOT EXISTS idx_legal_documents_effective_date ON legal_documents(effective_date);

CREATE INDEX IF NOT EXISTS idx_user_legal_acceptances_user_id ON user_legal_acceptances(user_id);
CREATE INDEX IF NOT EXISTS idx_user_legal_acceptances_document_id ON user_legal_acceptances(document_id);

CREATE INDEX IF NOT EXISTS idx_content_reports_reporter_id ON content_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_reported_user_id ON content_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_created_at ON content_reports(created_at);

CREATE INDEX IF NOT EXISTS idx_voice_prompts_category ON voice_prompts(category);
CREATE INDEX IF NOT EXISTS idx_voice_prompts_active ON voice_prompts(is_active);

-- Step 6: Insert sample data for new features
-- Insert sample voice prompts
INSERT INTO voice_prompts (prompt_text, category) VALUES
('Tell me about your perfect day', 'Personality'),
('What makes you laugh?', 'Personality'),
('Describe your dream vacation', 'Lifestyle'),
('What''s your biggest goal right now?', 'Goals'),
('Tell me a funny story', 'Personality')
ON CONFLICT DO NOTHING;

-- Insert sample legal documents
INSERT INTO legal_documents (document_type, version, title, content, is_active, effective_date) VALUES
('terms_of_service', '1.0', 'Terms of Service', 'These are the terms of service for DebsMatch...', true, CURRENT_DATE),
('privacy_policy', '1.0', 'Privacy Policy', 'This privacy policy explains how we collect and use your data...', true, CURRENT_DATE),
('age_verification', '1.0', 'Age Verification Consent', 'By accepting this, you confirm you are 16 or older...', true, CURRENT_DATE)
ON CONFLICT DO NOTHING;

-- Step 7: Create triggers for updated_at
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 8: Enable RLS on new tables
ALTER TABLE user_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_voice_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_legal_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_prompts ENABLE ROW LEVEL SECURITY;

-- Step 9: Create basic RLS policies
-- Users can view own photos
CREATE POLICY "Users can view own photos" ON user_photos
  FOR SELECT USING (auth.uid() = user_id);

-- Users can view own voice prompts
CREATE POLICY "Users can view own voice prompts" ON user_voice_prompts
  FOR SELECT USING (auth.uid() = user_id);

-- Users can view own preferences
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

-- Users can view legal documents
CREATE POLICY "Anyone can view legal documents" ON legal_documents
  FOR SELECT USING (true);

-- Users can view own legal acceptances
CREATE POLICY "Users can view own legal acceptances" ON user_legal_acceptances
  FOR SELECT USING (auth.uid() = user_id);

-- Users can view own content reports
CREATE POLICY "Users can view own content reports" ON content_reports
  FOR SELECT USING (auth.uid() = reporter_id);

-- Anyone can view voice prompts
CREATE POLICY "Anyone can view voice prompts" ON voice_prompts
  FOR SELECT USING (true);

-- Step 10: Verify migration
-- Check that all tables exist and have the right structure
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'user_photos', 'user_voice_prompts', 'user_preferences', 'legal_documents', 'voice_prompts')
ORDER BY table_name, ordinal_position;

-- Migration complete!
-- Your database now has the optimized schema with all planned features supported
