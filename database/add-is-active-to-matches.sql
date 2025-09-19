-- =====================================================
-- ADD IS_ACTIVE COLUMN TO MATCHES TABLE
-- Run this if you want to add the is_active column
-- =====================================================

-- Add is_active column to matches table
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_matches_is_active ON matches(is_active);

-- Update existing matches to be active
UPDATE matches SET is_active = true WHERE is_active IS NULL;
