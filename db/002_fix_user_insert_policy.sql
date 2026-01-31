-- Fix RLS policy for user insertions
-- This allows the service role to create users via the API

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role can insert users" ON users;
DROP POLICY IF EXISTS "Allow service role to manage users" ON users;

-- Add policy to allow user insertions (for API registration)
-- Service role bypasses RLS by default, but we add this for clarity and explicit permission
CREATE POLICY "Service role can insert users" ON users
  FOR INSERT
  WITH CHECK (true);

-- Also allow users to insert their own profile (for future self-registration)
CREATE POLICY "Users can create their own profile" ON users
  FOR INSERT
  WITH CHECK (auth.uid()::text = id::text);

-- Add comment for documentation
COMMENT ON POLICY "Service role can insert users" ON users IS
  'Allows API endpoints using service role to create user accounts when users connect their wallet';
