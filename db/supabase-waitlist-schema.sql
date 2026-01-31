-- Waitlist signups table
CREATE TABLE IF NOT EXISTS waitlist_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  referral_code TEXT UNIQUE NOT NULL,
  referred_by TEXT REFERENCES waitlist_signups(referral_code),
  referral_count INTEGER DEFAULT 0,
  position INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist_signups(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_referral_code ON waitlist_signups(referral_code);
CREATE INDEX IF NOT EXISTS idx_waitlist_referred_by ON waitlist_signups(referred_by);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist_signups(created_at);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update referral count
CREATE OR REPLACE FUNCTION update_referral_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referred_by IS NOT NULL THEN
    UPDATE waitlist_signups
    SET referral_count = referral_count + 1
    WHERE referral_code = NEW.referred_by;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_referral_count
AFTER INSERT ON waitlist_signups
FOR EACH ROW
EXECUTE FUNCTION update_referral_count();

-- Enable Row Level Security
ALTER TABLE waitlist_signups ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert
CREATE POLICY "Anyone can join waitlist"
ON waitlist_signups FOR INSERT
TO public
WITH CHECK (true);

-- Policy: Users can view their own entry
CREATE POLICY "Users can view own entry"
ON waitlist_signups FOR SELECT
TO public
USING (true);

-- Comments
COMMENT ON TABLE waitlist_signups IS 'Waitlist signups with viral referral mechanics';
COMMENT ON COLUMN waitlist_signups.referral_code IS 'Unique code for user to share and move up the list';
COMMENT ON COLUMN waitlist_signups.referred_by IS 'Referral code of person who referred this user';
COMMENT ON COLUMN waitlist_signups.referral_count IS 'Number of people this user has referred';
COMMENT ON COLUMN waitlist_signups.position IS 'Position in waitlist queue';
