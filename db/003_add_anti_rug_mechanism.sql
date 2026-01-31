-- Anti-Rug Mechanism: Add display_name and verification system
-- This allows unique tickers while supporting duplicate display names with verification badges

-- Add new columns to tokens table
ALTER TABLE tokens
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Add new columns to posts table for easier querying (denormalized for performance)
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS token_display_name TEXT,
ADD COLUMN IF NOT EXISTS token_is_verified BOOLEAN DEFAULT false;

-- Create index for display_name lookups (for verification checks)
CREATE INDEX IF NOT EXISTS idx_tokens_display_name ON tokens(display_name);
CREATE INDEX IF NOT EXISTS idx_tokens_verified ON tokens(is_verified) WHERE is_verified = true;

-- Update existing tokens to use symbol as display_name initially
UPDATE tokens
SET display_name = symbol
WHERE display_name IS NULL;

-- Function to check if a display name already exists and mark first as verified
CREATE OR REPLACE FUNCTION check_and_verify_display_name()
RETURNS TRIGGER AS $$
DECLARE
  existing_count INT;
BEGIN
  -- Check if this is the first token with this display_name
  SELECT COUNT(*) INTO existing_count
  FROM tokens
  WHERE LOWER(display_name) = LOWER(NEW.display_name)
  AND id != NEW.id;

  -- If this is the first token with this display_name, mark as verified
  IF existing_count = 0 THEN
    NEW.is_verified = true;
  ELSE
    NEW.is_verified = false;
  END IF;

  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically verify first token with a display name
DROP TRIGGER IF EXISTS verify_token_display_name ON tokens;
CREATE TRIGGER verify_token_display_name
  BEFORE INSERT OR UPDATE OF display_name ON tokens
  FOR EACH ROW
  EXECUTE FUNCTION check_and_verify_display_name();

-- Update the token_leaderboard view to include display_name and verification
DROP VIEW IF EXISTS token_leaderboard;
CREATE OR REPLACE VIEW token_leaderboard AS
SELECT
  t.id,
  t.mint_address,
  t.symbol,
  t.name,
  t.display_name,
  t.is_verified,
  t.image_uri,
  t.creator_wallet,
  t.pool_address,
  t.market_cap,
  t.volume_24h,
  t.volume_total,
  t.holders_count,
  t.trades_count,
  t.created_at,
  p.id as post_id,
  p.content as post_content,
  p.media_urls as post_media,
  u.username as creator_username,
  u.avatar_url as creator_avatar
FROM tokens t
LEFT JOIN posts p ON t.post_id = p.id
LEFT JOIN users u ON t.creator_wallet = u.wallet_address
WHERE t.is_tradable = true
ORDER BY t.market_cap DESC;

-- Update the trending_tokens view to include display_name and verification
DROP VIEW IF EXISTS trending_tokens;
CREATE OR REPLACE VIEW trending_tokens AS
SELECT
  t.id,
  t.mint_address,
  t.symbol,
  t.name,
  t.display_name,
  t.is_verified,
  t.image_uri,
  t.pool_address,
  t.market_cap,
  t.volume_24h,
  t.holders_count,
  t.trades_count,
  t.created_at,
  COUNT(tt.id) as recent_trades_count
FROM tokens t
LEFT JOIN token_trades tt ON t.id = tt.token_id
  AND tt.created_at > NOW() - INTERVAL '1 hour'
WHERE t.is_tradable = true
GROUP BY t.id
ORDER BY recent_trades_count DESC, t.volume_24h DESC
LIMIT 100;

COMMENT ON COLUMN tokens.display_name IS 'User-chosen display name that can be duplicate (e.g., PEPE)';
COMMENT ON COLUMN tokens.is_verified IS 'True if this is the first token with this display_name (official token)';
COMMENT ON COLUMN tokens.symbol IS 'Auto-generated unique ticker (e.g., POST_ABC123_1)';
