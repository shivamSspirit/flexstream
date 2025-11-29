# Wallet Detection Fix Guide

## Issue
Privy is not detecting your installed Phantom wallet and asking you to download it.

## Root Causes & Solutions

### 1. **Phantom Not Set to Solana Network**

**Problem**: Phantom may be set to Ethereum network by default.

**Solution**:
1. Open Phantom extension
2. Click the network dropdown (top center)
3. Switch to **Solana** network
4. Refresh your app

### 2. **Browser Extension Not Properly Loaded**

**Solution**:
1. Close and reopen your browser
2. Make sure Phantom extension is enabled
3. Check extension icon appears in toolbar
4. Try in a new browser tab/window

### 3. **Privy Dashboard Configuration**

**CRITICAL**: Your Privy dashboard MUST have Solana enabled.

**Steps**:
1. Go to: https://dashboard.privy.io/apps/cmg4z4scw00t4l70djk5v0o3e/settings
2. Navigate to **"Chains"**
   - ✅ Enable: **Solana Mainnet**
   - ❌ Disable: **All Ethereum chains**
3. Navigate to **"External Wallets"**
   - ✅ Enable: **Phantom (Solana)**
   - ✅ Enable: **Solflare**
   - ❌ Disable: **MetaMask**
   - ❌ Disable: **All Ethereum wallets**
4. **Save changes**
5. **Wait 2-3 minutes** for propagation

### 4. **Clear Browser Cache & Extension Cache**

**Steps**:
```bash
# 1. Hard refresh browser
Cmd + Shift + R (Mac)
Ctrl + Shift + R (Windows)

# 2. Clear .next cache
cd /Users/shivamsoni/Desktop/forstreams/flexstream
rm -rf .next

# 3. Restart dev server
pnpm dev
```

### 5. **Browser Compatibility Issues**

**Recommended Browsers**:
- ✅ Chrome/Brave (Best support)
- ✅ Firefox (Good support)
- ⚠️ Safari (Limited extension support)
- ❌ Mobile browsers (Limited support)

**If using Safari**:
- Extensions have limited API access
- Try Chrome or Brave instead

### 6. **Extension Detection Timing**

**Problem**: Privy checks for wallets before extension fully loads.

**Solution**:
1. Wait 2-3 seconds after page load
2. Don't immediately click "Connect Wallet"
3. Refresh page if wallet doesn't appear

---

## Step-by-Step Debugging

### Step 1: Verify Phantom is Installed
1. Look for Phantom icon in browser toolbar
2. Click it - should open Phantom popup
3. Check if it shows accounts

### Step 2: Check Phantom Network
1. Open Phantom
2. Look at top of wallet
3. Should say **"Solana"** not "Ethereum"
4. If Ethereum, switch to Solana:
   - Click network dropdown
   - Select "Solana"

### Step 3: Test Phantom Detection
Open browser console (F12) and run:
```javascript
// Check if Phantom is loaded
console.log('Phantom Solana:', window.phantom?.solana);
console.log('Is Phantom:', window.phantom?.solana?.isPhantom);

// Check if connected
console.log('Is Connected:', window.phantom?.solana?.isConnected);
```

**Expected Output**:
```
Phantom Solana: Object { ... }
Is Phantom: true
Is Connected: false (or true if already connected)
```

**If `undefined`**:
- Phantom not properly loaded
- Wrong network selected
- Extension disabled

### Step 4: Force Reload Extension
1. Go to: `chrome://extensions` (Chrome/Brave)
2. Find Phantom
3. Click **"Reload"** button
4. Refresh your app

### Step 5: Check Privy Detection
In browser console:
```javascript
// Check what Privy sees
console.log('Privy ready:', window.privy);

// After opening Privy modal, check detected wallets
// (This will be logged by Privy)
```

---

## Alternative: Direct Wallet Connection

If Privy still doesn't detect your wallet, here's a workaround using standard Solana wallet adapter:

### Option A: Use @solana/wallet-adapter

I can add a fallback connection method that uses the standard Solana wallet adapter instead of relying on Privy's detection.

### Option B: Manual Connection

Add a "Connect Manually" button that directly calls Phantom's API:

```typescript
const connectPhantom = async () => {
  try {
    const { solana } = window as any;
    if (solana?.isPhantom) {
      const response = await solana.connect();
      console.log('Connected:', response.publicKey.toString());
    } else {
      alert('Phantom not found');
    }
  } catch (err) {
    console.error('Connection failed:', err);
  }
};
```

---

## Testing Checklist

Go through this in order:

- [ ] Phantom extension installed
- [ ] Phantom is on **Solana** network (not Ethereum)
- [ ] Extension is enabled (check chrome://extensions)
- [ ] Browser restarted after installing extension
- [ ] Privy dashboard has Solana enabled
- [ ] Privy dashboard has Ethereum disabled
- [ ] Waited 2-3 minutes after saving dashboard settings
- [ ] Cleared browser cache (Cmd+Shift+R)
- [ ] Cleared .next cache (rm -rf .next)
- [ ] Restarted dev server
- [ ] Opened app in new incognito window
- [ ] Tried Chrome/Brave instead of Safari

---

## Quick Fixes to Try NOW

### Fix 1: Phantom Network Switch
```
1. Open Phantom
2. Click network at top
3. Select "Solana"
4. Refresh app
```

### Fix 2: Hard Reset Everything
```bash
# Terminal:
cd /Users/shivamsoni/Desktop/forstreams/flexstream
pkill -f "next dev"
rm -rf .next
pnpm dev

# Browser:
1. Close all tabs
2. Quit browser completely
3. Reopen browser
4. Open app in new tab
```

### Fix 3: Try Incognito Mode
```
1. Open Chrome/Brave
2. Cmd+Shift+N (incognito)
3. Enable Phantom in incognito (chrome://extensions)
4. Visit your app
5. Test wallet connection
```

---

## Still Not Working?

### Last Resort Options:

#### 1. **Check Phantom Installation**
- Uninstall Phantom extension
- Restart browser
- Reinstall Phantom from: https://phantom.app
- Set up wallet on Solana network
- Try again

#### 2. **Use Solflare Instead**
- Install Solflare: https://solflare.com
- Should have better Privy compatibility
- Try connecting with Solflare

#### 3. **Create Embedded Wallet**
- Instead of connecting external wallet
- Sign up with email
- Privy will auto-create Solana wallet
- Use that for now
- Can import to Phantom later

#### 4. **Contact Privy Support**
Email: support@privy.io
Subject: "Phantom Solana wallet not detected"
Include:
- App ID: cmg4z4scw00t4l70djk5v0o3e
- Browser: [Your browser + version]
- Phantom version: [Check in extension]
- Screenshot of Privy modal

---

## Expected Behavior (When Working)

### What You Should See:

1. **Login Modal Opens**
2. **Top of Modal Shows**:
   - "Connect your Solana wallet"
3. **First Option**:
   - Phantom icon (purple ghost)
   - "Phantom" text
   - "Detected" badge (if installed)
4. **Clicking Phantom**:
   - Phantom popup opens
   - Shows your Solana account
   - "Connect" button
5. **After Connecting**:
   - Modal closes
   - User is logged in
   - Dashboard shows Solana address

### What You're Probably Seeing:

1. Login modal opens
2. Phantom shows "Not Detected" or "Download"
3. Clicking opens download page
4. No detection of installed extension

---

## Technical Details

### How Privy Detects Wallets

Privy checks for:
```javascript
window.phantom?.solana?.isPhantom === true
```

### Common Detection Failures:

1. **Wrong Network**: Phantom on Ethereum
2. **Timing**: Extension loads after Privy checks
3. **Permissions**: Extension blocked by browser
4. **Dashboard**: Ethereum enabled in Privy dashboard

---

## Need Help?

If none of these work, let me know and I can:
1. Add custom wallet detection logic
2. Implement fallback connection method
3. Create alternative login flow
4. Debug specific error messages

**Current Status**: Code is correct, likely a configuration or browser issue.

**Most Common Fix**: Switch Phantom to Solana network + Update Privy dashboard
