-- Create prompt analytics table to track prompt popularity
CREATE TABLE IF NOT EXISTS prompt_analytics (
    id BIGSERIAL PRIMARY KEY,
    prompt_text TEXT NOT NULL,
    response TEXT,
    category TEXT NOT NULL,
    selection_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_prompt_analytics_category ON prompt_analytics(category);
CREATE INDEX IF NOT EXISTS idx_prompt_analytics_selection_count ON prompt_analytics(selection_count DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_analytics_prompt_text ON prompt_analytics(prompt_text);
CREATE INDEX IF NOT EXISTS idx_prompt_analytics_response ON prompt_analytics(response);

-- Create unique constraint for prompt_text + response combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_prompt_analytics_unique_prompt_response
ON prompt_analytics(prompt_text, COALESCE(response, ''));

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_prompt_analytics_updated_at ON prompt_analytics;
CREATE TRIGGER update_prompt_analytics_updated_at
    BEFORE UPDATE ON prompt_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert all prompts with initial count of 0 (response will be NULL for initial entries)
INSERT INTO prompt_analytics (prompt_text, response, category, selection_count) VALUES
-- About Me prompts
('I''m the type of person who...', NULL, 'about-me', 0),
('My friends roast me for...', NULL, 'about-me', 0),
('I get unreasonably excited about...', NULL, 'about-me', 0),
('My energy is best described as...', NULL, 'about-me', 0),
('I''m secretly really good at...', NULL, 'about-me', 0),
('People are surprised when they find out I...', NULL, 'about-me', 0),
('My biggest flex is...', NULL, 'about-me', 0),
('I''m working on becoming less...', NULL, 'about-me', 0),
('My vibe check usually says...', NULL, 'about-me', 0),
('I''m lowkey obsessed with...', NULL, 'about-me', 0),
('My friends would say I''m the one who...', NULL, 'about-me', 0),
('I''m that friend who always...', NULL, 'about-me', 0),

-- Personality prompts
('My toxic trait is probably...', NULL, 'personality', 0),
('I''m an introvert/extrovert, but...', NULL, 'personality', 0),
('My love language is definitely...', NULL, 'personality', 0),
('I get my dopamine from...', NULL, 'personality', 0),
('My biggest ick is when people...', NULL, 'personality', 0),
('I''m chaotic good because...', NULL, 'personality', 0),
('My villain origin story would be...', NULL, 'personality', 0),
('I manifest by...', NULL, 'personality', 0),
('My main character moment was...', NULL, 'personality', 0),
('I''m giving off __ energy', NULL, 'personality', 0),
('My personality is 90% __ and 10% __', NULL, 'personality', 0),
('I''m the __ friend in the group', NULL, 'personality', 0),

-- Spicy Takes prompts
('Pineapple on pizza is...', NULL, 'spicy', 0),
('The most overrated thing is...', NULL, 'spicy', 0),
('Hot take: __ is actually amazing', NULL, 'spicy', 0),
('I will die on the hill that...', NULL, 'spicy', 0),
('Everyone''s wrong about...', NULL, 'spicy', 0),
('The worst trend right now is...', NULL, 'spicy', 0),
('I don''t understand why people like...', NULL, 'spicy', 0),
('Unpopular opinion: __ is overrated', NULL, 'spicy', 0),
('I''m judging you if you...', NULL, 'spicy', 0),
('Society would be better if...', NULL, 'spicy', 0),
('The most overpriced thing is...', NULL, 'spicy', 0),
('I refuse to pretend that __ is good', NULL, 'spicy', 0),

-- Deep Thoughts prompts
('I think the meaning of life is...', NULL, 'deep', 0),
('What keeps me up at night is...', NULL, 'deep', 0),
('I believe everyone deserves...', NULL, 'deep', 0),
('The most beautiful thing about humans is...', NULL, 'deep', 0),
('If I could change one thing about the world...', NULL, 'deep', 0),
('The hardest lesson I''ve learned is...', NULL, 'deep', 0),
('I wish people talked more about...', NULL, 'deep', 0),
('My biggest fear for the future is...', NULL, 'deep', 0),
('I find peace in...', NULL, 'deep', 0),
('The question I ask myself most is...', NULL, 'deep', 0),
('I think love is...', NULL, 'deep', 0),
('What I want to be remembered for is...', NULL, 'deep', 0),

-- Chaotic Energy prompts
('I once accidentally...', NULL, 'chaotic', 0),
('My most chaotic 3am thought is...', NULL, 'chaotic', 0),
('I would 100% survive a zombie apocalypse because...', NULL, 'chaotic', 0),
('If I had to fight one celebrity...', NULL, 'chaotic', 0),
('My weirdest flex is...', NULL, 'chaotic', 0),
('I''m banned from __ because...', NULL, 'chaotic', 0),
('My most unhinged midnight snack is...', NULL, 'chaotic', 0),
('I could probably start a cult based on...', NULL, 'chaotic', 0),
('My parallel universe self is definitely...', NULL, 'chaotic', 0),
('I''m convinced I''m the main character because...', NULL, 'chaotic', 0),
('My most chaotic purchase was...', NULL, 'chaotic', 0),
('I would absolutely lose my mind if...', NULL, 'chaotic', 0),

-- Gen Z Things prompts
('My screen time report is embarrassing because...', NULL, 'gen-z', 0),
('I''m chronically online but...', NULL, 'gen-z', 0),
('My For You Page is full of...', NULL, 'gen-z', 0),
('I unironically love __ from the early 2000s', NULL, 'gen-z', 0),
('My biggest millennial trait is...', NULL, 'gen-z', 0),
('I''m too old for __ but I still do it', NULL, 'gen-z', 0),
('My comfort YouTuber is...', NULL, 'gen-z', 0),
('I still can''t believe __ happened in 2020', NULL, 'gen-z', 0),
('My music taste is __ core', NULL, 'gen-z', 0),
('I use __ way too much in conversations', NULL, 'gen-z', 0),
('My phone storage is 90% __', NULL, 'gen-z', 0),
('I''m a walking stereotype because I...', NULL, 'gen-z', 0),

-- College Life prompts
('My major is __ but I really want to do __', NULL, 'college', 0),
('College has taught me that...', NULL, 'college', 0),
('My biggest freshman year mistake was...', NULL, 'college', 0),
('I survive on a diet of...', NULL, 'college', 0),
('My dorm room aesthetic is...', NULL, 'college', 0),
('The worst part about college is...', NULL, 'college', 0),
('I''m procrastinating on __ right now', NULL, 'college', 0),
('My study habits are best described as...', NULL, 'college', 0),
('I chose my major because...', NULL, 'college', 0),
('My professors would describe me as...', NULL, 'college', 0),
('College me vs high school me is...', NULL, 'college', 0),
('I''m paying $50k a year to learn that...', NULL, 'college', 0),

-- Dating & Love prompts
('My idea of a perfect first date is...', NULL, 'dating', 0),
('I''m looking for someone who...', NULL, 'dating', 0),
('My biggest relationship green flag is...', NULL, 'dating', 0),
('Dating me means...', NULL, 'dating', 0),
('I knew my ex wasn''t the one when...', NULL, 'dating', 0),
('My love language in relationships is...', NULL, 'dating', 0),
('I show I care by...', NULL, 'dating', 0),
('My biggest turn-off is...', NULL, 'dating', 0),
('I fall for people who...', NULL, 'dating', 0),
('In relationships, I''m the type to...', NULL, 'dating', 0),
('My ideal relationship dynamic is...', NULL, 'dating', 0),
('I''m ready for someone who can...', NULL, 'dating', 0),

-- Unhinged prompts
('I have an irrational fear of...', NULL, 'random', 0),
('My FBI agent is probably concerned about...', NULL, 'random', 0),
('I could give a TED talk on...', NULL, 'random', 0),
('My most useless superpower would be...', NULL, 'random', 0),
('I''m convinced I''m being Punk''d because...', NULL, 'random', 0),
('My search history would reveal...', NULL, 'random', 0),
('I would absolutely lose a fight against...', NULL, 'random', 0),
('My most random skill is...', NULL, 'random', 0),
('I''m the CEO of...', NULL, 'random', 0),
('I could probably survive off __ alone', NULL, 'random', 0),
('My roman empire is...', NULL, 'random', 0),
('I think about __ way too much', NULL, 'random', 0)

ON CONFLICT (prompt_text, COALESCE(response, '')) DO NOTHING;

-- Create a function to increment prompt selection count and track responses
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

-- Create RLS policies (adjust based on your auth requirements)
ALTER TABLE prompt_analytics ENABLE ROW LEVEL SECURITY;

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

-- Grant necessary permissions to anon role for the increment function
GRANT EXECUTE ON FUNCTION increment_prompt_selection(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION increment_prompt_selection(TEXT, TEXT) TO authenticated;

-- Grant permissions on the table
GRANT INSERT ON prompt_analytics TO anon;
GRANT INSERT ON prompt_analytics TO authenticated;
GRANT UPDATE (selection_count, updated_at) ON prompt_analytics TO anon;
GRANT UPDATE (selection_count, updated_at) ON prompt_analytics TO authenticated;
GRANT SELECT ON prompt_analytics TO anon;
GRANT SELECT ON prompt_analytics TO authenticated;