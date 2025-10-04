-- Safe migration script to add wallet fields to users table
-- This version handles existing objects gracefully

-- Add new columns to users table (only if they don't exist)
DO $$ 
BEGIN
    -- Add encrypted_private_key column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'encrypted_private_key') THEN
        ALTER TABLE users ADD COLUMN encrypted_private_key TEXT;
    END IF;
    
    -- Add wallet_created_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'wallet_created_at') THEN
        ALTER TABLE users ADD COLUMN wallet_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add clerk_user_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'clerk_user_id') THEN
        ALTER TABLE users ADD COLUMN clerk_user_id TEXT UNIQUE;
    END IF;
END $$;

-- Make wallet_address nullable (only if it's currently NOT NULL)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'users' AND column_name = 'wallet_address' AND is_nullable = 'NO') THEN
        ALTER TABLE users ALTER COLUMN wallet_address DROP NOT NULL;
    END IF;
END $$;

-- Add indexes (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON users(clerk_user_id);
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

-- Add comments for documentation (these will overwrite existing comments)
COMMENT ON COLUMN users.encrypted_private_key IS 'Base64 encoded and encrypted Solana private key';
COMMENT ON COLUMN users.wallet_created_at IS 'Timestamp when the Solana wallet was generated';
COMMENT ON COLUMN users.clerk_user_id IS 'Clerk authentication user ID';
