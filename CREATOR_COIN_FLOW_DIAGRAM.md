# Creator Coin Activation Flow - Visual Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CREATOR COIN ACTIVATION FLOW                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 1: Profile Page Load                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    /profile/[username]/page.tsx
                                    │
                    ┌───────────────▼────────────────┐
                    │  Load User Profile Data         │
                    │  - username                     │
                    │  - display_name                 │
                    │  - bio                          │
                    │  - avatar_url                   │
                    │  - creator_coin_enabled         │
                    └───────────────┬────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │  Check creator_coin_enabled    │
                    └───────────────┬────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │  If FALSE:                     │
                    │    Show "Activate Coin" Button │
                    │  If TRUE:                      │
                    │    Show Creator Coin Section   │
                    └───────────────┬────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 2: Button Click & Validation                                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │  User Clicks "Activate Coin"   │
                    └───────────────┬────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │  Validate Profile Complete:    │
                    │  - display_name exists?        │
                    │  - bio exists?                 │
                    │  - avatar_url exists?          │
                    └───────────────┬────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │  If INCOMPLETE:                │
                    │    Toast: "Complete profile"   │
                    │    STOP                        │
                    │  If COMPLETE:                  │
                    │    Continue ──────────────────►│
                    └───────────────┬────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 3: Modal Opens                                                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
      components/creator-coin/ActivateCreatorCoinModal.tsx
                                    │
                    ┌───────────────▼────────────────┐
                    │  setShowActivateCoinModal(true)│
                    └───────────────┬────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │  Modal Renders:                │
                    │  ┌──────────────────────────┐  │
                    │  │ Activate Creator Coin    │  │
                    │  ├──────────────────────────┤  │
                    │  │ Launch your own token    │  │
                    │  │ $USERNAME ← FIXED ✓      │  │
                    │  │                          │  │
                    │  │ Benefits:                │  │
                    │  │ ✓ Monetize content       │  │
                    │  │ ✓ Reward supporters      │  │
                    │  │ ✓ Build community        │  │
                    │  │ ✓ Earn trading fees      │  │
                    │  │                          │  │
                    │  │ [Cancel]  [Activate]     │  │
                    │  └──────────────────────────┘  │
                    └───────────────┬────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 4: User Clicks Activate                                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │  handleActivate() called       │
                    └───────────────┬────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │  Check Wallet Connected?       │
                    │  useWallet() from Jupiter      │
                    └───────────────┬────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │  If NOT connected:             │
                    │    Toast: "Connect wallet"     │
                    │    STOP                        │
                    │  If connected:                 │
                    │    Continue ──────────────────►│
                    └───────────────┬────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │  setIsActivating(true)         │
                    │  setStep('activating')         │
                    └───────────────┬────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │  UI Shows:                     │
                    │  ┌──────────────────────────┐  │
                    │  │      🔄 Loading...       │  │
                    │  │                          │  │
                    │  │     Activating...        │  │
                    │  │ Creating your creator    │  │
                    │  │         coin             │  │
                    │  └──────────────────────────┘  │
                    └───────────────┬────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 5: API Call                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │  POST /api/creators/           │
                    │       activate-coin            │
                    │                                │
                    │  Body:                         │
                    │  {                             │
                    │    walletAddress: "...",       │
                    │    username: "johndoe",        │
                    │    displayName: "John Doe",    │
                    │    bio: "...",                 │
                    │    avatarUrl: "..."            │
                    │  }                             │
                    └───────────────┬────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 6: API Processing (Backend)                                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
            app/api/creators/activate-coin/route.ts
                                    │
                    ┌───────────────▼────────────────┐
                    │  1. Validate Supabase Config   │
                    └───────────────┬────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │  2. Find User by Wallet        │
                    │     SELECT * FROM users        │
                    │     WHERE wallet_address = ... │
                    └───────────────┬────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │  3. Check creator_coin_enabled │
                    │     If TRUE → Error: Already   │
                    │     If FALSE → Continue        │
                    └───────────────┬────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │  4. Init Meteora DBC Client    │
                    │     lib/meteora-dbc.ts         │
                    └───────────────┬────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │  5. Generate Unique Symbol     │
                    │     Format: T5K9PA7M3          │
                    │     (9 chars, timestamp+random)│
                    └───────────────┬────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │  6. Upload Metadata            │
                    │     - name: "John Doe Token"   │
                    │     - symbol: "T5K9PA7M3"      │
                    │     - description: "..."       │
                    │     - image: avatar_url        │
                    │     - external_url: profile    │
                    │     → Supabase Storage         │
                    └───────────────┬────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │  7. Create Token & Pool        │
                    │     Meteora DBC SDK:           │
                    │     - Supply: 10B tokens       │
                    │     - Fee: 1% (100 bps)        │
                    │     - Config: CREATOR          │
                    │     - Platform wallet signs    │
                    └───────────────┬────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │  8. Transaction Submitted      │
                    │     - Create mint              │
                    │     - Create pool              │
                    │     - Init bonding curve       │
                    │     → Solana Devnet            │
                    └───────────────┬────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │  9. Wait for Confirmation      │
                    │     Commitment: 'confirmed'    │
                    └───────────────┬────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │  10. Update User Record        │
                    │      UPDATE users SET          │
                    │      creator_coin_enabled=true │
                    │      creator_coin_mint='...'   │
                    │      creator_coin_pool='...'   │
                    │      creator_coin_metadata_uri │
                    │      WHERE id = ...            │
                    └───────────────┬────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │  11. Return Success Response   │
                    │      {                         │
                    │        success: true,          │
                    │        data: {                 │
                    │          user: {...},          │
                    │          token: {              │
                    │            mint: "...",        │
                    │            pool: "...",        │
                    │            signature: "..."    │
                    │          }                     │
                    │        }                       │
                    │      }                         │
                    └───────────────┬────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 7: Frontend Receives Success                                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │  Parse Response Data           │
                    │  result.data.token.mint        │
                    └───────────────┬────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │  setTokenMint(mint)            │
                    │  setStep('success')            │
                    │  toast.success("Activated!")   │
                    └───────────────┬────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │  UI Shows:                     │
                    │  ┌──────────────────────────┐  │
                    │  │      ✅ Success!         │  │
                    │  │                          │  │
                    │  │  Your creator coin is    │  │
                    │  │       now live           │  │
                    │  │                          │  │
                    │  │  View on Solscan →       │  │
                    │  │  (links to token)        │  │
                    │  │  ← FIXED ✓               │  │
                    │  └──────────────────────────┘  │
                    └───────────────┬────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │  setTimeout(2000)              │
                    │  After 2 seconds:              │
                    │    onSuccess() called          │
                    │    onClose() called            │
                    └───────────────┬────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 8: Profile Reload                                                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │  onSuccess() Callback          │
                    │  - setShowActivateCoinModal    │
                    │    (false)                     │
                    │  - loadUserProfile()           │
                    └───────────────┬────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │  Fetch Updated User Data       │
                    │  SELECT * FROM users           │
                    │  WHERE username = ...          │
                    └───────────────┬────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │  Profile State Updates         │
                    │  creator_coin_enabled: true    │
                    │  creator_coin_mint: "..."      │
                    │  creator_coin_pool: "..."      │
                    └───────────────┬────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 9: UI Updates (Final State)                                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │  "Activate Coin" Button        │
                    │  ❌ HIDDEN (disappears)        │
                    └────────────────────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │  Creator Coin Section          │
                    │  ✅ VISIBLE (appears)          │
                    │  ┌──────────────────────────┐  │
                    │  │ 🪙 Creator Coin Active   │  │
                    │  │                          │  │
                    │  │ $USERNAME                │  │
                    │  │ CA: 5Fww...xB2m          │  │
                    │  │                          │  │
                    │  │ [Trade Now] ──────────►  │  │
                    │  └──────────────────────────┘  │
                    │                                │
                    │  ┌─────────┬─────────┐        │
                    │  │Market Cap│  Price │        │
                    │  │ $12.2K   │ $0.042 │        │
                    │  └─────────┴─────────┘        │
                    │                                │
                    │  ┌──────────────────────────┐  │
                    │  │ 👥 Top Holders           │  │
                    │  │ • devjak.sol - 45%       │  │
                    │  │ • whale.sol - 32%        │  │
                    │  └──────────────────────────┘  │
                    └────────────────────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │  ✅ FLOW COMPLETE!             │
                    │  Creator coin is now:          │
                    │  - Created on Solana           │
                    │  - Visible on profile          │
                    │  - Tradeable on Jupiter        │
                    │  - Viewable on Solscan         │
                    └────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│ KEY COMPONENTS                                                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│ Frontend Components                                                         │
├────────────────────────────────────────────────────────────────────────────┤
│ • /app/profile/[username]/page.tsx                                         │
│   → Profile page with button and modal integration                         │
│                                                                             │
│ • /components/creator-coin/ActivateCreatorCoinModal.tsx                    │
│   → Modal UI, state management, API calls                                  │
│   → FIXED: Line 122 (username) & Line 171 (tokenMint)                      │
│                                                                             │
│ • @jup-ag/wallet-adapter                                                    │
│   → Wallet connection via Jupiter                                          │
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│ Backend Components                                                          │
├────────────────────────────────────────────────────────────────────────────┤
│ • /app/api/creators/activate-coin/route.ts                                 │
│   → API endpoint for token creation                                        │
│                                                                             │
│ • /lib/meteora-dbc.ts                                                       │
│   → Meteora DBC SDK integration                                            │
│   → Token creation, metadata upload                                        │
│                                                                             │
│ • /lib/dbc-config.ts                                                        │
│   → Configuration for CREATOR tokens                                       │
│   → 10B supply, 1% fee, config key                                         │
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│ External Services                                                           │
├────────────────────────────────────────────────────────────────────────────┤
│ • Supabase                                                                  │
│   → User database storage                                                  │
│   → Token metadata storage                                                 │
│                                                                             │
│ • Meteora DBC                                                               │
│   → Token creation via bonding curve                                       │
│   → Pool initialization                                                    │
│                                                                             │
│ • Solana Devnet                                                             │
│   → Blockchain transactions                                                │
│   → Token mint on-chain                                                    │
│                                                                             │
│ • Solscan                                                                   │
│   → Block explorer for verification                                        │
│   → Token viewing                                                          │
└────────────────────────────────────────────────────────────────────────────┘
```

## Key Data Flow

```
User Input
    ↓
Modal State Management
    ↓
API Request (POST)
    ↓
Database Validation
    ↓
Meteora DBC SDK
    ↓
Solana Transaction
    ↓
Database Update
    ↓
API Response
    ↓
Modal Success State
    ↓
Profile Reload
    ↓
UI Update Complete
```

## Error Handling Points

1. **Profile Incomplete** → Toast notification
2. **Wallet Not Connected** → Toast error
3. **User Not Found** → API 404 error
4. **Coin Already Activated** → API 400 error
5. **Metadata Upload Failed** → API 500 error
6. **Token Creation Failed** → API 500 error
7. **Database Update Failed** → API 500 error

## Success Indicators

✅ Modal opens
✅ Username displays dynamically
✅ Loading state shows
✅ Transaction confirmed
✅ Solscan link correct
✅ Modal closes
✅ Profile reloads
✅ Coin section appears
