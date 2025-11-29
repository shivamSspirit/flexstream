# Troubleshooting Social Links Issue

## Quick Diagnosis

Run this checklist to identify where the issue is:

### 1. Check Database Schema ✅

**Run:** `verify-schema.sql` in Supabase SQL Editor

**Expected output:**
```
✅ twitter column exists
✅ instagram column exists
✅ website column exists
✅ cover_url column exists
✅ ALL REQUIRED COLUMNS EXIST!
```

**If you see ❌ Missing columns:**
- **Fix:** Run `fix-social-links-schema.sql` in Supabase SQL Editor
- **Then:** Re-run `verify-schema.sql` to confirm

### 2. Check API Response 🔍

**Location:** Browser DevTools → Network tab

1. Edit your profile and add social links
2. Click "Save Changes"
3. Watch the Network tab for `/api/users/update-profile` request
4. Check the response

**Expected response:**
```json
{
  "success": true,
  "data": {
    "username": "yourname",
    "twitter": "yourtwitter",
    "instagram": "yourinsta",
    "website": "https://yoursite.com"
  }
}
```

**If you see error:**
```json
{
  "success": false,
  "error": "Database schema needs to be updated..."
}
```
- **Fix:** Run `fix-social-links-schema.sql`

### 3. Check Data Persistence 💾

**Run:** `test-social-links.sql` in Supabase SQL Editor

**Or manually check:**
```sql
SELECT username, twitter, instagram, website
FROM users
WHERE username = 'your_username';
```

**Expected:** Your social links should be in the database

**If NULL:** Data is not saving - check API logs

### 4. Check Profile Page Load 📄

**Location:** `/app/profile/[username]/page.tsx` line 107-111

The profile page fetches all columns with:
```typescript
const { data: user, error } = await supabase
  .from('users')
  .select('*')  // ✅ This selects all columns including social links
  .eq('username', username)
  .single();
```

**Verify social links are in the response:**
1. Add console.log in the browser:
   ```typescript
   console.log('Profile loaded:', user);
   console.log('Twitter:', user?.twitter);
   console.log('Instagram:', user?.instagram);
   console.log('Website:', user?.website);
   ```

2. Open browser console
3. Reload profile page
4. Check the logged values

**If undefined:** Data is not being fetched - check database

## Common Issues & Solutions

### Issue 1: "Profile saved successfully" but social links not showing

**Symptoms:**
- Save appears successful
- No error messages
- Redirect works
- But social links are empty on profile

**Diagnosis:**
- Run `verify-schema.sql`
- If columns are missing, this is the issue

**Solution:**
1. Run `fix-social-links-schema.sql`
2. Try saving profile again
3. Social links should now persist

---

### Issue 2: Error message "Database schema needs to be updated"

**Symptoms:**
- Error toast appears
- Save fails
- No redirect

**Diagnosis:**
- Database columns are missing
- API is correctly detecting the issue (good!)

**Solution:**
1. Run `fix-social-links-schema.sql`
2. Refresh the page
3. Try saving again

---

### Issue 3: Social links save but show incorrectly

**Symptoms:**
- Data saves to database
- Links appear on profile
- But clicking them doesn't work

**Diagnosis:**
- Check the profile page code (lines 258-328)
- Twitter link: `https://twitter.com/${profile.twitter}`
- Instagram link: `https://instagram.com/${profile.instagram}`
- Website link: `${profile.website}` (should include https://)

**Solution:**
- Ensure Twitter/Instagram usernames don't include @
- Ensure website includes full URL with https://

---

### Issue 4: Old data still showing after save

**Symptoms:**
- Updated profile but old data still appears
- Hard refresh doesn't help

**Diagnosis:**
- React Query cache not invalidating
- Window redirect not working

**Solution:**
1. Check edit page cache invalidation (lines 316-319):
   ```typescript
   await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
   await queryClient.invalidateQueries({ queryKey: ['userProfile'] });
   ```

2. Verify redirect (line 323):
   ```typescript
   window.location.href = `/profile/${username}`;
   ```

3. Try clearing browser cache and hard reload (Cmd+Shift+R)

---

### Issue 5: Network error when saving

**Symptoms:**
- Network request fails
- No response from API
- Timeout errors

**Diagnosis:**
- Check browser console for errors
- Check API route is working

**Solution:**
1. Verify Supabase is configured (check .env.local):
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_url
   SUPABASE_SERVICE_ROLE_KEY=your_key
   ```

2. Check API logs for errors
3. Verify Supabase connection

---

## Step-by-Step Debug Process

### Step 1: Verify Database Schema
```bash
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Run verify-schema.sql
4. If any columns missing → Run fix-social-links-schema.sql
```

### Step 2: Test Profile Save
```bash
1. Go to /profile/edit
2. Open Browser DevTools (F12)
3. Go to Network tab
4. Add social links
5. Click Save
6. Watch the /api/users/update-profile request
7. Check response for errors
```

### Step 3: Verify Data in Database
```bash
1. Go to Supabase Dashboard
2. Go to SQL Editor
3. Run test-social-links.sql
4. Check if your username shows social links
```

### Step 4: Check Profile Page
```bash
1. Go to /profile/[your-username]
2. Open Browser Console (F12)
3. Look for any errors
4. Check if social links are visible
5. Click social links to test they work
```

### Step 5: Check Server Logs
```bash
1. Check your terminal running Next.js
2. Look for [UPDATE PROFILE] logs
3. Check for any error messages
4. Verify update succeeded
```

## API Logging for Debug

The API now logs detailed information. Check your server logs for:

```
💾 Starting profile save process...
✅ Validation passed
💾 Updating profile via API...
📡 API Response status: 200 OK
✅ Profile updated successfully
🔄 Redirecting to profile page...
```

Or errors:
```
❌ HTTP Error: 500
❌ Error updating profile: Database schema needs to be updated
```

## Need More Help?

If you've tried all of the above and still have issues:

1. Check `SOCIAL_LINKS_FIX.md` for detailed explanation
2. Review the API code in `/app/api/users/update-profile/route.ts`
3. Review the profile page in `/app/profile/[username]/page.tsx`
4. Review the edit page in `/app/profile/edit/page.tsx`
5. Check Supabase logs in Dashboard → Logs

## Files to Check

- **Database Migration:** `fix-social-links-schema.sql`
- **API Route:** `/app/api/users/update-profile/route.ts`
- **Edit Page:** `/app/profile/edit/page.tsx`
- **Profile Page:** `/app/profile/[username]/page.tsx`
- **Verification Script:** `verify-schema.sql`
- **Test Query:** `test-social-links.sql`
