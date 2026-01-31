-- Add creator coin fields to users table

-- Creator coin activation flag
ALTER TABLE users ADD COLUMN IF NOT EXISTS creator_coin_enabled BOOLEAN DEFAULT FALSE;

-- Creator coin token details
ALTER TABLE users ADD COLUMN IF NOT EXISTS creator_coin_mint TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS creator_coin_pool TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS creator_coin_bonding_curve TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS creator_coin_metadata_uri TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS creator_coin_creation_signature TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS creator_coin_created_at TIMESTAMP WITH TIME ZONE;

-- Add comments
COMMENT ON COLUMN users.creator_coin_enabled IS 'Whether the creator has activated their profile-level coin';
COMMENT ON COLUMN users.creator_coin_mint IS 'Token mint address for creator coin';
COMMENT ON COLUMN users.creator_coin_pool IS 'Meteora DBC pool address for creator coin';
COMMENT ON COLUMN users.creator_coin_bonding_curve IS 'Bonding curve address for creator coin';
COMMENT ON COLUMN users.creator_coin_metadata_uri IS 'Metadata URI for creator coin';
COMMENT ON COLUMN users.creator_coin_creation_signature IS 'Transaction signature for creator coin creation';
COMMENT ON COLUMN users.creator_coin_created_at IS 'Timestamp when creator coin was activated';

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_creator_coin_enabled ON users(creator_coin_enabled) WHERE creator_coin_enabled = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_creator_coin_mint ON users(creator_coin_mint) WHERE creator_coin_mint IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_creator_coin_pool ON users(creator_coin_pool) WHERE creator_coin_pool IS NOT NULL;
