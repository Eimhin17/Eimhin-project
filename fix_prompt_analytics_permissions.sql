-- Fix prompt analytics function overloading issue and permissions
-- Run this script to fix the overloading conflicts and permission issues

-- First, drop the existing function that has overloading conflicts
DROP FUNCTION IF EXISTS increment_prompt_selection(TEXT, TEXT);
DROP FUNCTION IF EXISTS increment_prompt_selection(TEXT);

-- Drop existing policies
DROP POLICY IF EXISTS "Allow anonymous read access to prompt analytics" ON prompt_analytics;
DROP POLICY IF EXISTS "Allow authenticated users to update counters" ON prompt_analytics;
DROP POLICY IF EXISTS "Allow service role full access to prompt analytics" ON prompt_analytics;
DROP POLICY IF EXISTS "Allow public read access to prompt analytics" ON prompt_analytics;
DROP POLICY IF EXISTS "Allow public increment access to prompt analytics" ON prompt_analytics;
DROP POLICY IF EXISTS "Allow public insert access to prompt analytics" ON prompt_analytics;

-- Create separate functions to avoid overloading conflicts

-- Function for incrementing prompt selection only (no response)
CREATE OR REPLACE FUNCTION increment_prompt_selection(prompt_text_param TEXT)
RETURNS void AS $$
BEGIN
    -- Original behavior for prompt selection only (response = NULL)
    UPDATE prompt_analytics
    SET selection_count = selection_count + 1,
        updated_at = NOW()
    WHERE prompt_text = prompt_text_param AND response IS NULL;

    -- If no rows were updated, insert the prompt
    IF NOT FOUND THEN
        INSERT INTO prompt_analytics (prompt_text, category, selection_count)
        VALUES (prompt_text_param, 'unknown', 1);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function for tracking prompt responses (includes both prompt and response)
CREATE OR REPLACE FUNCTION track_prompt_response(prompt_text_param TEXT, response_param TEXT)
RETURNS void AS $$
BEGIN
    -- Create or update a specific prompt+response entry
    -- First, try to update existing entry
    UPDATE prompt_analytics
    SET selection_count = selection_count + 1,
        updated_at = NOW()
    WHERE prompt_text = prompt_text_param AND response = response_param;

    -- If no rows updated, insert new entry
    IF NOT FOUND THEN
        INSERT INTO prompt_analytics (prompt_text, response, category, selection_count)
        VALUES (prompt_text_param, response_param,
                (SELECT category FROM prompt_analytics WHERE prompt_text = prompt_text_param AND response IS NULL LIMIT 1),
                1);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create more permissive policies for analytics tracking

-- Allow anyone to read analytics data (for displaying popular prompts)
CREATE POLICY "Allow public read access to prompt analytics"
ON prompt_analytics FOR SELECT
USING (true);

-- Allow anyone to call the increment function (since it's just analytics)
CREATE POLICY "Allow public increment access to prompt analytics"
ON prompt_analytics FOR UPDATE
USING (true)
WITH CHECK (true);

-- Allow public insert access for new prompt+response combinations
CREATE POLICY "Allow public insert access to prompt analytics"
ON prompt_analytics FOR INSERT
WITH CHECK (true);

-- Allow service role full access for admin operations
CREATE POLICY "Allow service role full access to prompt analytics"
ON prompt_analytics FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Grant execute permissions to both functions
GRANT EXECUTE ON FUNCTION increment_prompt_selection(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION increment_prompt_selection(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION track_prompt_response(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION track_prompt_response(TEXT, TEXT) TO authenticated;

-- Grant necessary table permissions
GRANT INSERT ON prompt_analytics TO anon;
GRANT INSERT ON prompt_analytics TO authenticated;
GRANT UPDATE (selection_count, updated_at) ON prompt_analytics TO anon;
GRANT UPDATE (selection_count, updated_at) ON prompt_analytics TO authenticated;
GRANT SELECT ON prompt_analytics TO anon;
GRANT SELECT ON prompt_analytics TO authenticated;

-- Grant sequence permissions (this was missing and causing the error)
GRANT USAGE, SELECT ON SEQUENCE prompt_analytics_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE prompt_analytics_id_seq TO authenticated;