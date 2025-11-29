# Social Links Fix - Implementation Checklist

## Pre-Fix Verification

- [ ] I can reproduce the issue (social links not saving)
- [ ] I have access to Supabase Dashboard
- [ ] I have admin/SQL execution permissions
- [ ] I have read `QUICK_FIX_SOCIAL_LINKS.md`

---

## Step 1: Database Migration

### A. Run Migration Script

- [ ] Open Supabase Dashboard
- [ ] Navigate to SQL Editor
- [ ] Open `fix-social-links-schema.sql` file
- [ ] Copy entire contents of the file
- [ ] Paste into SQL Editor
- [ ] Click "Run" button
- [ ] Wait for execution to complete

### B. Verify Success Messages

Check the output panel shows:

- [ ] ✅ "Added twitter column to users table" OR "twitter column already exists"
- [ ] ✅ "Added instagram column to users table" OR "instagram column already exists"
- [ ] ✅ "Added website column to users table" OR "website column already exists"
- [ ] ✅ "Added cover_url column to users table" OR "cover_url column already exists"
- [ ] ✅ "Social links schema migration completed successfully!"

### C. Verify Column List

Check the final SELECT query shows these columns:

- [ ] ✅ avatar_url (TEXT)
- [ ] ✅ bio (TEXT)
- [ ] ✅ cover_url (TEXT)
- [ ] ✅ instagram (TEXT)
- [ ] ✅ twitter (TEXT)
- [ ] ✅ website (TEXT)

---

## Step 2: Verification

### A. Run Verification Script

- [ ] Open Supabase SQL Editor
- [ ] Open `verify-schema.sql` file
- [ ] Copy entire contents
- [ ] Paste into SQL Editor
- [ ] Click "Run" button

### B. Check Verification Output

- [ ] ✅ "twitter column exists"
- [ ] ✅ "instagram column exists"
- [ ] ✅ "website column exists"
- [ ] ✅ "cover_url column exists"
- [ ] ✅ "ALL REQUIRED COLUMNS EXIST!"

---

## Step 3: Functional Testing

### A. Edit Profile Test

- [ ] Navigate to `/profile/edit`
- [ ] Open Browser DevTools (F12)
- [ ] Go to Console tab (to watch for errors)
- [ ] Go to Network tab (to watch API calls)

### B. Add Social Links

Fill in the form:

- [ ] Twitter: Enter a valid username (e.g., "elonmusk" - without @)
- [ ] Instagram: Enter a valid username (e.g., "instagram" - without @)
- [ ] Website: Enter a full URL (e.g., "https://example.com")

### C. Save and Monitor

- [ ] Click "Save Changes" button
- [ ] Watch Network tab for `/api/users/update-profile` request
- [ ] Check request payload includes social links
- [ ] Check response status is 200 OK
- [ ] Check response body has `"success": true`
- [ ] Verify success toast appears
- [ ] Wait for automatic redirect

### D. Verify on Profile Page

After redirect to `/profile/[username]`:

- [ ] Twitter icon is visible and blue
- [ ] Instagram icon is visible (camera emoji)
- [ ] Website icon is visible (globe emoji)
- [ ] "Verified Social" badge appears (if any social link exists)
- [ ] No gray/disabled social icons

### E. Test Social Links

Click each social icon:

- [ ] Twitter link opens `https://twitter.com/[your-handle]` in new tab
- [ ] Instagram link opens `https://instagram.com/[your-handle]` in new tab
- [ ] Website link opens your website URL in new tab
- [ ] All links work correctly

### F. Persistence Test

- [ ] Hard refresh the profile page (Cmd+Shift+R or Ctrl+Shift+F5)
- [ ] Social links still visible after refresh
- [ ] Navigate away and come back
- [ ] Social links still visible

---

## Step 4: Database Verification

### A. Run Test Query

- [ ] Open Supabase SQL Editor
- [ ] Open `test-social-links.sql` file
- [ ] Find the commented section at the bottom
- [ ] Uncomment it and replace 'your_username' with your actual username
- [ ] Run the query

### B. Verify Data in Database

Check the query result shows:

- [ ] Your username is in the results
- [ ] twitter column has your Twitter handle
- [ ] instagram column has your Instagram handle
- [ ] website column has your website URL
- [ ] cover_url column has a URL (if you uploaded a cover)
- [ ] avatar_url column has a URL
- [ ] bio column has your bio

---

## Step 5: Edge Case Testing

### A. Test Empty Values

- [ ] Edit profile again
- [ ] Remove one social link (e.g., clear Twitter)
- [ ] Save profile
- [ ] Verify that removed link is gone
- [ ] Verify other links still work

### B. Test Re-editing

- [ ] Edit profile
- [ ] Change a social link value
- [ ] Save profile
- [ ] Verify new value appears
- [ ] Verify old value is gone

### C. Test Invalid URLs

- [ ] Edit profile
- [ ] Try entering website without https:// (e.g., "example.com")
- [ ] Save profile
- [ ] Note behavior (should save as entered)
- [ ] Edit again and add https:// if needed

---

## Step 6: Multi-User Testing (Optional)

If you have multiple test accounts:

- [ ] Test with a second user account
- [ ] Verify social links save correctly
- [ ] View first user's profile from second account
- [ ] Verify social links are visible to others

---

## Step 7: Error Handling Testing

### A. Test with Missing Columns (If Not Fixed)

If you haven't run the migration yet:

- [ ] Try to save profile
- [ ] Verify you get clear error message
- [ ] Error mentions running migration script

### B. Test Network Errors

- [ ] Open DevTools → Network tab
- [ ] Enable "Offline" mode
- [ ] Try to save profile
- [ ] Verify appropriate error message
- [ ] Disable offline mode and retry

---

## Step 8: Code Review (Optional)

If you're a developer:

- [ ] Review changes in `/app/api/users/update-profile/route.ts`
- [ ] Verify error handling is improved
- [ ] Review profile page `/app/profile/[username]/page.tsx`
- [ ] Verify social fields are in UserProfile interface
- [ ] Review edit page `/app/profile/edit/page.tsx`
- [ ] Verify form fields exist for social links

---

## Step 9: Documentation Review

- [ ] Read `SOCIAL_LINKS_FIX.md` for detailed explanation
- [ ] Read `TROUBLESHOOTING_SOCIAL_LINKS.md` for debug guide
- [ ] Read `VISUAL_FIX_GUIDE.md` for visual reference
- [ ] Bookmark relevant files for future reference

---

## Step 10: Production Deployment (If Applicable)

If deploying to production:

- [ ] Backup database (optional but recommended)
- [ ] Run migration in production Supabase
- [ ] Verify with `verify-schema.sql` in production
- [ ] Test with a production user account
- [ ] Monitor error logs for issues
- [ ] Monitor user feedback

---

## Post-Fix Monitoring

### Week 1:

- [ ] Monitor error logs daily
- [ ] Check for any social link issues reported
- [ ] Review analytics on social link usage
- [ ] Verify no regression in other features

### Week 2:

- [ ] Review user adoption of social links
- [ ] Run `test-social-links.sql` to check usage stats
- [ ] Address any edge cases discovered
- [ ] Update documentation if needed

---

## Rollback Plan (If Something Goes Wrong)

If you need to rollback:

### Option 1: Remove Columns
```sql
ALTER TABLE users DROP COLUMN IF EXISTS twitter;
ALTER TABLE users DROP COLUMN IF EXISTS instagram;
ALTER TABLE users DROP COLUMN IF EXISTS website;
ALTER TABLE users DROP COLUMN IF EXISTS cover_url;
```

### Option 2: Restore from Backup
- [ ] Access Supabase backups
- [ ] Restore to point before migration
- [ ] Note: Will lose any data added after migration

**Note:** Rollback should rarely be needed. The migration is safe and non-destructive.

---

## Troubleshooting

If any step fails:

- [ ] Check `TROUBLESHOOTING_SOCIAL_LINKS.md`
- [ ] Review error messages in console
- [ ] Check Supabase logs
- [ ] Review Network tab for API errors
- [ ] Run verification scripts again

---

## Final Sign-Off

### Database Admin:

- [ ] Migration completed successfully
- [ ] Verification scripts pass
- [ ] No errors in database logs
- [ ] Performance is normal

**Signed off by:** _________________ **Date:** _________

### QA Engineer:

- [ ] All test cases pass
- [ ] Social links save correctly
- [ ] Social links display correctly
- [ ] No regressions found

**Signed off by:** _________________ **Date:** _________

### Developer:

- [ ] Code changes reviewed
- [ ] API works correctly
- [ ] Frontend displays correctly
- [ ] Documentation complete

**Signed off by:** _________________ **Date:** _________

---

## Success Metrics

After 1 week, measure:

- [ ] Number of users with Twitter links: _______
- [ ] Number of users with Instagram links: _______
- [ ] Number of users with Website links: _______
- [ ] Profile update success rate: _______% (target: >99%)
- [ ] Support tickets about social links: _______ (target: 0)

---

## Completion Status

### Overall Progress:

- [ ] Pre-fix verification complete
- [ ] Database migration complete
- [ ] Verification successful
- [ ] Functional testing passed
- [ ] Database verification passed
- [ ] Edge case testing passed
- [ ] Documentation reviewed
- [ ] Production deployed (if applicable)
- [ ] Post-fix monitoring started

### Final Status:

- [ ] ✅ COMPLETE - Social links are working!
- [ ] ⏸️ IN PROGRESS - Still testing
- [ ] ❌ BLOCKED - Need help (see Troubleshooting)

---

**Completed by:** _________________

**Date:** _________________

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
