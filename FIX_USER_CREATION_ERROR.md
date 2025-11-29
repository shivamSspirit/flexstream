# Fix: User Creation Error 500

## Problem
```
POST http://localhost:3000/api/posts/create 500 (Internal Server Error)
Error creating token: Error: Failed to create user account
```

## Root Cause
The Supabase `users` table has Row Level Security (RLS) enabled but **lacks an INSERT policy**. This prevents the API from creating new user accounts, even when using the service role key.

## Solution Applied

### 1. Updated API Route Configuration ✅
**File:** `app/api/posts/create/route.ts`

Added proper Supabase client configuration to ensure service role bypasses RLS:

```typescript
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
```

### 2. Improved Username Generation ✅
Fixed username collision issues by adding timestamp-based unique usernames:

```typescript
const timestamp = Date.now().toString(36);
const walletPrefix = walletAddress.substring(0, 8).toLowerCase();
const generatedUsername = username || `${walletPrefix}_${timestamp}`;
```

### 3. Database Migration Required ⚠️

**You MUST apply this SQL migration in Supabase:**

Go to: https://supabase.com/dashboard/project/aopxbpvxwqfqqamkprfo/sql/new

Run this SQL:

```sql
-- Fix RLS policy for user insertions
-- This allows the service role to create users via the API

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role can insert users" ON users;
DROP POLICY IF EXISTS "Allow service role to manage users" ON users;

-- Add policy to allow user insertions (for API registration)
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
```

## Why This Fix Works

1. **Service Role Client**: The service role key should bypass RLS, but we ensure proper configuration
2. **INSERT Policy**: Explicitly allows user creation through the API
3. **Unique Usernames**: Prevents duplicate username errors with timestamp suffixes
4. **Better Error Logging**: Enhanced error messages for debugging

## Testing the Fix

After applying the SQL migration:

1. Start your dev server: `pnpm dev`
2. Connect your wallet
3. Try creating a post
4. Check the console logs - you should see: `✅ Created new user: [user-id]`

## Files Changed

- ✅ `app/api/posts/create/route.ts` - Updated Supabase client & username generation
- 📄 `supabase/migrations/002_fix_user_insert_policy.sql` - RLS policy migration
- 📄 `apply-user-policy-fix.js` - Migration helper script

## Alternative Quick Fix (If Migration Fails)

If you can't apply the migration, you can temporarily disable RLS on the users table:

```sql
-- ⚠️ WARNING: Only use this in development!
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

**DO NOT use this in production** - it removes all security policies.

## Verification

After fixing, your API should:
- ✅ Create new users automatically when they connect their wallet
- ✅ Return proper error messages if something fails
- ✅ Generate unique usernames without collisions
- ✅ Successfully upload media and create posts

## Need Help?

If the error persists:
1. Check Supabase logs in your dashboard
2. Verify the migration was applied successfully
3. Check that your `.env.local` has the correct `SUPABASE_SERVICE_ROLE_KEY`
4. Look for detailed error messages in the browser console and server logs
