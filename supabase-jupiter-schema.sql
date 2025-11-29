-- Jupiter Swap Tracking and Fee Distribution Schema
-- Run this SQL in your Supabase SQL editor to create the necessary tables

-- Table: jupiter_swaps
-- Tracks all swaps executed through Jupiter
CREATE TABLE IF NOT EXISTS jupiter_swaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signature TEXT UNIQUE NOT NULL,
  request_id TEXT NOT NULL,

  -- User and post info
  user_wallet TEXT NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  creator_wallet TEXT,

  -- Swap details
  input_mint TEXT NOT NULL,
  output_mint TEXT NOT NULL,
  in_amount BIGINT NOT NULL, -- Amount in lamports/smallest unit
  out_amount BIGINT NOT NULL,

  -- Fee info
  fee_mint TEXT,
  fee_bps INTEGER, -- Basis points
  fee_amount BIGINT, -- Calculated fee in lamports

  -- Metadata
  price_impact DECIMAL(10, 4),
  slippage_bps INTEGER,
  is_gasless BOOLEAN DEFAULT FALSE,
  swap_type TEXT, -- 'aggregator' or 'RFQ'

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE,

  -- Indexes
  INDEX idx_jupiter_swaps_user_wallet (user_wallet),
  INDEX idx_jupiter_swaps_creator_wallet (creator_wallet),
  INDEX idx_jupiter_swaps_post_id (post_id),
  INDEX idx_jupiter_swaps_signature (signature),
  INDEX idx_jupiter_swaps_created_at (created_at DESC)
);

-- Table: jupiter_quotes
-- Tracks quote requests for analytics
CREATE TABLE IF NOT EXISTS jupiter_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id TEXT UNIQUE NOT NULL,

  -- User info
  user_wallet TEXT NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  creator_wallet TEXT,

  -- Quote details
  input_mint TEXT NOT NULL,
  output_mint TEXT NOT NULL,
  amount BIGINT NOT NULL,

  -- Quote result
  out_amount BIGINT,
  fee_mint TEXT,
  fee_bps INTEGER,
  price_impact DECIMAL(10, 4),

  -- Status
  executed BOOLEAN DEFAULT FALSE,
  swap_signature TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  executed_at TIMESTAMP WITH TIME ZONE,

  -- Indexes
  INDEX idx_jupiter_quotes_request_id (request_id),
  INDEX idx_jupiter_quotes_user_wallet (user_wallet),
  INDEX idx_jupiter_quotes_executed (executed),
  INDEX idx_jupiter_quotes_created_at (created_at DESC)
);

-- Table: jupiter_fee_distributions
-- Tracks fees collected and distributed to creators
CREATE TABLE IF NOT EXISTS jupiter_fee_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Creator info
  creator_wallet TEXT NOT NULL,

  -- Fee details
  fee_mint TEXT NOT NULL,
  total_collected BIGINT DEFAULT 0, -- Total fees collected in lamports
  total_distributed BIGINT DEFAULT 0, -- Total fees distributed in lamports
  pending_distribution BIGINT DEFAULT 0, -- Pending fees to distribute

  -- Stats
  swap_count INTEGER DEFAULT 0, -- Number of swaps that generated fees
  last_swap_at TIMESTAMP WITH TIME ZONE,
  last_distribution_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint
  UNIQUE(creator_wallet, fee_mint),

  -- Indexes
  INDEX idx_jupiter_fee_distributions_creator (creator_wallet),
  INDEX idx_jupiter_fee_distributions_pending (pending_distribution DESC)
);

-- Table: jupiter_fee_claims
-- Tracks individual fee claim transactions
CREATE TABLE IF NOT EXISTS jupiter_fee_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Claim details
  creator_wallet TEXT NOT NULL,
  fee_mint TEXT NOT NULL,
  amount BIGINT NOT NULL, -- Amount claimed in lamports

  -- Transaction info
  signature TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'failed'

  -- Related swaps
  swap_ids UUID[], -- Array of swap IDs this claim covers

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE,

  -- Indexes
  INDEX idx_jupiter_fee_claims_creator (creator_wallet),
  INDEX idx_jupiter_fee_claims_signature (signature),
  INDEX idx_jupiter_fee_claims_status (status),
  INDEX idx_jupiter_fee_claims_created_at (created_at DESC)
);

-- Function: Update fee distribution on swap
CREATE OR REPLACE FUNCTION update_fee_distribution_on_swap()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if swap has fees and creator wallet
  IF NEW.fee_amount > 0 AND NEW.creator_wallet IS NOT NULL THEN
    -- Insert or update fee distribution record
    INSERT INTO jupiter_fee_distributions (
      creator_wallet,
      fee_mint,
      total_collected,
      pending_distribution,
      swap_count,
      last_swap_at
    ) VALUES (
      NEW.creator_wallet,
      NEW.fee_mint,
      NEW.fee_amount,
      NEW.fee_amount,
      1,
      NEW.created_at
    )
    ON CONFLICT (creator_wallet, fee_mint) DO UPDATE SET
      total_collected = jupiter_fee_distributions.total_collected + NEW.fee_amount,
      pending_distribution = jupiter_fee_distributions.pending_distribution + NEW.fee_amount,
      swap_count = jupiter_fee_distributions.swap_count + 1,
      last_swap_at = NEW.created_at,
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update fee distribution on new swap
CREATE TRIGGER trigger_update_fee_distribution
  AFTER INSERT ON jupiter_swaps
  FOR EACH ROW
  EXECUTE FUNCTION update_fee_distribution_on_swap();

-- Function: Mark quote as executed
CREATE OR REPLACE FUNCTION mark_quote_executed()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE jupiter_quotes
  SET
    executed = TRUE,
    swap_signature = NEW.signature,
    executed_at = NEW.created_at
  WHERE request_id = NEW.request_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Mark quote as executed when swap is created
CREATE TRIGGER trigger_mark_quote_executed
  AFTER INSERT ON jupiter_swaps
  FOR EACH ROW
  EXECUTE FUNCTION mark_quote_executed();

-- Enable Row Level Security (RLS)
ALTER TABLE jupiter_swaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE jupiter_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE jupiter_fee_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE jupiter_fee_claims ENABLE ROW LEVEL SECURITY;

-- RLS Policies for jupiter_swaps
-- Users can view their own swaps
CREATE POLICY "Users can view their own swaps"
  ON jupiter_swaps FOR SELECT
  USING (user_wallet = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Creators can view swaps for their tokens
CREATE POLICY "Creators can view swaps for their tokens"
  ON jupiter_swaps FOR SELECT
  USING (creator_wallet = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Service role can do everything
CREATE POLICY "Service role can manage all swaps"
  ON jupiter_swaps FOR ALL
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- RLS Policies for jupiter_quotes (similar pattern)
CREATE POLICY "Users can view their own quotes"
  ON jupiter_quotes FOR SELECT
  USING (user_wallet = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Service role can manage all quotes"
  ON jupiter_quotes FOR ALL
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- RLS Policies for jupiter_fee_distributions
CREATE POLICY "Creators can view their own fee distributions"
  ON jupiter_fee_distributions FOR SELECT
  USING (creator_wallet = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Service role can manage all fee distributions"
  ON jupiter_fee_distributions FOR ALL
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- RLS Policies for jupiter_fee_claims
CREATE POLICY "Creators can view their own fee claims"
  ON jupiter_fee_claims FOR SELECT
  USING (creator_wallet = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Service role can manage all fee claims"
  ON jupiter_fee_claims FOR ALL
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- Grant permissions
GRANT SELECT, INSERT ON jupiter_swaps TO authenticated;
GRANT SELECT, INSERT ON jupiter_quotes TO authenticated;
GRANT SELECT ON jupiter_fee_distributions TO authenticated;
GRANT SELECT ON jupiter_fee_claims TO authenticated;

-- Comments for documentation
COMMENT ON TABLE jupiter_swaps IS 'Tracks all swaps executed through Jupiter aggregator';
COMMENT ON TABLE jupiter_quotes IS 'Tracks quote requests for analytics and debugging';
COMMENT ON TABLE jupiter_fee_distributions IS 'Aggregates fees collected per creator and token';
COMMENT ON TABLE jupiter_fee_claims IS 'Tracks individual fee distribution transactions';

-- Create view for creator earnings dashboard
CREATE OR REPLACE VIEW creator_earnings_dashboard AS
SELECT
  jfd.creator_wallet,
  jfd.fee_mint,
  jfd.total_collected,
  jfd.total_distributed,
  jfd.pending_distribution,
  jfd.swap_count,
  jfd.last_swap_at,
  jfd.last_distribution_at,
  u.display_name,
  u.username,
  u.avatar_url
FROM jupiter_fee_distributions jfd
LEFT JOIN users u ON u.wallet_address = jfd.creator_wallet
WHERE jfd.total_collected > 0
ORDER BY jfd.pending_distribution DESC;

-- Grant access to view
GRANT SELECT ON creator_earnings_dashboard TO authenticated;

COMMENT ON VIEW creator_earnings_dashboard IS 'Dashboard view for creator earnings from Jupiter swap fees';
