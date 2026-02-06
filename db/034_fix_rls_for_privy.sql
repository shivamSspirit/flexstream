-- ============================================================================
-- FIX RLS POLICIES FOR PRIVY WALLET AUTH
-- ============================================================================
-- Purpose: Update RLS policies to work with Privy wallet-based auth
-- Part of DB-FLEX-ARC-RECOMMENDED.md Phase 5 implementation
--
-- The old policies used auth.uid() which assumes Supabase Auth.
-- With Privy, we authenticate via API routes that pass wallet_address.
--
-- Strategy:
-- 1. Public read for most tables (social platform)
-- 2. Service role for writes (API routes validate auth, then use service role)
-- 3. Wallet-based policies where needed (using JWT claims from Privy)
-- ============================================================================

-- ============================================================================
-- Helper function to extract wallet from Privy JWT
-- ============================================================================

CREATE OR REPLACE FUNCTION get_privy_wallet()
RETURNS TEXT AS $$
BEGIN
    -- Try to get wallet_address from JWT claims
    -- Privy passes this in the custom claims
    RETURN current_setting('request.jwt.claims', true)::json->>'wallet_address';
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 1. USERS TABLE
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Allow public read" ON users;
DROP POLICY IF EXISTS "Allow service role all" ON users;

-- New policies
CREATE POLICY "Public read access to users"
    ON users FOR SELECT
    USING (true);

CREATE POLICY "Service role full access to users"
    ON users FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Users can update their own profile via wallet
CREATE POLICY "Users update own profile via wallet"
    ON users FOR UPDATE
    USING (wallet_address = get_privy_wallet())
    WITH CHECK (wallet_address = get_privy_wallet());

-- ============================================================================
-- 2. POSTS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;
DROP POLICY IF EXISTS "Users can create posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;
DROP POLICY IF EXISTS "Allow public read" ON posts;
DROP POLICY IF EXISTS "Allow service role all" ON posts;

CREATE POLICY "Public read access to posts"
    ON posts FOR SELECT
    USING (true);

CREATE POLICY "Service role full access to posts"
    ON posts FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- 3. FOLLOWS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view all follows" ON follows;
DROP POLICY IF EXISTS "Users can create follows" ON follows;
DROP POLICY IF EXISTS "Users can delete own follows" ON follows;
DROP POLICY IF EXISTS "Allow public read" ON follows;
DROP POLICY IF EXISTS "Allow service role all" ON follows;

CREATE POLICY "Public read access to follows"
    ON follows FOR SELECT
    USING (true);

CREATE POLICY "Service role full access to follows"
    ON follows FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- 4. LIKES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view all likes" ON likes;
DROP POLICY IF EXISTS "Users can create likes" ON likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON likes;
DROP POLICY IF EXISTS "Allow public read" ON likes;
DROP POLICY IF EXISTS "Allow service role all" ON likes;

CREATE POLICY "Public read access to likes"
    ON likes FOR SELECT
    USING (true);

CREATE POLICY "Service role full access to likes"
    ON likes FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- 5. COMMENTS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
DROP POLICY IF EXISTS "Users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
DROP POLICY IF EXISTS "Allow public read" ON comments;
DROP POLICY IF EXISTS "Allow service role all" ON comments;

CREATE POLICY "Public read access to comments"
    ON comments FOR SELECT
    USING (true);

CREATE POLICY "Service role full access to comments"
    ON comments FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- 6. TOKENS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Tokens are publicly readable" ON tokens;
DROP POLICY IF EXISTS "Service role full access to tokens" ON tokens;
DROP POLICY IF EXISTS "Allow public read" ON tokens;
DROP POLICY IF EXISTS "Allow service role all" ON tokens;

CREATE POLICY "Public read access to tokens"
    ON tokens FOR SELECT
    USING (true);

CREATE POLICY "Service role full access to tokens"
    ON tokens FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- 7. TOKEN_TRADES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Token trades are publicly readable" ON token_trades;
DROP POLICY IF EXISTS "Service role full access to token_trades" ON token_trades;
DROP POLICY IF EXISTS "Allow public read" ON token_trades;
DROP POLICY IF EXISTS "Allow service role all" ON token_trades;

CREATE POLICY "Public read access to token_trades"
    ON token_trades FOR SELECT
    USING (true);

CREATE POLICY "Service role full access to token_trades"
    ON token_trades FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- 8. NOTIFICATIONS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Service role full access to notifications" ON notifications;

-- Users can only view their own notifications
CREATE POLICY "Users view own notifications"
    ON notifications FOR SELECT
    USING (
        user_id IN (
            SELECT id FROM users WHERE wallet_address = get_privy_wallet()
        )
    );

CREATE POLICY "Service role full access to notifications"
    ON notifications FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- 9. FLEX_POINTS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own flex points" ON flex_points;
DROP POLICY IF EXISTS "Service role full access to flex_points" ON flex_points;
DROP POLICY IF EXISTS "Allow public read" ON flex_points;

CREATE POLICY "Public read access to flex_points"
    ON flex_points FOR SELECT
    USING (true);

CREATE POLICY "Service role full access to flex_points"
    ON flex_points FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- 10. FLEX_TRANSACTIONS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own flex transactions" ON flex_transactions;
DROP POLICY IF EXISTS "Service role full access to flex_transactions" ON flex_transactions;
DROP POLICY IF EXISTS "Allow public read" ON flex_transactions;

-- Users can view their own transactions
CREATE POLICY "Users view own flex_transactions"
    ON flex_transactions FOR SELECT
    USING (
        user_id IN (
            SELECT id FROM users WHERE wallet_address = get_privy_wallet()
        )
    );

CREATE POLICY "Service role full access to flex_transactions"
    ON flex_transactions FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- 11. WAITLIST_SIGNUPS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Waitlist is readable by service role" ON waitlist_signups;
DROP POLICY IF EXISTS "Service role full access to waitlist_signups" ON waitlist_signups;
DROP POLICY IF EXISTS "Allow public insert" ON waitlist_signups;

-- Public can insert (sign up)
CREATE POLICY "Public can join waitlist"
    ON waitlist_signups FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Service role full access to waitlist"
    ON waitlist_signups FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- 12. EXECUTION_LOGS TABLE (if exists)
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'execution_logs') THEN
        -- Drop old policies
        DROP POLICY IF EXISTS "execution_logs_view_own" ON execution_logs;
        DROP POLICY IF EXISTS "execution_logs_view_admin" ON execution_logs;
        DROP POLICY IF EXISTS "execution_logs_insert_service" ON execution_logs;

        -- New policies - service role only for sensitive logs
        EXECUTE 'CREATE POLICY "Service role full access to execution_logs"
            ON execution_logs FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true)';
    END IF;
END $$;

-- ============================================================================
-- 13. LEADERBOARD_METRICS TABLE (if exists)
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leaderboard_metrics') THEN
        DROP POLICY IF EXISTS "Leaderboard metrics are publicly readable" ON leaderboard_metrics;
        DROP POLICY IF EXISTS "Only service role can modify leaderboard" ON leaderboard_metrics;

        EXECUTE 'CREATE POLICY "Public read access to leaderboard"
            ON leaderboard_metrics FOR SELECT
            USING (true)';

        EXECUTE 'CREATE POLICY "Service role full access to leaderboard"
            ON leaderboard_metrics FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true)';
    END IF;
END $$;

-- ============================================================================
-- 14. Ensure RLS is enabled on all tables
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE flex_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE flex_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist_signups ENABLE ROW LEVEL SECURITY;

-- New tables from this migration set
ALTER TABLE creator_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_share_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_provenance ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON FUNCTION get_privy_wallet IS 'Extracts wallet_address from Privy JWT claims';

-- ============================================================================
-- RLS Strategy Summary:
-- ============================================================================
--
-- PUBLIC READ tables (social platform - anyone can browse):
--   - users, posts, follows, likes, comments
--   - tokens, token_trades, flex_points
--   - leaderboard_metrics, revenue_share_rules
--   - content_provenance (public proof)
--
-- PRIVATE READ tables (user-specific):
--   - notifications (own only)
--   - flex_transactions (own only)
--   - creator_revenue (creator's own only)
--
-- SERVICE ROLE ONLY tables:
--   - platform_fees
--   - execution_logs
--
-- WRITE ACCESS:
--   - All writes go through API routes that validate Privy auth
--   - API routes use service_role Supabase client
--   - This is the correct pattern - RLS is a safety net, not primary auth
--
-- ============================================================================

-- ============================================================================
-- End of RLS Policies Fix
-- ============================================================================
