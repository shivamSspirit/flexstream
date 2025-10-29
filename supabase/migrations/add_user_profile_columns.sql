-- Add all missing profile columns to users table

-- Social media columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS website TEXT;

-- Profile info columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS cover_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add comments
COMMENT ON COLUMN users.twitter IS 'Twitter/X username';
COMMENT ON COLUMN users.instagram IS 'Instagram username';
COMMENT ON COLUMN users.website IS 'Personal website URL';
COMMENT ON COLUMN users.cover_url IS 'URL to cover/banner image';
COMMENT ON COLUMN users.bio IS 'User biography (max 160 characters)';

-- Create indexes for faster lookups (optional)
CREATE INDEX IF NOT EXISTS idx_users_twitter ON users(twitter) WHERE twitter IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_instagram ON users(instagram) WHERE instagram IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_cover_url ON users(cover_url) WHERE cover_url IS NOT NULL;
