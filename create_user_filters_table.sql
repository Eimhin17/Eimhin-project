-- Create user_filters table to store filter preferences
-- This table is private and users can only access their own filter settings

-- Create the user_filters table
CREATE TABLE IF NOT EXISTS user_filters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    username TEXT,

    -- School filters
    selected_schools TEXT[] DEFAULT ARRAY[]::TEXT[],
    blocked_schools TEXT[] DEFAULT ARRAY[]::TEXT[],
    school_search_query TEXT DEFAULT '',

    -- Location filters
    selected_counties TEXT[] DEFAULT ARRAY[]::TEXT[],

    -- Demographics filters
    selected_genders TEXT[] DEFAULT ARRAY[]::TEXT[],

    -- Preferences filters
    selected_looking_for TEXT[] DEFAULT ARRAY[]::TEXT[],
    min_common_interests INTEGER DEFAULT 0,

    -- Dating preferences filters
    selected_dating_intentions TEXT[] DEFAULT ARRAY[]::TEXT[],
    selected_relationship_statuses TEXT[] DEFAULT ARRAY[]::TEXT[],

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure one filter record per user
    CONSTRAINT unique_user_filters UNIQUE (user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_filters_user_id ON user_filters(user_id);
CREATE INDEX IF NOT EXISTS idx_user_filters_updated_at ON user_filters(updated_at);

-- Enable Row Level Security
ALTER TABLE user_filters ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own filter settings" ON user_filters;
DROP POLICY IF EXISTS "Users can insert own filter settings" ON user_filters;
DROP POLICY IF EXISTS "Users can update own filter settings" ON user_filters;
DROP POLICY IF EXISTS "Users can delete own filter settings" ON user_filters;

-- RLS Policies - Users can only access their own filter settings
CREATE POLICY "Users can view own filter settings"
    ON user_filters FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own filter settings"
    ON user_filters FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own filter settings"
    ON user_filters FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own filter settings"
    ON user_filters FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_filters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_user_filters_updated_at_trigger ON user_filters;
CREATE TRIGGER update_user_filters_updated_at_trigger
    BEFORE UPDATE ON user_filters
    FOR EACH ROW
    EXECUTE FUNCTION update_user_filters_updated_at();

-- Grant necessary permissions (if using service role)
-- These are typically handled by Supabase automatically, but included for completeness
GRANT ALL ON user_filters TO authenticated;
GRANT ALL ON user_filters TO service_role;

-- Insert default filter settings for existing users (optional)
-- Uncomment the following if you want to create default filter records for existing users
/*
INSERT INTO user_filters (user_id, username, blocked_schools)
SELECT id, username, blocked_schools FROM profiles
WHERE id NOT IN (SELECT user_id FROM user_filters)
ON CONFLICT (user_id) DO NOTHING;
*/

-- Add helpful comments
COMMENT ON TABLE user_filters IS 'Stores user filter preferences for profile matching';
COMMENT ON COLUMN user_filters.id IS 'Primary key UUID';
COMMENT ON COLUMN user_filters.user_id IS 'References the user in profiles table';
COMMENT ON COLUMN user_filters.username IS 'Username for easier identification';
COMMENT ON COLUMN user_filters.selected_schools IS 'Array of school names user wants to see';
COMMENT ON COLUMN user_filters.blocked_schools IS 'Array of school names user wants to block';
COMMENT ON COLUMN user_filters.school_search_query IS 'Search query for school filtering';
COMMENT ON COLUMN user_filters.selected_counties IS 'Array of county names user wants to see';
COMMENT ON COLUMN user_filters.selected_genders IS 'Array of gender preferences (men, women, everyone)';
COMMENT ON COLUMN user_filters.selected_looking_for IS 'Array of what user is looking for (swaps, go-to-debs, bring-to-debs)';
COMMENT ON COLUMN user_filters.min_common_interests IS 'Minimum number of shared interests required';
COMMENT ON COLUMN user_filters.selected_dating_intentions IS 'Array of dating intention preferences';
COMMENT ON COLUMN user_filters.selected_relationship_statuses IS 'Array of relationship status preferences';