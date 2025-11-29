# Wallet Creation Debug Guide

## Issue: "Create Wallet" Button Not Working

When clicking the "Create Wallet" button, nothing happens or it fails silently.

## Debugging Steps

### Step 1: Check Browser Console

Open browser console (F12) and look for:

```javascript
// When clicking "Create Wallet", you should see:
"🔑 Manually creating Solana wallet..."

// If successful:
"✅ Wallet created successfully!"

// If failed:
"❌ Error creating wallet: [error message]"
```

### Step 2: Check `createWallet` Function Availability

In browser console, run:

```javascript
console.log('CreateWallet function:', window.privy?.createWallet);
```

**Expected**: Function definition
**If `undefined`**: Privy not properly initialized

### Step 3: Check User Authentication

```javascript
console.log('User:', window.privy?.user);
console.log('Authenticated:', window.privy?.authenticated);
```

**Expected**: 
- User object with email/social account
- Authenticated: `true`

### Step 4: Check Privy Configuration

```javascript
console.log('Privy Config:', window.privy?.config);
```

Look for:
- `embeddedWallets.solana.createOnLogin`: Should be `'all-users'`
- Dashboard settings must allow wallet creation

## Common Issues & Fixes

### Issue 1: `createWallet` is `undefined`

**Cause**: Privy not fully initialized or wrong import

**Fix 1**: Check import in component:
```typescript
import { useWallets } from '@privy-io/react-auth';

const { createWallet } = useWallets();
```

**Fix 2**: Wait for Privy to be ready:
```typescript
const { ready } = usePrivy();

if (!ready) {
  return <div>Loading...</div>;
}
```

### Issue 2: Silent Failure (No Console Logs)

**Cause**: JavaScript error before `createWallet` is called

**Check**:
1. Browser console for errors
2. Network tab for failed requests
3. Component state is correct

**Fix**: Add error boundary:
```typescript
try {
  await createWallet();
} catch (error) {
  console.error('Detailed error:', error);
  alert(error.message);
}
```

### Issue 3: "Wallet creation not available" Error

**Cause**: Privy dashboard not configured correctly

**Fix**:
1. Go to: https://dashboard.privy.io/apps/cmg4z4scw00t4l70djk5v0o3e
2. Navigate to **Embedded Wallets**
3. Enable **Solana wallet creation**
4. Set to **"All users"** or **"Users without wallets"**
5. **Save changes**
6. Wait 2-3 minutes
7. Clear browser cache and retry

### Issue 4: Button Disabled

**Cause**: `createWallet` function not available

**Check in console**:
```javascript
console.log('createWallet available:', !!window.privy?.createWallet);
```

**Fix**: Ensure Privy provider is wrapping your component:
```typescript
<PrivyProvider appId="...">
  <YourComponent />
</PrivyProvider>
```

### Issue 5: Wallet Already Exists

**Cause**: User already has a wallet

**Check**:
```javascript
console.log('Existing wallets:', window.privy?.user?.linkedAccounts);
```

**Fix**: The button should be hidden if wallet exists. Check component logic:
```typescript
const solanaWallet = getSolanaWallet(wallets);
if (solanaWallet) {
  // Show wallet info, not create button
}
```

## Testing the Fix

### Test 1: Fresh User Account

```bash
1. Logout completely
2. Sign up with NEW email: test+[random]@example.com
3. Go to onboarding page
4. Click "Create Wallet"
5. Check console for logs
6. Should see wallet address appear
```

### Test 2: Check Network Requests

```bash
1. Open DevTools → Network tab
2. Click "Create Wallet"
3. Look for requests to Privy API
4. Check for errors (4xx, 5xx)
```

### Test 3: Verify Wallet Created

After clicking "Create Wallet":

```javascript
// In console:
console.log('Wallets after creation:', window.privy?.user?.linkedAccounts);

// Should show:
[
  {
    type: 'wallet',
    chainType: 'solana',
    address: '7KtZ...',
    walletClientType: 'privy'
  }
]
```

## Code Improvements Added

### 1. Loading State

Button now shows loading spinner:
```typescript
{creatingWallet ? (
  <>
    <Spinner />
    Creating Wallet...
  </>
) : (
  'Create Wallet'
)}
```

### 2. Error Display

Errors now shown to user:
```typescript
{walletError && (
  <div className="error-message">
    {walletError}
  </div>
)}
```

### 3. Better Error Handling

```typescript
try {
  await createWallet();
  console.log('✅ Success!');
} catch (error) {
  console.error('❌ Error:', error);
  setWalletError(error.message);
  alert(`Failed: ${error.message}`);
}
```

### 4. Disabled State

Button disabled while creating:
```typescript
<Button
  disabled={creatingWallet || !createWallet}
  onClick={handleCreateWallet}
>
```

## Manual Wallet Creation (Alternative Method)

If the button still doesn't work, try calling directly from console:

```javascript
// In browser console:
window.privy.createWallet().then(wallet => {
  console.log('Wallet created:', wallet);
}).catch(error => {
  console.error('Error:', error);
});
```

## Check Privy Dashboard Settings

### Required Settings:

1. **Go to Dashboard**: https://dashboard.privy.io/apps/cmg4z4scw00t4l70djk5v0o3e/settings

2. **Chains Section**:
   - ✅ Solana: **ENABLED**
   - ❌ Ethereum: **DISABLED**

3. **Embedded Wallets Section**:
   - ✅ Solana → Create on login: **"All users"**
   - ✅ Show wallet UIs: **ENABLED**

4. **Login Methods**:
   - ✅ Email: **ENABLED**
   - ✅ Google: **ENABLED**
   - ✅ Wallet: **ENABLED**

## Verify Environment Variables

Check `.env.local`:

```bash
NEXT_PUBLIC_PRIVY_APP_ID=cmg4z4scw00t4l70djk5v0o3e
PRIVY_APP_SECRET=5e5GzJPPaAALP5LWjsi3u59cGRmy2aop2s23StHShq7dqCi6DKumV8BwoEj2emY3n2KSkvszWDR7yPuLjVHLP3UK
```

**Both must be set** for Privy to work correctly.

## Common Error Messages

### "User is not authenticated"
**Fix**: Ensure user is logged in before calling `createWallet`

### "Embedded wallets not enabled"
**Fix**: Update Privy dashboard settings

### "Failed to create wallet: Network error"
**Fix**: Check internet connection, Privy API status

### "Wallet already exists"
**Fix**: User already has wallet, shouldn't see create button

## Still Not Working?

### Option 1: Restart Everything

```bash
# Kill dev server
pkill -f "next dev"

# Clear cache
rm -rf .next

# Restart
pnpm dev

# Clear browser cache
Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
```

### Option 2: Try Different Browser

- Test in Chrome (best support)
- Test in Incognito mode
- Test without browser extensions

### Option 3: Contact Privy Support

Email: support@privy.io

Include:
- App ID: `cmg4z4scw00t4l70djk5v0o3e`
- Error message from console
- Steps to reproduce
- Screenshot of dashboard settings

## Expected Working Behavior

### When Everything Works:

1. User clicks "Create Wallet" button
2. Button shows "Creating Wallet..." with spinner
3. Console logs: "🔑 Manually creating Solana wallet..."
4. ~2-3 seconds pass
5. Console logs: "✅ Wallet created successfully!"
6. Button disappears, wallet info appears
7. Shows Solana address (base58 format)
8. User can continue with onboarding

### Video of Expected Flow:

```
User → Click Button → Loading (2-3s) → Success → Wallet Displayed
```

---

**Last Updated**: September 30, 2025
**Status**: Debugging tools and improved error handling added
