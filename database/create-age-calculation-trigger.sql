-- =====================================================
-- AGE CALCULATION TRIGGER
-- Automatically calculates age when date_of_birth changes
-- =====================================================

-- Create function to calculate age
CREATE OR REPLACE FUNCTION calculate_age()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate age from date_of_birth
  NEW.age := EXTRACT(YEAR FROM AGE(CURRENT_DATE, NEW.date_of_birth))::INTEGER;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profiles_new table
CREATE TRIGGER trigger_calculate_age
  BEFORE INSERT OR UPDATE ON profiles_new
  FOR EACH ROW
  EXECUTE FUNCTION calculate_age();

-- Update existing records to calculate their age
UPDATE profiles_new 
SET age = EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth))::INTEGER
WHERE age IS NULL;
