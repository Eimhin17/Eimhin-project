-- Add County Column to Profiles Table
-- This migration adds a county column to the profiles table for location-based services

-- Add county column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS county VARCHAR(100);

-- Add select_count column to schools table if it doesn't exist
ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS select_count INTEGER DEFAULT 0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_county ON profiles(county);
CREATE INDEX IF NOT EXISTS idx_schools_select_count ON schools(select_count);

-- Create a function to update profile county when school is selected
CREATE OR REPLACE FUNCTION update_profile_county_from_school()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the county in profiles table when school_id is set
    IF NEW.school_id IS NOT NULL THEN
        UPDATE profiles 
        SET county = (
            SELECT county 
            FROM schools 
            WHERE schools.school_id = NEW.school_id
        )
        WHERE profiles.id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update county when school_id changes
DROP TRIGGER IF EXISTS update_profile_county_trigger ON profiles;
CREATE TRIGGER update_profile_county_trigger
    AFTER INSERT OR UPDATE OF school_id ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_county_from_school();

-- Create a function to increment school selection count
CREATE OR REPLACE FUNCTION increment_school_selection_count(school_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE schools 
    SET select_count = COALESCE(select_count, 0) + 1,
        updated_at = NOW()
    WHERE schools.school_id = school_uuid;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION update_profile_county_from_school() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_school_selection_count(UUID) TO anon, authenticated;

-- Update existing profiles with county data if they have a school_id
UPDATE profiles 
SET county = (
    SELECT county 
    FROM schools 
    WHERE schools.school_id = profiles.school_id
)
WHERE profiles.school_id IS NOT NULL 
AND profiles.county IS NULL;

-- Verify the migration
SELECT 
    'Migration completed successfully' as status,
    COUNT(*) as profiles_with_county
FROM profiles 
WHERE county IS NOT NULL;
