-- Update users table to support Privy authentication
-- Add privy_user_id column and update existing structure

-- Add privy_user_id column
ALTER TABLE users ADD COLUMN IF NOT EXISTS privy_user_id TEXT;

-- Create unique index on privy_user_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_privy_user_id ON users(privy_user_id);

-- Update existing users to have a placeholder privy_user_id if they don't have one
-- (This is for migration purposes - you can remove this if not needed)
UPDATE users 
SET privy_user_id = 'migrated_' || id::text 
WHERE privy_user_id IS NULL;

-- Add comment to document the change
COMMENT ON COLUMN users.privy_user_id IS 'Privy user ID for authentication';

-- Show the updated schema
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
