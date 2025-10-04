-- Add wallet-related fields to users table
-- This migration adds support for Clerk authentication with auto-generated Solana wallets

-- Add new columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS encrypted_private_key TEXT,
ADD COLUMN IF NOT EXISTS wallet_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS clerk_user_id TEXT UNIQUE;

-- Make wallet_address nullable since it will be generated after signup
ALTER TABLE users ALTER COLUMN wallet_address DROP NOT NULL;

-- Add index for Clerk user ID lookups
CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON users(clerk_user_id);

-- Add index for wallet address lookups
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);

-- Update RLS policies to work with Clerk authentication
-- Drop existing policies that use auth.uid()
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can create posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;
DROP POLICY IF EXISTS "Users can create follows" ON follows;
DROP POLICY IF EXISTS "Users can delete own follows" ON follows;
DROP POLICY IF EXISTS "Users can create likes" ON likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON likes;
DROP POLICY IF EXISTS "Users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view own verifications" ON earnings_verifications;
DROP POLICY IF EXISTS "Users can create verifications" ON earnings_verifications;
DROP POLICY IF EXISTS "Users can update own verifications" ON earnings_verifications;

-- Create new policies that work with Clerk (we'll use service role for now)
-- For now, we'll disable RLS on sensitive operations and handle auth in application layer
-- This is a temporary solution until we implement proper Clerk RLS integration

-- Allow all operations for now (we'll secure this in the application layer)
CREATE POLICY "Allow all operations for Clerk users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations for Clerk posts" ON posts FOR ALL USING (true);
CREATE POLICY "Allow all operations for Clerk follows" ON follows FOR ALL USING (true);
CREATE POLICY "Allow all operations for Clerk likes" ON likes FOR ALL USING (true);
CREATE POLICY "Allow all operations for Clerk comments" ON comments FOR ALL USING (true);
CREATE POLICY "Allow all operations for Clerk notifications" ON notifications FOR ALL USING (true);
CREATE POLICY "Allow all operations for Clerk verifications" ON earnings_verifications FOR ALL USING (true);

-- Add function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON COLUMN users.encrypted_private_key IS 'Base64 encoded and encrypted Solana private key';
COMMENT ON COLUMN users.wallet_created_at IS 'Timestamp when the Solana wallet was generated';
COMMENT ON COLUMN users.clerk_user_id IS 'Clerk authentication user ID';
