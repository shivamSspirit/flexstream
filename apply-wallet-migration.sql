-- Manual migration script to add wallet fields to users table
-- Run this in your Supabase SQL editor

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

-- Add function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to automatically update updated_at (drop first if exists)
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON COLUMN users.encrypted_private_key IS 'Base64 encoded and encrypted Solana private key';
COMMENT ON COLUMN users.wallet_created_at IS 'Timestamp when the Solana wallet was generated';
COMMENT ON COLUMN users.clerk_user_id IS 'Clerk authentication user ID';
