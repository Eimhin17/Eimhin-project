-- Create table to store available profile prompts
-- Columns must be in this exact order:
-- id, prompt_text, category, selection_count, created_at, updated_at

-- Safe schema setup for Postgres
CREATE TABLE IF NOT EXISTS profile_prompt_definitions (
  id BIGSERIAL PRIMARY KEY,
  prompt_text TEXT NOT NULL,
  category TEXT NOT NULL,
  selection_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_prompt_per_category UNIQUE (prompt_text, category)
);

-- Keep updated_at fresh on changes
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_updated_at ON profile_prompt_definitions;
CREATE TRIGGER trg_set_updated_at
BEFORE UPDATE ON profile_prompt_definitions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Increment selection by prompt_text (used by app)
CREATE OR REPLACE FUNCTION increment_profile_prompt_selection_by_text(prompt_text_param TEXT)
RETURNS INTEGER AS $$
DECLARE
  affected INTEGER;
BEGIN
  UPDATE profile_prompt_definitions
  SET selection_count = selection_count + 1,
      updated_at = NOW()
  WHERE prompt_text = prompt_text_param;

  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$ LANGUAGE plpgsql;

-- Helper to increment selection count when a prompt is selected
CREATE OR REPLACE FUNCTION increment_profile_prompt_selection(p_id BIGINT)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE profile_prompt_definitions
  SET selection_count = selection_count + 1
  WHERE id = p_id
  RETURNING selection_count INTO new_count;

  RETURN new_count;
END;
$$ LANGUAGE plpgsql;

-- Optional: pick a random prompt by category and increment its selection count
-- Returns the chosen row after incrementing selection_count
CREATE OR REPLACE FUNCTION pick_random_profile_prompt(p_category TEXT)
RETURNS TABLE (id BIGINT, prompt_text TEXT, category TEXT, selection_count INTEGER, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ) AS $$
DECLARE
  v_id BIGINT;
BEGIN
  SELECT ppd.id
  INTO v_id
  FROM profile_prompt_definitions ppd
  WHERE ppd.category = p_category
  ORDER BY RANDOM()
  LIMIT 1;

  IF v_id IS NULL THEN
    RETURN;
  END IF;

  PERFORM increment_profile_prompt_selection(v_id);

  RETURN QUERY
  SELECT * FROM profile_prompt_definitions WHERE id = v_id;
END;
$$ LANGUAGE plpgsql;

-- Grants for RPC functions (public roles)
GRANT EXECUTE ON FUNCTION increment_profile_prompt_selection_by_text(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION increment_profile_prompt_selection_by_text(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_profile_prompt_selection(BIGINT) TO anon;
GRANT EXECUTE ON FUNCTION increment_profile_prompt_selection(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION pick_random_profile_prompt(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION pick_random_profile_prompt(TEXT) TO authenticated;

-- Seed data for the new prompts and sections (id will auto-generate)
-- Categories: vibes, hot-takes, first-date, green-flags, low-key, habits, iykyk, goals
INSERT INTO profile_prompt_definitions (prompt_text, category)
VALUES
  -- vibes
  ('My energy in three words: ...', 'vibes'),
  ('Perfect Sunday feels like ...', 'vibes'),
  ('Song that flips my mood: ...', 'vibes'),
  ('People say I give off ... vibes', 'vibes'),
  ('The group chat calls me the ...', 'vibes'),
  ('The most “me” thing I do is ...', 'vibes'),
  ('Three things that calm me: ...', 'vibes'),
  ('Peak chaos moment: ...', 'vibes'),
  ('I light up when ...', 'vibes'),
  ('My comfort watch is ...', 'vibes'),
  ('I laugh hardest at ...', 'vibes'),
  ('My happy place: ...', 'vibes'),

  -- hot-takes
  ('Pineapple on pizza: ...', 'hot-takes'),
  ('Most overrated app: ...', 'hot-takes'),
  ('Unpopular opinion: ...', 'hot-takes'),
  ('The best era of music was ...', 'hot-takes'),
  ('Biggest ick in the wild: ...', 'hot-takes'),
  ('Jeans are just ...', 'hot-takes'),
  ('The internet needs less ...', 'hot-takes'),
  ('I will die on this hill: ...', 'hot-takes'),
  ('Most overpriced thing: ...', 'hot-takes'),
  ('We should normalize ...', 'hot-takes'),

  -- first-date
  ('Ideal first date: ...', 'first-date'),
  ('We’ll get along if ...', 'first-date'),
  ('I’ll pick the place if ...', 'first-date'),
  ('Go-to coffee order: ...', 'first-date'),
  ('I’m in if the plan includes ...', 'first-date'),
  ('Best low‑effort plan: ...', 'first-date'),
  ('Worst date idea: ...', 'first-date'),
  ('I’m most myself when ...', 'first-date'),
  ('If you bring __, I’ll bring __', 'first-date'),
  ('Two truths and a lie: ...', 'first-date'),

  -- green-flags
  ('Green flag I look for: ...', 'green-flags'),
  ('I show up by ...', 'green-flags'),
  ('I’m consistent about ...', 'green-flags'),
  ('A small thing that means a lot: ...', 'green-flags'),
  ('Best kind of communication is ...', 'green-flags'),
  ('I feel cared for when ...', 'green-flags'),
  ('My friends trust me with ...', 'green-flags'),
  ('I appreciate people who ...', 'green-flags'),
  ('The bare minimum is ...', 'green-flags'),
  ('Acts of service I do: ...', 'green-flags'),

  -- low-key
  ('Low‑key talent: ...', 'low-key'),
  ('Oddly specific joy: ...', 'low-key'),
  ('Most used emoji: ...', 'low-key'),
  ('A smell I love: ...', 'low-key'),
  ('Hidden playlist I overplay: ...', 'low-key'),
  ('My sleep schedule is ...', 'low-key'),
  ('Snack I always have around: ...', 'low-key'),
  ('I collect ... for no reason', 'low-key'),
  ('I’m weirdly good at ...', 'low-key'),
  ('Favourite tiny luxury: ...', 'low-key'),

  -- habits
  ('Recently obsessed with ...', 'habits'),
  ('If I disappear, I’m probably ...', 'habits'),
  ('Weekend ritual: ...', 'habits'),
  ('Sport I’ll always watch: ...', 'habits'),
  ('Creative outlet: ...', 'habits'),
  ('Current hyper‑fixation: ...', 'habits'),
  ('I lose track of time doing ...', 'habits'),
  ('Best way to reset: ...', 'habits'),
  ('I never skip ...', 'habits'),
  ('I’m learning ...', 'habits'),

  -- iykyk
  ('This reference lives rent‑free: ...', 'iykyk'),
  ('Underrated show: ...', 'iykyk'),
  ('Meme I quote too much: ...', 'iykyk'),
  ('My Roman Empire is ...', 'iykyk'),
  ('Niche community I’m in: ...', 'iykyk'),
  ('Comfort video: ...', 'iykyk'),
  ('This line always hits: ...', 'iykyk'),
  ('Inside joke with myself: ...', 'iykyk'),
  ('IYKYK spot in my city: ...', 'iykyk'),
  ('Something only locals know: ...', 'iykyk'),

  -- goals
  ('This year I want to ...', 'goals'),
  ('Skills I’m learning: ...', 'goals'),
  ('City I want to explore: ...', 'goals'),
  ('What motivates me: ...', 'goals'),
  ('Dream collaboration: ...', 'goals'),
  ('I measure success by ...', 'goals'),
  ('I’m proud that I ...', 'goals'),
  ('Where I’m headed next: ...', 'goals'),
  ('Habit I’m building: ...', 'goals'),
  ('If fear wasn’t real, I’d ...', 'goals')
ON CONFLICT DO NOTHING;

-- Usage examples:
-- 1) Increment when app records a selection for id 42
--    SELECT increment_profile_prompt_selection(42);
-- 2) Pick a random prompt from a category and auto-increment its counter
--    SELECT * FROM pick_random_profile_prompt('vibes');
