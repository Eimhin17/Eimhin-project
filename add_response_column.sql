-- Add response column to prompt_analytics table
-- This will track what users actually responded to each prompt

-- Add the response column after prompt_text
-- Note: PostgreSQL doesn't support ALTER COLUMN position, so we'll add it and it will appear at the end
-- But we can recreate the table if needed for proper ordering

-- Method 1: Simple ADD COLUMN (response will be at the end)
ALTER TABLE prompt_analytics
ADD COLUMN response TEXT;

-- Method 2: If you want exact column ordering, uncomment and run this instead:
/*
-- Create new table with desired column order
CREATE TABLE prompt_analytics_new (
    id BIGSERIAL PRIMARY KEY,
    prompt_text TEXT NOT NULL,
    response TEXT,
    category TEXT NOT NULL,
    selection_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Copy data from old table
INSERT INTO prompt_analytics_new (id, prompt_text, category, selection_count, created_at, updated_at)
SELECT id, prompt_text, category, selection_count, created_at, updated_at
FROM prompt_analytics;

-- Update sequence to continue from current max ID
SELECT setval('prompt_analytics_new_id_seq', (SELECT MAX(id) FROM prompt_analytics_new));

-- Drop old table and rename new one
DROP TABLE prompt_analytics CASCADE;
ALTER TABLE prompt_analytics_new RENAME TO prompt_analytics;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_prompt_analytics_category ON prompt_analytics(category);
CREATE INDEX IF NOT EXISTS idx_prompt_analytics_selection_count ON prompt_analytics(selection_count DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_analytics_prompt_text ON prompt_analytics(prompt_text);
CREATE UNIQUE INDEX IF NOT EXISTS idx_prompt_analytics_unique_prompt_response ON prompt_analytics(prompt_text, response);

-- Recreate trigger
CREATE TRIGGER update_prompt_analytics_updated_at
    BEFORE UPDATE ON prompt_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update the increment function to handle responses
CREATE OR REPLACE FUNCTION increment_prompt_selection(prompt_text_param TEXT, response_param TEXT DEFAULT NULL)
RETURNS void AS $$
BEGIN
    -- If response is provided, track prompt+response combination
    IF response_param IS NOT NULL THEN
        INSERT INTO prompt_analytics (prompt_text, response, category, selection_count)
        VALUES (prompt_text_param, response_param, 'unknown', 1)
        ON CONFLICT (prompt_text, response) DO UPDATE
        SET selection_count = prompt_analytics.selection_count + 1,
            updated_at = NOW();
    ELSE
        -- Original behavior for prompt selection only
        UPDATE prompt_analytics
        SET selection_count = selection_count + 1,
            updated_at = NOW()
        WHERE prompt_text = prompt_text_param AND response IS NULL;

        -- If no rows were updated, insert the prompt
        IF NOT FOUND THEN
            INSERT INTO prompt_analytics (prompt_text, category, selection_count)
            VALUES (prompt_text_param, 'unknown', 1)
            ON CONFLICT (prompt_text) DO UPDATE
            SET selection_count = prompt_analytics.selection_count + 1,
                updated_at = NOW()
            WHERE prompt_analytics.response IS NULL;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Re-enable RLS
ALTER TABLE prompt_analytics ENABLE ROW LEVEL SECURITY;

-- Recreate policies
CREATE POLICY "Allow public read access to prompt analytics"
ON prompt_analytics FOR SELECT
USING (true);

CREATE POLICY "Allow public increment access to prompt analytics"
ON prompt_analytics FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public insert access to prompt analytics"
ON prompt_analytics FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow service role full access to prompt analytics"
ON prompt_analytics FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Grant permissions
GRANT EXECUTE ON FUNCTION increment_prompt_selection(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION increment_prompt_selection(TEXT, TEXT) TO authenticated;
GRANT INSERT ON prompt_analytics TO anon;
GRANT INSERT ON prompt_analytics TO authenticated;
GRANT UPDATE (selection_count, updated_at) ON prompt_analytics TO anon;
GRANT UPDATE (selection_count, updated_at) ON prompt_analytics TO authenticated;
GRANT SELECT ON prompt_analytics TO anon;
GRANT SELECT ON prompt_analytics TO authenticated;
*/

-- Add index on the new response column for better performance
CREATE INDEX IF NOT EXISTS idx_prompt_analytics_response ON prompt_analytics(response);

-- Update the increment function to optionally handle responses
CREATE OR REPLACE FUNCTION increment_prompt_selection(prompt_text_param TEXT, response_param TEXT DEFAULT NULL)
RETURNS void AS $$
BEGIN
    -- If response is provided, create or update a specific prompt+response entry
    IF response_param IS NOT NULL THEN
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
    ELSE
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
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions for the updated function
GRANT EXECUTE ON FUNCTION increment_prompt_selection(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION increment_prompt_selection(TEXT, TEXT) TO authenticated;
GRANT INSERT ON prompt_analytics TO anon;
GRANT INSERT ON prompt_analytics TO authenticated;