# Quick Fix: Social Links Not Saving

## The Problem

Social links (Twitter, Instagram, Website) appear to save but don't show on profile page.

## The Root Cause

**Database is missing columns!**

The `users` table doesn't have `twitter`, `instagram`, `website`, and `cover_url` columns.

## The Solution (2 Steps)

### Step 1: Run Database Migration ⚡

**Go to:** Supabase Dashboard → SQL Editor

**Copy & Paste:** Contents of `fix-social-links-schema.sql`

**Click:** Run

**Expected output:**
```
✅ Added twitter column to users table
✅ Added instagram column to users table
✅ Added website column to users table
✅ Added cover_url column to users table
✅ Social links schema migration completed successfully!
```

### Step 2: Test It Works ✅

1. Go to `/profile/edit`
2. Add your social links:
   - Twitter: `yourhandle` (no @)
   - Instagram: `yourhandle` (no @)
   - Website: `https://yoursite.com` (full URL)
3. Click "Save Changes"
4. You should be redirected to your profile
5. **Social links should now be visible!** 🎉

## Verify It Worked

Run `verify-schema.sql` in Supabase SQL Editor to confirm:

```
✅ twitter column exists
✅ instagram column exists
✅ website column exists
✅ cover_url column exists
✅ ALL REQUIRED COLUMNS EXIST!
```

## What Changed?

### Before Fix:
```
User saves profile → API tries to save social links
→ Database rejects (missing columns)
→ API silently retries without social links
→ Save appears successful
→ But social links were dropped 😢
```

### After Fix:
```
User saves profile → API saves social links
→ Database accepts (columns exist)
→ Data persists correctly
→ Profile page shows social links 🎉
```

## Files Included

- **fix-social-links-schema.sql** - Run this to fix database ⚡
- **verify-schema.sql** - Check if columns exist ✅
- **test-social-links.sql** - Query to see saved data 🔍
- **SOCIAL_LINKS_FIX.md** - Detailed explanation 📚
- **TROUBLESHOOTING_SOCIAL_LINKS.md** - Debug guide 🔧

## Still Having Issues?

1. Run `verify-schema.sql` - Are columns added?
2. Check browser console - Any errors?
3. Check Network tab - Is API returning data?
4. Run `test-social-links.sql` - Is data in database?
5. Read `TROUBLESHOOTING_SOCIAL_LINKS.md` for detailed debug steps

## Summary

**Problem:** Database missing columns
**Solution:** Run `fix-social-links-schema.sql`
**Time:** ~30 seconds
**Difficulty:** Easy - just copy/paste and click Run

🚀 That's it! Your social links should now work perfectly.
