-- Migration: Add Social Verification and Analytics Fields
-- Version: 027
-- Description: Adds verified social accounts, trust scores, and analytics tracking

-- =====================================================
-- SOCIAL VERIFICATION FIELDS
-- =====================================================

-- Twitter verification
ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter_followers INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter_user_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter_verified_at TIMESTAMP WITH TIME ZONE;

-- YouTube verification
ALTER TABLE users ADD COLUMN IF NOT EXISTS youtube_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS youtube_subscribers INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS youtube_channel_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS youtube_channel_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS youtube_verified_at TIMESTAMP WITH TIME ZONE;

-- TikTok verification
ALTER TABLE users ADD COLUMN IF NOT EXISTS tiktok_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tiktok_followers INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tiktok_user_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tiktok_verified_at TIMESTAMP WITH TIME ZONE;

-- =====================================================
-- TRUST SCORE SYSTEM
-- =====================================================

-- Trust score (0-100) calculated from:
-- - Social verification status (verified = +20 per platform)
-- - Follower count tiers (+5 to +20 based on count)
-- - Account age (+10 for 6+ months)
-- - Recent activity (+10 if posted within 72h)
-- - Trading history (+10 if positive volume)
ALTER TABLE users ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_social_activity TIMESTAMP WITH TIME ZONE;

-- =====================================================
-- ANALYTICS FIELDS
-- =====================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS total_post_views INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_token_volume DECIMAL(20,8) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_trading_fees_earned DECIMAL(20,8) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_tips_received DECIMAL(20,8) DEFAULT 0;

-- =====================================================
-- SOCIAL VERIFICATIONS TABLE
-- Track OAuth tokens and verification history
-- =====================================================

CREATE TABLE IF NOT EXISTS social_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'youtube', 'tiktok', 'instagram')),
  platform_user_id TEXT NOT NULL,
  platform_username TEXT,
  platform_display_name TEXT,
  platform_avatar_url TEXT,
  followers_count INTEGER DEFAULT 0,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

-- =====================================================
-- USER ANALYTICS TABLE
-- Daily snapshots for analytics dashboard
-- =====================================================

CREATE TABLE IF NOT EXISTS user_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  post_views INTEGER DEFAULT 0,
  token_volume DECIMAL(20,8) DEFAULT 0,
  trading_fees DECIMAL(20,8) DEFAULT 0,
  tips_received DECIMAL(20,8) DEFAULT 0,
  new_followers INTEGER DEFAULT 0,
  posts_created INTEGER DEFAULT 0,
  tokens_created INTEGER DEFAULT 0,
  trades_executed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_users_trust_score ON users(trust_score DESC);
CREATE INDEX IF NOT EXISTS idx_users_twitter_verified ON users(twitter_verified) WHERE twitter_verified = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_youtube_verified ON users(youtube_verified) WHERE youtube_verified = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_tiktok_verified ON users(tiktok_verified) WHERE tiktok_verified = TRUE;
CREATE INDEX IF NOT EXISTS idx_social_verifications_user_id ON social_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_social_verifications_platform ON social_verifications(platform);
CREATE INDEX IF NOT EXISTS idx_user_analytics_user_date ON user_analytics(user_id, date DESC);

-- =====================================================
-- FUNCTION: Calculate Trust Score
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_trust_score(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_score INTEGER := 0;
  v_user RECORD;
  v_last_post TIMESTAMP;
BEGIN
  -- Get user data
  SELECT * INTO v_user FROM users WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Social verification bonuses (20 points each)
  IF v_user.twitter_verified THEN v_score := v_score + 20; END IF;
  IF v_user.youtube_verified THEN v_score := v_score + 20; END IF;
  IF v_user.tiktok_verified THEN v_score := v_score + 20; END IF;

  -- Follower count bonuses
  -- Twitter followers
  IF v_user.twitter_followers >= 100000 THEN v_score := v_score + 15;
  ELSIF v_user.twitter_followers >= 10000 THEN v_score := v_score + 10;
  ELSIF v_user.twitter_followers >= 1000 THEN v_score := v_score + 5;
  END IF;

  -- YouTube subscribers
  IF v_user.youtube_subscribers >= 100000 THEN v_score := v_score + 15;
  ELSIF v_user.youtube_subscribers >= 10000 THEN v_score := v_score + 10;
  ELSIF v_user.youtube_subscribers >= 1000 THEN v_score := v_score + 5;
  END IF;

  -- TikTok followers
  IF v_user.tiktok_followers >= 100000 THEN v_score := v_score + 15;
  ELSIF v_user.tiktok_followers >= 10000 THEN v_score := v_score + 10;
  ELSIF v_user.tiktok_followers >= 1000 THEN v_score := v_score + 5;
  END IF;

  -- Account age bonus (10 points for 6+ months)
  IF v_user.created_at < NOW() - INTERVAL '6 months' THEN
    v_score := v_score + 10;
  END IF;

  -- Recent activity bonus (10 points if posted within 72h)
  SELECT created_at INTO v_last_post
  FROM posts
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_last_post IS NOT NULL AND v_last_post > NOW() - INTERVAL '72 hours' THEN
    v_score := v_score + 10;
  END IF;

  -- Trading volume bonus
  IF v_user.total_token_volume > 0 THEN
    v_score := v_score + 5;
  END IF;

  -- Cap at 100
  IF v_score > 100 THEN v_score := 100; END IF;

  RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER: Auto-update trust score
-- =====================================================

CREATE OR REPLACE FUNCTION update_user_trust_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.trust_score := calculate_trust_score(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_trust_score ON users;
CREATE TRIGGER trigger_update_trust_score
  BEFORE UPDATE OF twitter_verified, youtube_verified, tiktok_verified,
                   twitter_followers, youtube_subscribers, tiktok_followers
  ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_user_trust_score();

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE social_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;

-- Social verifications: users can only see their own
CREATE POLICY "Users can view own social verifications"
  ON social_verifications FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own social verifications"
  ON social_verifications FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own social verifications"
  ON social_verifications FOR UPDATE
  USING (auth.uid()::text = user_id::text);

-- Allow service role full access
CREATE POLICY "Service role has full access to social_verifications"
  ON social_verifications FOR ALL
  USING (true);

-- User analytics: users can see their own
CREATE POLICY "Users can view own analytics"
  ON user_analytics FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Service role has full access to user_analytics"
  ON user_analytics FOR ALL
  USING (true);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON COLUMN users.trust_score IS 'Calculated trust score 0-100 based on social verification, followers, activity';
COMMENT ON COLUMN users.twitter_verified IS 'Whether Twitter account ownership has been verified via OAuth';
COMMENT ON COLUMN users.youtube_verified IS 'Whether YouTube channel ownership has been verified via OAuth';
COMMENT ON COLUMN users.tiktok_verified IS 'Whether TikTok account ownership has been verified via OAuth';
COMMENT ON TABLE social_verifications IS 'Stores OAuth tokens and verification data for social platforms';
COMMENT ON TABLE user_analytics IS 'Daily analytics snapshots for user dashboards';
