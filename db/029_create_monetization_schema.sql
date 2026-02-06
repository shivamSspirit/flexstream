-- ============================================================================
-- MONETIZATION SCHEMA - Creator Revenue & Platform Fees
-- ============================================================================
-- Purpose: Track creator earnings, platform fees, and revenue share rules
-- Part of DB-FLEX-ARC-RECOMMENDED.md Phase 3 implementation
-- ============================================================================

-- ============================================================================
-- 1. Creator Revenue Table
-- Tracks all revenue earned by creators
-- ============================================================================

CREATE TABLE IF NOT EXISTS creator_revenue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    creator_wallet TEXT NOT NULL,

    -- Revenue source
    source_type TEXT NOT NULL CHECK (source_type IN (
        'trading_fee',        -- % of fees from trades on creator's tokens
        'token_launch_fee',   -- one-time fee from post token creation
        'tip',                -- direct tips from fans
        'prediction_win',     -- prediction market winnings
        'referral_bonus',     -- referral rewards
        'creator_token_trade' -- trades on creator's personal token
    )),

    -- Amounts
    amount_sol DECIMAL(20, 9) NOT NULL DEFAULT 0,
    amount_usd DECIMAL(20, 6),
    fee_percentage DECIMAL(5, 2),  -- what % the creator got

    -- References
    token_mint TEXT,                -- which token generated this
    trade_id UUID,                  -- reference to specific trade
    post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
    tx_signature TEXT,              -- on-chain proof

    -- Status
    status TEXT NOT NULL DEFAULT 'earned' CHECK (status IN (
        'earned',     -- recorded but not yet claimable
        'claimable',  -- available for withdrawal
        'claimed',    -- withdrawn to wallet
        'failed'      -- claim transaction failed
    )),
    claimed_at TIMESTAMPTZ,
    claim_signature TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for fast revenue queries
CREATE INDEX IF NOT EXISTS idx_creator_revenue_creator ON creator_revenue(creator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_creator_revenue_wallet ON creator_revenue(creator_wallet);
CREATE INDEX IF NOT EXISTS idx_creator_revenue_source ON creator_revenue(source_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_creator_revenue_status ON creator_revenue(status) WHERE status = 'claimable';
CREATE INDEX IF NOT EXISTS idx_creator_revenue_token ON creator_revenue(token_mint);

-- ============================================================================
-- 2. Platform Fees Table
-- Tracks all fees collected by the platform
-- ============================================================================

CREATE TABLE IF NOT EXISTS platform_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Fee source
    fee_type TEXT NOT NULL CHECK (fee_type IN (
        'token_creation',     -- Meteora DBC creation fee (~$3)
        'trading_commission', -- % of each trade
        'withdrawal_fee',     -- fee on SOL withdrawals
        'premium_feature',    -- paid features
        'prediction_rake'     -- % of prediction market pot
    )),

    -- Amounts
    gross_amount_sol DECIMAL(20, 9) NOT NULL,
    creator_share_sol DECIMAL(20, 9) DEFAULT 0,   -- portion to creator
    platform_share_sol DECIMAL(20, 9) DEFAULT 0,  -- portion retained
    creator_share_pct DECIMAL(5, 2),              -- creator's percentage

    -- References
    creator_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    token_mint TEXT,
    trade_id UUID,
    tx_signature TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_fees_type ON platform_fees(fee_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_fees_created ON platform_fees(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_fees_creator ON platform_fees(creator_id);

-- ============================================================================
-- 3. Revenue Share Rules Table
-- Configurable revenue split percentages
-- ============================================================================

CREATE TABLE IF NOT EXISTS revenue_share_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- What this rule applies to
    rule_type TEXT NOT NULL CHECK (rule_type IN (
        'default',            -- platform-wide default
        'creator_tier',       -- based on creator tier (bronze/silver/gold/diamond)
        'token_specific',     -- custom rule for specific token
        'promotional'         -- temporary promotional rate
    )),

    -- Conditions
    creator_tier TEXT,       -- applies to this tier
    token_mint TEXT,         -- applies to this token
    min_volume_sol DECIMAL,  -- minimum volume to qualify

    -- Split percentages (must sum to 100)
    creator_pct DECIMAL(5, 2) NOT NULL DEFAULT 70.00,  -- creator gets 70%
    platform_pct DECIMAL(5, 2) NOT NULL DEFAULT 25.00, -- platform gets 25%
    referrer_pct DECIMAL(5, 2) NOT NULL DEFAULT 5.00,  -- referrer gets 5%

    -- Validity
    active BOOLEAN NOT NULL DEFAULT true,
    starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ends_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT pct_sum_check CHECK (creator_pct + platform_pct + referrer_pct = 100.00)
);

CREATE INDEX IF NOT EXISTS idx_revenue_rules_active ON revenue_share_rules(active, rule_type);
CREATE INDEX IF NOT EXISTS idx_revenue_rules_tier ON revenue_share_rules(creator_tier) WHERE creator_tier IS NOT NULL;

-- ============================================================================
-- 4. Creator Earnings Dashboard View
-- Aggregated view for creator earnings display
-- ============================================================================

CREATE OR REPLACE VIEW creator_earnings_dashboard AS
SELECT
    u.id AS creator_id,
    u.wallet_address,
    u.username,
    u.display_name,
    u.success_tier,

    -- Lifetime earnings
    COALESCE(SUM(cr.amount_sol), 0) AS total_earned_sol,
    COALESCE(SUM(cr.amount_usd), 0) AS total_earned_usd,

    -- Claimable balance
    COALESCE(SUM(cr.amount_sol) FILTER (WHERE cr.status = 'claimable'), 0) AS claimable_sol,

    -- Earnings by source
    COALESCE(SUM(cr.amount_sol) FILTER (WHERE cr.source_type = 'trading_fee'), 0) AS trading_fee_earnings,
    COALESCE(SUM(cr.amount_sol) FILTER (WHERE cr.source_type = 'tip'), 0) AS tip_earnings,
    COALESCE(SUM(cr.amount_sol) FILTER (WHERE cr.source_type = 'creator_token_trade'), 0) AS creator_token_earnings,
    COALESCE(SUM(cr.amount_sol) FILTER (WHERE cr.source_type = 'referral_bonus'), 0) AS referral_earnings,

    -- Time-based
    COALESCE(SUM(cr.amount_sol) FILTER (WHERE cr.created_at > now() - interval '24 hours'), 0) AS earned_24h,
    COALESCE(SUM(cr.amount_sol) FILTER (WHERE cr.created_at > now() - interval '7 days'), 0) AS earned_7d,
    COALESCE(SUM(cr.amount_sol) FILTER (WHERE cr.created_at > now() - interval '30 days'), 0) AS earned_30d,

    -- Token stats
    COUNT(DISTINCT cr.token_mint) AS tokens_earning_revenue,
    COUNT(cr.id) AS total_transactions

FROM users u
LEFT JOIN creator_revenue cr ON cr.creator_id = u.id
WHERE u.creator_coin_enabled = true OR EXISTS (
    SELECT 1 FROM tokens t WHERE t.creator_wallet = u.wallet_address
)
GROUP BY u.id, u.wallet_address, u.username, u.display_name, u.success_tier;

-- ============================================================================
-- 5. Insert Default Revenue Share Rules
-- ============================================================================

INSERT INTO revenue_share_rules (rule_type, creator_pct, platform_pct, referrer_pct)
VALUES ('default', 70.00, 25.00, 5.00)
ON CONFLICT DO NOTHING;

-- Tier-based rules (better rates for higher tiers)
INSERT INTO revenue_share_rules (rule_type, creator_tier, creator_pct, platform_pct, referrer_pct)
VALUES
    ('creator_tier', 'bronze', 70.00, 25.00, 5.00),
    ('creator_tier', 'silver', 75.00, 20.00, 5.00),
    ('creator_tier', 'gold', 80.00, 15.00, 5.00),
    ('creator_tier', 'diamond', 85.00, 10.00, 5.00)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 6. Row Level Security
-- ============================================================================

ALTER TABLE creator_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_share_rules ENABLE ROW LEVEL SECURITY;

-- Creator revenue: creators can view their own, admins can view all
CREATE POLICY "Creators can view own revenue"
    ON creator_revenue FOR SELECT
    USING (creator_wallet = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Service role full access to creator_revenue"
    ON creator_revenue FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Platform fees: only service role can access
CREATE POLICY "Service role full access to platform_fees"
    ON platform_fees FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Revenue share rules: public read, service role write
CREATE POLICY "Revenue rules are publicly readable"
    ON revenue_share_rules FOR SELECT
    USING (active = true);

CREATE POLICY "Service role full access to revenue_rules"
    ON revenue_share_rules FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- 7. Helper Functions
-- ============================================================================

-- Function to get applicable revenue share for a creator
CREATE OR REPLACE FUNCTION get_revenue_share(
    p_creator_id TEXT,
    p_token_mint TEXT DEFAULT NULL
) RETURNS TABLE (
    creator_pct DECIMAL,
    platform_pct DECIMAL,
    referrer_pct DECIMAL,
    rule_type TEXT
) AS $$
DECLARE
    v_creator_tier TEXT;
BEGIN
    -- Get creator tier
    SELECT success_tier INTO v_creator_tier
    FROM users WHERE id = p_creator_id;

    -- Priority: token_specific > creator_tier > default
    RETURN QUERY
    SELECT
        r.creator_pct,
        r.platform_pct,
        r.referrer_pct,
        r.rule_type
    FROM revenue_share_rules r
    WHERE r.active = true
      AND (r.ends_at IS NULL OR r.ends_at > now())
      AND (
          (r.rule_type = 'token_specific' AND r.token_mint = p_token_mint)
          OR (r.rule_type = 'creator_tier' AND r.creator_tier = v_creator_tier)
          OR r.rule_type = 'default'
      )
    ORDER BY
        CASE r.rule_type
            WHEN 'token_specific' THEN 1
            WHEN 'creator_tier' THEN 2
            ELSE 3
        END
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to record creator revenue from a trade
CREATE OR REPLACE FUNCTION record_trade_revenue(
    p_creator_id TEXT,
    p_creator_wallet TEXT,
    p_token_mint TEXT,
    p_trade_id UUID,
    p_gross_fee_sol DECIMAL,
    p_tx_signature TEXT
) RETURNS UUID AS $$
DECLARE
    v_share RECORD;
    v_creator_amount DECIMAL;
    v_platform_amount DECIMAL;
    v_revenue_id UUID;
BEGIN
    -- Get revenue share percentages
    SELECT * INTO v_share FROM get_revenue_share(p_creator_id, p_token_mint);

    -- Calculate amounts
    v_creator_amount := p_gross_fee_sol * (v_share.creator_pct / 100);
    v_platform_amount := p_gross_fee_sol * (v_share.platform_pct / 100);

    -- Insert creator revenue
    INSERT INTO creator_revenue (
        creator_id, creator_wallet, source_type, amount_sol,
        fee_percentage, token_mint, trade_id, tx_signature, status
    ) VALUES (
        p_creator_id, p_creator_wallet, 'trading_fee', v_creator_amount,
        v_share.creator_pct, p_token_mint, p_trade_id, p_tx_signature, 'claimable'
    ) RETURNING id INTO v_revenue_id;

    -- Insert platform fee record
    INSERT INTO platform_fees (
        fee_type, gross_amount_sol, creator_share_sol, platform_share_sol,
        creator_share_pct, creator_id, token_mint, trade_id, tx_signature
    ) VALUES (
        'trading_commission', p_gross_fee_sol, v_creator_amount, v_platform_amount,
        v_share.creator_pct, p_creator_id, p_token_mint, p_trade_id, p_tx_signature
    );

    RETURN v_revenue_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. Comments
-- ============================================================================

COMMENT ON TABLE creator_revenue IS 'Tracks all revenue earned by creators from various sources';
COMMENT ON TABLE platform_fees IS 'Tracks all fees collected by the platform';
COMMENT ON TABLE revenue_share_rules IS 'Configurable revenue split percentages by tier or token';
COMMENT ON VIEW creator_earnings_dashboard IS 'Aggregated view for displaying creator earnings';
COMMENT ON FUNCTION get_revenue_share IS 'Returns applicable revenue share percentages for a creator';
COMMENT ON FUNCTION record_trade_revenue IS 'Records revenue from a trade, splitting between creator and platform';

-- ============================================================================
-- End of Monetization Schema
-- ============================================================================
