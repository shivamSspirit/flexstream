# Creator Coin Activation - Quick Test Checklist

## Pre-Flight Checks

- [ ] Development server running (`npm run dev`)
- [ ] Browser open to `http://localhost:3000`
- [ ] Wallet extension installed (Phantom/Solflare)
- [ ] Connected to Devnet
- [ ] User account created and logged in

## Profile Setup

- [ ] Navigate to `/profile/[your-username]`
- [ ] Profile has `display_name` set
- [ ] Profile has `bio` filled out
- [ ] Profile has `avatar_url` uploaded
- [ ] Verify `creator_coin_enabled` is `false` (check in DB or API)

## Visual Verification

- [ ] "Activate Coin" button is visible
- [ ] Button has gradient styling (green → cyan → blue)
- [ ] If profile incomplete, "Complete Profile" badge shows

## Click "Activate Coin"

- [ ] Modal opens immediately
- [ ] Modal has title "Activate Creator Coin"
- [ ] ✅ **FIX VERIFIED**: Description shows `$YOURUSERNAME` (not `${'{userProfile...'}`)
- [ ] Benefits list displays correctly
- [ ] "Cancel" and "Activate" buttons visible

## Wallet Check

- [ ] Wallet is connected
- [ ] Wallet shows in header
- [ ] If not connected, clicking "Activate" shows error toast

## Click "Activate" in Modal

- [ ] Loading spinner appears
- [ ] Text says "Activating..."
- [ ] "Creating your creator coin" message shows

## Browser Console Check

Open console and verify:
- [ ] Log: `🚀 Activating creator coin...`
- [ ] No red errors
- [ ] Network tab shows POST to `/api/creators/activate-coin`

## Terminal Console Check

In terminal running `npm run dev`, verify:
- [ ] `[CREATOR COIN] Starting creator coin activation`
- [ ] `Finding user by wallet...`
- [ ] `Creator coin details: {...}`
- [ ] `Uploading token metadata...`
- [ ] `Metadata uploaded: https://...`
- [ ] `Creating creator token and pool...`
- [ ] `[DBC] Creating CREATOR token...`
- [ ] `[DBC] Transaction confirmed!`
- [ ] `✅ Creator coin activated successfully!`

## Success State

- [ ] Modal shows green checkmark icon
- [ ] "Success!" message appears
- [ ] "Your creator coin is now live" text shows
- [ ] ✅ **FIX VERIFIED**: "View on Solscan" link appears with real token address (not `${'{tokenMint'}`)
- [ ] Link format: `https://solscan.io/token/[REAL_MINT]?cluster=devnet`

## Auto-Close

- [ ] After 2 seconds, modal closes automatically
- [ ] No errors in console

## Profile Reload

- [ ] Profile page reloads
- [ ] "Activate Coin" button disappears
- [ ] Creator coin section appears with:
  - [ ] Token badge (🪙 icon)
  - [ ] "Creator Coin Active" text
  - [ ] Token symbol (e.g., `$USERNAME`)
  - [ ] Contract address (CA: xxxx...xxxx)
  - [ ] "Trade Now" button
  - [ ] Market cap card
  - [ ] Price card
  - [ ] Top holders section

## Token Verification

- [ ] Click token address badge
- [ ] Opens Solscan in new tab
- [ ] Shows real token data
- [ ] Token name matches user's display name
- [ ] Token symbol is unique 9-char code

## Trade Button

- [ ] Click "Trade Now" button
- [ ] Opens Jupiter swap interface
- [ ] Pre-filled with SOL → Token swap
- [ ] Token address matches created token

## Database Verification

Check Supabase database or use API:
- [ ] User's `creator_coin_enabled` = `true`
- [ ] User's `creator_coin_mint` = token address
- [ ] User's `creator_coin_pool` = pool address
- [ ] User's `creator_coin_metadata_uri` = metadata URL

## Negative Tests

### Test 1: Try to activate again
- [ ] "Activate Coin" button should NOT appear
- [ ] If you manually call API, should return "Creator coin already activated"

### Test 2: Incomplete profile
- [ ] Remove bio from profile
- [ ] "Complete Profile" badge appears on button
- [ ] Clicking button shows toast, NOT modal

### Test 3: Disconnected wallet
- [ ] Disconnect wallet
- [ ] Click "Activate Coin" (if visible)
- [ ] Should show "Please connect your wallet first"

## Common Issues Checklist

### Issue: Modal doesn't open
- [ ] Check profile is complete
- [ ] Check browser console for errors
- [ ] Verify modal component imported correctly

### Issue: Template literals showing as text
- [ ] ✅ **FIXED**: Line 122 now uses `${userProfile.username.toUpperCase()}`
- [ ] ✅ **FIXED**: Line 171 now uses `${tokenMint}`
- [ ] Clear browser cache
- [ ] Restart dev server

### Issue: API errors
- [ ] Check `.env.local` has all required variables
- [ ] Check `PLATFORM_KEYPAIR_SECRET` is set
- [ ] Check platform wallet has SOL for fees
- [ ] Check Supabase connection

### Issue: Transaction fails
- [ ] Check RPC endpoint is responding
- [ ] Check network (should be devnet)
- [ ] Check platform wallet SOL balance
- [ ] Check Meteora DBC config keys

## Success Criteria

✅ All 40+ checkboxes above should be checked
✅ No errors in browser console
✅ No errors in terminal console
✅ Token appears on Solscan
✅ Profile updates correctly
✅ Trade button works

## Time Estimate

- Setup: 2 minutes
- Testing flow: 3 minutes
- Verification: 2 minutes
- **Total: ~7 minutes**

## Files Modified (For Reference)

1. `/components/creator-coin/ActivateCreatorCoinModal.tsx`
   - Line 122: Fixed username template literal
   - Line 171: Fixed tokenMint template literal

## Documentation Created

1. `CREATOR_COIN_ACTIVATION_DEBUG.md` - Complete debugging guide
2. `FIXES_APPLIED.md` - Summary of all fixes
3. `CREATOR_COIN_FLOW_DIAGRAM.md` - Visual flow diagram
4. `test-creator-coin-flow.js` - Browser testing script
5. `QUICK_TEST_CHECKLIST.md` - This file

---

**Status**: ✅ All critical bugs fixed. Ready for testing!

**Next Step**: Run through this checklist from top to bottom.
