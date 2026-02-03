-- Flexit Database Schema
-- Run this in your Supabase SQL Editor

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  verified_earnings DECIMAL DEFAULT 0,
  success_tier TEXT DEFAULT 'bronze' CHECK (success_tier IN ('bronze', 'silver', 'gold', 'diamond')),
  total_followers INTEGER DEFAULT 0,
  total_following INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('earnings_flex', 'stream_highlight', 'lifestyle', 'trading_journey')),
  content TEXT NOT NULL,
  media_urls TEXT[],
  social_link TEXT,
  earnings_amount DECIMAL,
  token_address TEXT,
  verified BOOLEAN DEFAULT FALSE,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Follows table
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  following_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Likes table
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(type);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Users can read all users
CREATE POLICY "Users can read all users" ON users FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (true);

-- Posts are readable by everyone
CREATE POLICY "Posts are readable by everyone" ON posts FOR SELECT USING (true);

-- Users can insert their own posts
CREATE POLICY "Users can insert own posts" ON posts FOR INSERT WITH CHECK (true);

-- Users can update their own posts
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (true);

-- Users can delete their own posts
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE USING (true);

-- Follows policies
CREATE POLICY "Users can read all follows" ON follows FOR SELECT USING (true);
CREATE POLICY "Users can insert own follows" ON follows FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can delete own follows" ON follows FOR DELETE USING (true);

-- Likes policies
CREATE POLICY "Users can read all likes" ON likes FOR SELECT USING (true);
CREATE POLICY "Users can insert own likes" ON likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can delete own likes" ON likes FOR DELETE USING (true);

-- Comments policies
CREATE POLICY "Comments are readable by everyone" ON comments FOR SELECT USING (true);
CREATE POLICY "Users can insert own comments" ON comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE USING (true);
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (true);

-- Insert some sample data for testing
INSERT INTO users (id, wallet_address, username, display_name, bio, verified_earnings, success_tier, total_followers) VALUES
('demo_user_1', 'demo_wallet_1', 'cryptotrader99', 'Crypto Trader', 'Professional trader with 5+ years experience. Sharing my journey and insights.', 250000, 'diamond', 15420),
('demo_user_2', 'demo_wallet_2', 'pumpmaster', 'Pump Master', 'Pump.fun specialist. Live streaming daily calls and analysis.', 180000, 'gold', 12350),
('demo_user_3', 'demo_wallet_3', 'solanalife', 'Solana Life', 'Living the dream! From 9-5 to full-time trader.', 75000, 'silver', 8900)
ON CONFLICT (id) DO NOTHING;

-- Insert sample posts
INSERT INTO posts (user_id, type, content, earnings_amount, verified, likes_count, comments_count, shares_count) 
SELECT 
  u.id,
  'earnings_flex',
  'Just made $50K on this pump! 🚀 The community was right about this one. Always DYOR but sometimes the crowd knows best!',
  50000,
  true,
  1247,
  89,
  156
FROM users u WHERE u.username = 'cryptotrader99'
ON CONFLICT DO NOTHING;

INSERT INTO posts (user_id, type, content, earnings_amount, verified, likes_count, comments_count, shares_count) 
SELECT 
  u.id,
  'stream_highlight',
  'Check out this insane call from my stream yesterday! Called the top within 2% accuracy 📈',
  25000,
  true,
  892,
  67,
  134
FROM users u WHERE u.username = 'pumpmaster'
ON CONFLICT DO NOTHING;

INSERT INTO posts (user_id, type, content, earnings_amount, verified, likes_count, comments_count, shares_count) 
SELECT 
  u.id,
  'lifestyle',
  'Living the dream! From 9-5 to full-time trader. This community changed my life 💜',
  0,
  false,
  456,
  23,
  78
FROM users u WHERE u.username = 'solanalife'
ON CONFLICT DO NOTHING;
