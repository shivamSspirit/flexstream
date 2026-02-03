-- ============================================================================
-- Flexit Prediction Markets Schema
-- "The Oracle of Solana" - Social Prediction Layer
-- ============================================================================

-- ============================================================================
-- 1. FLEX SCORE SYSTEM (Truth Score / Proof of Alpha)
-- ============================================================================

-- User prediction stats and Flex Score
CREATE TABLE IF NOT EXISTS flex_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Core score
  flex_score INTEGER DEFAULT 500, -- Starting score (like ELO)
  tier TEXT DEFAULT 'initiate', -- oracle, prophet, seer, acolyte, initiate

  -- Stats
  total_predictions INTEGER DEFAULT 0,
  correct_predictions INTEGER DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0,

  -- Streaks
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,

  -- Financials
  total_wagered DECIMAL(18,6) DEFAULT 0,
  total_profit DECIMAL(18,6) DEFAULT 0,

  -- Rankings
  global_rank INTEGER,
  weekly_rank INTEGER,
  daily_rank INTEGER,

  -- Top category
  top_category TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- Flex Score history for tracking changes over time
CREATE TABLE IF NOT EXISTS flex_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  flex_score INTEGER NOT NULL,
  change_amount INTEGER NOT NULL, -- positive or negative
  reason TEXT NOT NULL, -- 'prediction_win', 'prediction_loss', 'challenge_win', etc.
  reference_id UUID, -- prediction_id, challenge_id, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. PREDICTIONS (User bets on Kalshi/DFlow markets)
-- ============================================================================

-- User prediction positions
CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Market reference (Kalshi or DFlow)
  market_ticker TEXT NOT NULL, -- e.g., 'KXBTC-25-100K'
  market_source TEXT NOT NULL DEFAULT 'kalshi', -- 'kalshi' or 'dflow'
  market_title TEXT NOT NULL,
  market_category TEXT,

  -- Position
  side TEXT NOT NULL CHECK (side IN ('yes', 'no')),
  shares INTEGER NOT NULL DEFAULT 1,
  entry_price DECIMAL(5,4) NOT NULL, -- 0.00 to 1.00 (probability)

  -- Stake
  stake_amount DECIMAL(18,6) NOT NULL,
  stake_currency TEXT DEFAULT 'USDC',

  -- DFlow specifics (if applicable)
  dflow_yes_mint TEXT, -- YES token mint address
  dflow_no_mint TEXT, -- NO token mint address
  tx_signature TEXT, -- Solana transaction signature

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'won', 'lost', 'cancelled')),
  exit_price DECIMAL(5,4), -- Price when resolved
  payout DECIMAL(18,6), -- Amount received (if won)

  -- Flex Score impact
  flex_change INTEGER DEFAULT 0, -- How much Flex Score changed

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL
);

-- ============================================================================
-- 3. CHALLENGES ("Call-Out" Mechanic - Stake Against Friends)
-- ============================================================================

CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Participants
  challenger_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenged_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Market
  market_ticker TEXT NOT NULL,
  market_source TEXT DEFAULT 'kalshi',
  market_title TEXT NOT NULL,

  -- Positions (challenger picks a side, challenged gets opposite)
  challenger_side TEXT NOT NULL CHECK (challenger_side IN ('yes', 'no')),

  -- Stakes
  stake_amount DECIMAL(18,6) NOT NULL,
  stake_currency TEXT DEFAULT 'USDC',
  total_pot DECIMAL(18,6) NOT NULL, -- stake_amount * 2

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',    -- Waiting for challenged to accept
    'accepted',   -- Both parties locked in
    'declined',   -- Challenged declined
    'active',     -- Market is live
    'resolved',   -- Market resolved, winner determined
    'cancelled',  -- Challenge cancelled
    'expired'     -- Challenge expired without acceptance
  )),

  -- Result
  winner_id UUID REFERENCES users(id),
  loser_id UUID REFERENCES users(id),
  winning_side TEXT CHECK (winning_side IN ('yes', 'no')),

  -- Flex Score changes
  winner_flex_change INTEGER DEFAULT 0,
  loser_flex_change INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL -- When the challenge expires if not accepted
);

-- Challenge notifications/messages
CREATE TABLE IF NOT EXISTS challenge_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. SQUAD MARKETS (Private Group Predictions)
-- ============================================================================

-- Squads (friend groups)
CREATE TABLE IF NOT EXISTS squads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE NOT NULL, -- 8 character code
  is_private BOOLEAN DEFAULT true,
  max_members INTEGER DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Squad members
CREATE TABLE IF NOT EXISTS squad_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(squad_id, user_id)
);

-- Squad markets (custom predictions within a squad)
CREATE TABLE IF NOT EXISTS squad_markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Question
  question TEXT NOT NULL,
  description TEXT,

  -- Pools
  yes_pool DECIMAL(18,6) DEFAULT 0,
  no_pool DECIMAL(18,6) DEFAULT 0,
  total_pool DECIMAL(18,6) DEFAULT 0,

  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'pending_resolution', 'resolved', 'cancelled')),
  result TEXT CHECK (result IN ('yes', 'no')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id)
);

-- Squad market bets
CREATE TABLE IF NOT EXISTS squad_bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_market_id UUID NOT NULL REFERENCES squad_markets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Position
  side TEXT NOT NULL CHECK (side IN ('yes', 'no')),
  amount DECIMAL(18,6) NOT NULL,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'won', 'lost')),
  payout DECIMAL(18,6),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- One bet per user per market
  UNIQUE(squad_market_id, user_id)
);

-- ============================================================================
-- 5. SOCIAL PROOF (Friends' Activity Tracking)
-- ============================================================================

-- Track which friends are betting on which markets
CREATE TABLE IF NOT EXISTS prediction_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prediction_id UUID NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
  is_following BOOLEAN DEFAULT true,
  notified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, prediction_id)
);

-- Friend activity feed for predictions
CREATE TABLE IF NOT EXISTS prediction_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'placed_bet',
    'won_bet',
    'lost_bet',
    'challenged',
    'challenge_won',
    'streak_milestone',
    'rank_up',
    'squad_market_created'
  )),
  market_ticker TEXT,
  market_title TEXT,
  side TEXT CHECK (side IN ('yes', 'no')),
  amount DECIMAL(18,6),
  reference_id UUID, -- prediction_id, challenge_id, etc.
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. VIRAL POLLS (Nikita Bier "Anonymous Poll" Strategy)
-- ============================================================================

-- Polls about friends
CREATE TABLE IF NOT EXISTS friend_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question TEXT NOT NULL, -- e.g., "Who is the best at spotting gems?"
  poll_type TEXT DEFAULT 'prediction' CHECK (poll_type IN (
    'prediction', -- Trading skill related
    'social',     -- Fun/social
    'challenge'   -- Will result in a challenge
  )),
  is_anonymous BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Poll options (friends who can be voted for)
CREATE TABLE IF NOT EXISTS friend_poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES friend_polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote_count INTEGER DEFAULT 0,
  UNIQUE(poll_id, user_id)
);

-- Poll votes
CREATE TABLE IF NOT EXISTS friend_poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES friend_polls(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  voted_for_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, voter_id) -- One vote per poll per voter
);

-- Poll notifications (the "hook" - "Someone thinks you're the smartest trader")
CREATE TABLE IF NOT EXISTS poll_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES friend_polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Person being notified
  notification_type TEXT DEFAULT 'winner', -- 'winner', 'mentioned', 'voted'
  is_revealed BOOLEAN DEFAULT false, -- Did they complete the action to reveal?
  reveal_action TEXT, -- What they need to do: 'trade_1_usdc', 'invite_friend', etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. REFERRAL POWER-UPS
-- ============================================================================

CREATE TABLE IF NOT EXISTS invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL, -- 8 character unique code
  reward_type TEXT DEFAULT 'loss_protection', -- 'loss_protection', 'flex_boost', 'premium_trial'
  reward_amount DECIMAL(18,6) DEFAULT 10, -- e.g., $10 loss protection
  max_uses INTEGER DEFAULT 5,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS invite_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_code_id UUID NOT NULL REFERENCES invite_codes(id) ON DELETE CASCADE,
  invited_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  inviter_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Reward tracking
  inviter_reward_earned BOOLEAN DEFAULT false,
  invited_reward_earned BOOLEAN DEFAULT false,
  trading_threshold DECIMAL(18,6) DEFAULT 100, -- Trade $100 to unlock rewards
  current_trading_volume DECIMAL(18,6) DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  rewards_unlocked_at TIMESTAMPTZ,

  UNIQUE(invite_code_id, invited_user_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Flex Scores
CREATE INDEX IF NOT EXISTS idx_flex_scores_user ON flex_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_flex_scores_rank ON flex_scores(global_rank);
CREATE INDEX IF NOT EXISTS idx_flex_scores_tier ON flex_scores(tier);
CREATE INDEX IF NOT EXISTS idx_flex_score_history_user ON flex_score_history(user_id, created_at DESC);

-- Predictions
CREATE INDEX IF NOT EXISTS idx_predictions_user ON predictions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_market ON predictions(market_ticker);
CREATE INDEX IF NOT EXISTS idx_predictions_status ON predictions(status);
CREATE INDEX IF NOT EXISTS idx_predictions_active ON predictions(user_id, status) WHERE status = 'active';

-- Challenges
CREATE INDEX IF NOT EXISTS idx_challenges_challenger ON challenges(challenger_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_challenges_challenged ON challenges(challenged_id, status);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);

-- Squad Markets
CREATE INDEX IF NOT EXISTS idx_squad_members_user ON squad_members(user_id);
CREATE INDEX IF NOT EXISTS idx_squad_members_squad ON squad_members(squad_id);
CREATE INDEX IF NOT EXISTS idx_squad_markets_squad ON squad_markets(squad_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_squad_bets_market ON squad_bets(squad_market_id);
CREATE INDEX IF NOT EXISTS idx_squad_bets_user ON squad_bets(user_id);

-- Activity
CREATE INDEX IF NOT EXISTS idx_prediction_activity_user ON prediction_activity(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prediction_activity_type ON prediction_activity(activity_type);

-- Polls
CREATE INDEX IF NOT EXISTS idx_friend_polls_creator ON friend_polls(created_by);
CREATE INDEX IF NOT EXISTS idx_poll_notifications_user ON poll_notifications(user_id, is_revealed);

-- Invites
CREATE INDEX IF NOT EXISTS idx_invite_codes_user ON invite_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_invite_redemptions_inviter ON invite_redemptions(inviter_user_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE flex_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE squad_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE squad_markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE squad_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- Flex scores are public (for leaderboard)
CREATE POLICY "flex_scores_public_read" ON flex_scores FOR SELECT USING (true);
CREATE POLICY "flex_scores_own_write" ON flex_scores FOR ALL USING (auth.uid()::text = user_id::text);

-- Predictions are public but only owner can modify
CREATE POLICY "predictions_public_read" ON predictions FOR SELECT USING (true);
CREATE POLICY "predictions_own_write" ON predictions FOR ALL USING (auth.uid()::text = user_id::text);

-- Challenges visible to participants
CREATE POLICY "challenges_participant_read" ON challenges FOR SELECT USING (
  auth.uid()::text = challenger_id::text OR auth.uid()::text = challenged_id::text
);
CREATE POLICY "challenges_own_write" ON challenges FOR ALL USING (
  auth.uid()::text = challenger_id::text
);

-- Squad members can see their squads
CREATE POLICY "squad_members_read" ON squad_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM squad_members sm WHERE sm.squad_id = squad_members.squad_id AND sm.user_id::text = auth.uid()::text)
);

-- Activity feed is public
CREATE POLICY "activity_public_read" ON prediction_activity FOR SELECT USING (true);
CREATE POLICY "activity_own_write" ON prediction_activity FOR ALL USING (auth.uid()::text = user_id::text);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update Flex Score tier based on score
CREATE OR REPLACE FUNCTION update_flex_tier()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tier := CASE
    WHEN NEW.flex_score >= 900 THEN 'oracle'
    WHEN NEW.flex_score >= 750 THEN 'prophet'
    WHEN NEW.flex_score >= 600 THEN 'seer'
    WHEN NEW.flex_score >= 400 THEN 'acolyte'
    ELSE 'initiate'
  END;

  NEW.win_rate := CASE
    WHEN NEW.total_predictions > 0
    THEN (NEW.correct_predictions::DECIMAL / NEW.total_predictions * 100)
    ELSE 0
  END;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_flex_tier
BEFORE UPDATE ON flex_scores
FOR EACH ROW EXECUTE FUNCTION update_flex_tier();

-- Function to update squad market pools
CREATE OR REPLACE FUNCTION update_squad_market_pool()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE squad_markets
  SET
    yes_pool = (SELECT COALESCE(SUM(amount), 0) FROM squad_bets WHERE squad_market_id = NEW.squad_market_id AND side = 'yes'),
    no_pool = (SELECT COALESCE(SUM(amount), 0) FROM squad_bets WHERE squad_market_id = NEW.squad_market_id AND side = 'no'),
    total_pool = (SELECT COALESCE(SUM(amount), 0) FROM squad_bets WHERE squad_market_id = NEW.squad_market_id)
  WHERE id = NEW.squad_market_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_squad_pool
AFTER INSERT OR UPDATE ON squad_bets
FOR EACH ROW EXECUTE FUNCTION update_squad_market_pool();

-- Function to generate unique invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INITIAL DATA SEEDING
-- ============================================================================

-- Seed Flex Scores for existing users who don't have one
INSERT INTO flex_scores (user_id, flex_score, tier)
SELECT id, 500, 'initiate'
FROM users
WHERE id NOT IN (SELECT user_id FROM flex_scores)
ON CONFLICT (user_id) DO NOTHING;
