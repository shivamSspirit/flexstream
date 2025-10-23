# Post Creation Error Fix - Summary

## Problem
When clicking "Create Post", you were getting "an unexpected error" message.

## Root Causes Found & Fixed

### 1. **Database Foreign Key Constraint Violation** ✅ FIXED
**Issue**: The API was trying to insert a wallet address (TEXT) into `posts.user_id`, but the database expects a UUID that references `users.id`.

**Location**:
- [app/api/posts/create/route.ts:91](app/api/posts/create/route.ts#L91)
- [app/api/posts/confirm/route.ts:91](app/api/posts/confirm/route.ts#L91)

**Fix**: Added code to find or create user before inserting post:
```typescript
// Find existing user by wallet address
const { data: existingUser } = await supabase
  .from('users')
  .select('id')
  .eq('wallet_address', walletAddress)
  .single();

if (existingUser) {
  userId = existingUser.id;
} else {
  // Create new user if not exists
  const { data: newUser } = await supabase
    .from('users')
    .insert({
      wallet_address: walletAddress,
      username: `user_${walletAddress.substring(0, 8)}`,
      display_name: `User ${walletAddress.substring(0, 8)}`,
    })
    .select('id')
    .single();

  userId = newUser.id;
}

// Then use userId (UUID) instead of walletAddress (TEXT)
```

### 2. **Wrong Supabase Storage Bucket** ✅ FIXED
**Issue**: The API was uploading to bucket `'flexstream'` but the migration creates bucket `'post-media'`.

**Location**: [app/api/posts/create/route.ts:98-113](app/api/posts/create/route.ts#L98-L113)

**Fix**: Changed bucket name from `'flexstream'` to `'post-media'`:
```typescript
// Before:
.from('flexstream')
.upload(`post-media/${uniqueFileName}`, file)

// After:
.from('post-media')
.upload(`${uniqueFileName}`, file)
```

### 3. **Better Error Messages** ✅ FIXED
**Issue**: Generic errors weren't showing specific details.

**Location**: [components/posts/CreatePostModal.tsx](components/posts/CreatePostModal.tsx)

**Fix**: Added detailed error logging:
```typescript
if (!response.ok) {
  const errorData = await response.json();
  console.error('❌ API Error:', errorData);
  throw new Error(errorData.error || `Failed to create post (${response.status})`);
}
```

## Next Steps - Before Testing

### 1. Ensure Supabase Bucket Exists
You need to create the `post-media` bucket in Supabase Dashboard:

1. Go to Supabase Dashboard → Storage
2. Click "Create Bucket"
3. Name: `post-media`
4. **IMPORTANT**: Make it **PUBLIC** (so media URLs are accessible)
5. Click "Create"

### 2. Verify Database Migrations
Run all migrations to ensure schema is up-to-date:

```bash
# Check if migrations are applied in Supabase Dashboard:
# Database → Migrations → Verify all migrations are run
```

The critical migrations are:
- `001_initial_schema.sql` - Creates users and posts tables
- `003_add_title_column.sql` - Adds title column to posts
- `20231016_add_token_fields.sql` - Adds token fields and creates post-media bucket
- `add_dbc_token_support.sql` - Adds DBC token support

### 3. Check Environment Variables
Verify these are set in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
NEXT_PUBLIC_SOLANA_RPC_URL=your_rpc_url (devnet for testing)
POOL_CONFIG_KEY=your_meteora_pool_config_key
```

## Testing the Fix

1. **Restart dev server** (important!):
   ```bash
   pnpm dev
   ```

2. **Test post creation**:
   - Go to `/create` page
   - Click "Upload Imagination"
   - Fill in:
     - Title: "Test Post"
     - Ticker: "TEST"
     - Description: "Testing token creation"
     - Upload an image
   - Connect your Solana wallet
   - Click "Launch Post & Token"

3. **Check browser console** (F12):
   - You should see detailed logs now
   - Any errors will show specific messages

4. **If errors occur**, check:
   - Browser console for the exact error message
   - Network tab (F12 → Network) for API response details
   - Server logs in terminal for backend errors

## Expected Flow

1. ✅ Upload media to Supabase Storage (`post-media` bucket)
2. ✅ Upload metadata to IPFS/Arweave
3. ✅ Create DBC token transaction (Meteora)
4. ✅ Ask user to sign transaction in wallet
5. ✅ Submit signed transaction to Solana
6. ✅ Wait for confirmation
7. ✅ Find or create user in database
8. ✅ Save post to database
9. ✅ Save token to tokens table
10. ✅ Show success message with explorer link

## Files Modified

1. [app/api/posts/create/route.ts](app/api/posts/create/route.ts)
   - Added user creation/lookup logic (lines 83-118)
   - Fixed bucket name from 'flexstream' to 'post-media'

2. [app/api/posts/confirm/route.ts](app/api/posts/confirm/route.ts)
   - Added user creation/lookup logic (lines 85-120)
   - Changed `user_id: walletAddress` to `user_id: userId`

3. [components/posts/CreatePostModal.tsx](components/posts/CreatePostModal.tsx)
   - Added better error logging with full error details

## Common Issues & Solutions

### Error: "Bucket not found"
**Solution**: Create the `post-media` bucket in Supabase Dashboard (see step 1 above)

### Error: "Failed to create user account"
**Solution**: Check that users table exists and has correct schema. Run migration `001_initial_schema.sql`

### Error: "Invalid signature"
**Solution**: Make sure you're using devnet and have devnet SOL in your wallet

### Error: "Failed to upload"
**Solution**: Check Supabase Storage policies allow uploads. The migration `20231016_add_token_fields.sql` should create the policy.

## Need More Help?

If you still see errors:
1. Open browser console (F12)
2. Copy the full error message
3. Check server logs in terminal
4. Share both console error and server logs for debugging
