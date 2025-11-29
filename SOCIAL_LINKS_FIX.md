# Social Links Not Saving - Root Cause & Fix

## Problem Summary

When users edit their profile and add social links (Twitter, Instagram, Website), the data appears to save successfully, but the social links don't show up on the profile page after redirect.

## Root Cause Analysis

### 1. Database Schema Missing Columns

The `users` table in the Supabase database is **missing the social link columns**:
- `twitter` (TEXT)
- `instagram` (TEXT)
- `website` (TEXT)
- `cover_url` (TEXT)

**Evidence:**
- The base schema in `setup-database.sql` only includes: `id`, `wallet_address`, `username`, `display_name`, `avatar_url`, `bio`, `verified_earnings`, `success_tier`, `total_followers`, `total_following`, `created_at`, `updated_at`
- Migration file `supabase/migrations/add_user_profile_columns.sql` exists but was never applied to production

### 2. Silent Failure in API

**Location:** `/app/api/users/update-profile/route.ts` (lines 144-175)

The API was designed to handle missing columns by:
1. Attempting to save all fields including social links
2. If it encounters a column error (code `42703`), it would retry with only minimal fields
3. The retry **excluded** social links (twitter, instagram, website)
4. The save would succeed, but social data was silently dropped

**Result:** User sees "Profile updated successfully!" toast, gets redirected, but social links were never saved to the database.

### 3. Data Flow Issue

```
User enters social links → API receives data → Database rejects (missing columns)
→ API retries with minimal fields → Save succeeds without social links
→ User redirected → Profile loads → No social links displayed
```

## The Fix

### Step 1: Run Database Migration

Run the migration script to add the missing columns to your Supabase database:

**File:** `fix-social-links-schema.sql`

**How to apply:**
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `fix-social-links-schema.sql`
4. Click "Run"

This migration will:
- Add `twitter`, `instagram`, `website`, `cover_url` columns to the `users` table
- Create indexes for faster lookups
- Add column comments for documentation
- Verify the migration was successful

### Step 2: API Updated

The API has been updated to:
- **Remove silent failure fallback** - No more retrying with minimal fields
- **Provide clear error messages** - If columns are missing, it now returns a helpful error
- **Log schema errors** - Better debugging information in logs

**Changes made to:** `/app/api/users/update-profile/route.ts`

### Step 3: Verify the Fix

After running the migration:

1. **Test saving profile:**
   ```
   1. Go to /profile/edit
   2. Add Twitter username (e.g., "elonmusk")
   3. Add Instagram username (e.g., "instagram")
   4. Add Website URL (e.g., "https://example.com")
   5. Click "Save Changes"
   ```

2. **Verify data persists:**
   ```
   1. Check the success toast appears
   2. Wait for redirect to /profile/[username]
   3. Social links should be visible
   4. Click on social icons to verify they link correctly
   ```

3. **Check database directly:**
   ```sql
   SELECT username, twitter, instagram, website, cover_url
   FROM users
   WHERE username = 'your_username';
   ```

## Files Changed

1. **Created:** `fix-social-links-schema.sql` - Database migration script
2. **Updated:** `app/api/users/update-profile/route.ts` - Better error handling
3. **Created:** `SOCIAL_LINKS_FIX.md` - This documentation

## Technical Details

### Database Schema Before Fix
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  -- Missing: twitter, instagram, website, cover_url
  ...
);
```

### Database Schema After Fix
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  twitter TEXT,          -- ✅ Added
  instagram TEXT,        -- ✅ Added
  website TEXT,          -- ✅ Added
  cover_url TEXT,        -- ✅ Added
  ...
);
```

### API Behavior Before Fix
```typescript
try {
  // Try to save with social links
  await supabase.update(updateData); // Fails - missing columns
} catch (error) {
  if (error.code === '42703') {
    // Retry without social links - SILENT FAILURE
    await supabase.update(minimalData); // ❌ Social links dropped
    return { success: true }; // User thinks it worked
  }
}
```

### API Behavior After Fix
```typescript
try {
  // Try to save with social links
  await supabase.update(updateData);
} catch (error) {
  if (error.code === '42703') {
    // Provide clear error message
    return {
      success: false,
      error: 'Database schema needs to be updated. Please run the social links migration script.',
    }; // ✅ User knows there's an issue
  }
}
```

## Why This Happened

1. **Schema Evolution**: The initial database schema (`setup-database.sql`) didn't include social fields
2. **Migration Not Applied**: A migration file was created (`add_user_profile_columns.sql`) but wasn't applied to the production database
3. **Silent Error Handling**: The API was designed to gracefully degrade when columns were missing, but this masked the real problem

## Prevention

To prevent this in the future:

1. **Always run migrations**: When adding new fields, ensure migrations are applied to all environments
2. **Remove silent fallbacks**: Don't silently drop data - fail loudly so issues are discovered early
3. **Add integration tests**: Test the full flow from save to load to catch data persistence issues
4. **Database schema versioning**: Track which migrations have been applied to each environment

## Support

If you continue to have issues after running the migration:

1. Check Supabase logs for errors
2. Verify the migration ran successfully (check the SELECT query output)
3. Check browser console for API errors
4. Check server logs for update errors

## Quick Checklist

- [ ] Run `fix-social-links-schema.sql` in Supabase SQL Editor
- [ ] Verify migration success (check SQL output)
- [ ] Test editing profile with social links
- [ ] Verify social links appear on profile page
- [ ] Test social link clicks work correctly
- [ ] Celebrate! 🎉
