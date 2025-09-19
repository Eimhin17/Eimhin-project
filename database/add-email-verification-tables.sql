-- Add Email Verification Tables for Custom 6-Digit Code System
-- Run this in your Supabase SQL Editor

-- Email verifications table for 6-digit codes
CREATE TABLE IF NOT EXISTS email_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL,
  verification_code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Phone verifications table for SMS codes
CREATE TABLE IF NOT EXISTS phone_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number VARCHAR(15) NOT NULL,
  verification_code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);
CREATE INDEX IF NOT EXISTS idx_email_verifications_code ON email_verifications(verification_code);
CREATE INDEX IF NOT EXISTS idx_email_verifications_expires_at ON email_verifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_email_verifications_is_used ON email_verifications(is_used);

CREATE INDEX IF NOT EXISTS idx_phone_verifications_phone ON phone_verifications(phone_number);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_code ON phone_verifications(verification_code);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_expires_at ON phone_verifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_is_used ON phone_verifications(is_used);

-- Enable RLS on verification tables
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_verifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for email verifications
-- Allow anyone to create email verifications (for signup)
CREATE POLICY "Anyone can create email verifications" ON email_verifications
  FOR INSERT WITH CHECK (true);

-- Allow anyone to read email verifications (for verification)
CREATE POLICY "Anyone can read email verifications" ON email_verifications
  FOR SELECT USING (true);

-- Allow anyone to update email verifications (to mark as used)
CREATE POLICY "Anyone can update email verifications" ON email_verifications
  FOR UPDATE USING (true);

-- RLS policies for phone verifications
-- Allow anyone to create phone verifications (for signup)
CREATE POLICY "Anyone can create phone verifications" ON phone_verifications
  FOR INSERT WITH CHECK (true);

-- Allow anyone to read phone verifications (for verification)
CREATE POLICY "Anyone can read phone verifications" ON phone_verifications
  FOR SELECT USING (true);

-- Allow anyone to update phone verifications (to mark as used)
CREATE POLICY "Anyone can update phone verifications" ON phone_verifications
  FOR UPDATE USING (true);

-- Function to clean up expired verification codes
CREATE OR REPLACE FUNCTION cleanup_expired_verifications()
RETURNS void AS $$
BEGIN
  DELETE FROM email_verifications 
  WHERE expires_at < NOW() AND is_used = FALSE;
  
  DELETE FROM phone_verifications 
  WHERE expires_at < NOW() AND is_used = FALSE;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL ON email_verifications TO anon, authenticated;
GRANT ALL ON phone_verifications TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_verifications() TO anon, authenticated;

-- Insert a test record to verify the table works
INSERT INTO email_verifications (email, verification_code, expires_at) 
VALUES ('test@example.com', '123456', NOW() + INTERVAL '10 minutes');

-- Verify the table was created successfully
SELECT 'Email verification tables created successfully!' as status;
SELECT COUNT(*) as email_verifications_count FROM email_verifications;
SELECT COUNT(*) as phone_verifications_count FROM phone_verifications;
