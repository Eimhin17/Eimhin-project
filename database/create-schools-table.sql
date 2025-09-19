-- Create Schools Table with User Selection Tracking
-- This table stores all Irish secondary schools with county information and selection counts

-- Drop existing schools table if it exists
DROP TABLE IF EXISTS schools CASCADE;

-- Create the schools table
CREATE TABLE schools (
    school_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_name VARCHAR(255) NOT NULL UNIQUE,
    county VARCHAR(100) NOT NULL,
    select_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_schools_county ON schools(county);
CREATE INDEX idx_schools_select_count ON schools(select_count);
CREATE INDEX idx_schools_name ON schools(school_name);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_schools_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_schools_updated_at_trigger
    BEFORE UPDATE ON schools
    FOR EACH ROW
    EXECUTE FUNCTION update_schools_updated_at();

-- Create a function to increment select count
CREATE OR REPLACE FUNCTION increment_school_select_count(school_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE schools 
    SET select_count = select_count + 1,
        updated_at = NOW()
    WHERE school_id = school_uuid;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON schools TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_school_select_count(UUID) TO anon, authenticated;



























