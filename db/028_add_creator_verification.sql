-- Migration: Add creator verification to posts
-- Creator is verified if they have: custom avatar + X/Twitter OAuth verification

-- Add creator_is_verified column to posts table
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS creator_is_verified BOOLEAN DEFAULT false;

-- Add index for filtering by creator verification
CREATE INDEX IF NOT EXISTS idx_posts_creator_verified ON posts(creator_is_verified);

-- Add comment explaining the field
COMMENT ON COLUMN posts.creator_is_verified IS
'True if creator had completed profile verification (custom avatar + X OAuth) when post was created';
