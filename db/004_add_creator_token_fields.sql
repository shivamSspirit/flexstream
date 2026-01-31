-- Add creator token fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS creator_token_mint TEXT,
ADD COLUMN IF NOT EXISTS creator_activated BOOLEAN DEFAULT false;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_creator_token ON users(creator_token_mint);
CREATE INDEX IF NOT EXISTS idx_users_creator_activated ON users(creator_activated) WHERE creator_activated = true;

-- Add comments for documentation
COMMENT ON COLUMN users.creator_token_mint IS 'Mint address of the creator''s personal token (launched via activate)';
COMMENT ON COLUMN users.creator_activated IS 'True if creator has activated and launched their creator token';
