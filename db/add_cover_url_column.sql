-- Add cover_url column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN users.cover_url IS 'URL to the user cover/banner image stored in Supabase Storage';

-- Create index for faster lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_users_cover_url ON users(cover_url) WHERE cover_url IS NOT NULL;
