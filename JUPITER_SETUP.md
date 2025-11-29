# Jupiter Swap Integration Setup Guide

This guide will help you set up Jupiter swap functionality on FlexStream platform using the **free tier** (1 request per second).

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [Initial Setup](#initial-setup)
4. [Database Setup](#database-setup)
5. [Testing](#testing)
6. [Fee Management](#fee-management)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:

- ✅ A Solana wallet with at least 0.1 SOL for setup
- ✅ Supabase project set up
- ✅ Node.js and pnpm installed
- ✅ Access to your `.env.local` file

---

## Environment Variables

Add these to your `.env.local` file:

```bash
# Solana Configuration
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Platform Wallet (DO NOT COMMIT TO GIT!)
# This is your platform's wallet for collecting fees
# Generate with: solana-keygen new
# Then export with: solana-keygen export
PLATFORM_WALLET_SECRET=your_base58_encoded_secret_key_here

# Jupiter Referral Configuration (added after running setup script)
JUPITER_REFERRAL_ACCOUNT=will_be_generated_by_setup_script
JUPITER_REFERRAL_FEE_BPS=100  # 1% platform fee (100 basis points)

# Optional: Increase if you need higher RPC limits
# Free public RPC has rate limits, consider using:
# - Helius (https://helius.dev)
# - QuickNode (https://quicknode.com)
# - Alchemy (https://alchemy.com)
```

### ⚠️ Security Warning

**NEVER commit `PLATFORM_WALLET_SECRET` to version control!**

Make sure `.env.local` is in your `.gitignore`:

```bash
# .gitignore
.env.local
.env*.local
```

---

## Initial Setup

### Step 1: Install Dependencies

Dependencies are already installed. Verify with:

```bash
pnpm list @jup-ag/referral-sdk @solana/web3.js
```

You should see:
- `@jup-ag/referral-sdk 0.3.0`
- `@solana/web3.js 1.98.4`

### Step 2: Create Platform Wallet (if you don't have one)

If you don't have a platform wallet yet:

```bash
# Install Solana CLI if not installed
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Generate new wallet
solana-keygen new --outfile ~/flexstream-platform-wallet.json

# Export private key in base58 format
solana-keygen export ~/flexstream-platform-wallet.json
```

Copy the output and add it to `.env.local` as `PLATFORM_WALLET_SECRET`.

### Step 3: Fund Your Platform Wallet

```bash
# Check your wallet address
solana address -k ~/flexstream-platform-wallet.json

# Send at least 0.1 SOL to this address
# You can use Phantom wallet or any exchange
```

### Step 4: Run Jupiter Referral Setup

```bash
npx ts-node scripts/setup-jupiter-referral.ts
```

This script will:
1. Create your Jupiter referral account
2. Initialize token accounts for SOL, USDC, and USDT
3. Output your `JUPITER_REFERRAL_ACCOUNT` address

**Copy the output and add it to your `.env.local` file!**

Example output:
```
JUPITER_REFERRAL_ACCOUNT=ABC123...XYZ789
```

---

## Database Setup

### Run the SQL Schema

1. Open your Supabase project
2. Go to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of `supabase-jupiter-schema.sql`
5. Click **Run**

This will create:
- `jupiter_swaps` table - Tracks all swaps
- `jupiter_quotes` table - Tracks quote requests
- `jupiter_fee_distributions` table - Aggregates fees per creator
- `jupiter_fee_claims` table - Tracks fee distributions
- `creator_earnings_dashboard` view - Creator earnings summary

### Verify Tables Created

Run this query in Supabase SQL Editor:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'jupiter_%';
```

You should see 4 tables.

---

## Testing

### Step 1: Start Development Server

```bash
pnpm dev
```

### Step 2: Test Swap Flow

1. Go to http://localhost:3000
2. Find a post with a token (or create one)
3. Click the **Buy** button
4. The SwapModal should open
5. Enter an amount in SOL
6. Click **Swap**
7. Approve transaction in your wallet
8. Wait for confirmation

### Step 3: Verify in Database

Check if the swap was recorded:

```sql
SELECT *
FROM jupiter_swaps
ORDER BY created_at DESC
LIMIT 5;
```

### Step 4: Check Fees

View accumulated fees:

```bash
npx ts-node scripts/claim-jupiter-fees.ts --view
```

---

## Fee Management

### View Current Fees

```bash
npx ts-node scripts/claim-jupiter-fees.ts --view
```

Output:
```
💰 Checking fees owed...

Fees owed by token:
═══════════════════════════════════════════════════════════

   SOL (WSOL)
   Amount: 0.01234567 (12345670 lamports)
   ~$1.23 USD

   USDC
   Amount: 5.432100 (5432100 lamports)
   ~$5.43 USD

═══════════════════════════════════════════════════════════
Total estimated value: ~$6.66 USD
```

### Claim Fees

```bash
npx ts-node scripts/claim-jupiter-fees.ts --claim
```

This transfers fees from Jupiter's referral account to your platform wallet.

### Fee Split Recommendations

Jupiter gives you **80%** of collected fees (20% goes to Jupiter).

Suggested splits for FlexStream:
- **Platform: 40%** (covers infrastructure, development)
- **Creator: 40%** (incentivizes content creation)
- **Jupiter: 20%** (automatically deducted)

To implement creator distribution:
1. Claim fees to platform wallet
2. Query `jupiter_fee_distributions` table
3. Calculate each creator's share
4. Send SPL tokens to creator wallets
5. Update `jupiter_fee_claims` table

---

## API Endpoints

### GET/POST `/api/jupiter/quote`

Get a swap quote.

**Request:**
```json
{
  "inputMint": "So11111111111111111111111111111111111111112",
  "outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "amount": 100000000,
  "taker": "UserWalletAddress..."
}
```

**Response:**
```json
{
  "transaction": "base64_encoded_transaction",
  "requestId": "unique_id",
  "inAmount": "100000000",
  "outAmount": "95432100",
  "feeBps": 100,
  "priceImpact": 0.1,
  "isGasless": false,
  "rateLimit": {
    "tier": "free",
    "rps": 1
  }
}
```

### POST `/api/jupiter/execute`

Execute a signed swap transaction.

**Request:**
```json
{
  "signedTransaction": "base64_encoded_signed_transaction",
  "requestId": "unique_id_from_quote"
}
```

**Response:**
```json
{
  "status": "success",
  "signature": "transaction_signature",
  "explorerUrl": "https://solscan.io/tx/..."
}
```

### GET `/api/jupiter/shield`

Check token risks before swapping.

**Request:**
```
GET /api/jupiter/shield?mints=TokenMintAddress1,TokenMintAddress2
```

**Response:**
```json
{
  "TokenMintAddress1": {
    "warnings": [
      {
        "type": "unverified",
        "severity": "warning",
        "message": "Token is not verified"
      }
    ]
  },
  "summary": {
    "totalTokens": 2,
    "hasWarnings": true,
    "hasErrors": false
  }
}
```

---

## Troubleshooting

### Problem: "Rate limit exceeded" errors

**Solution:** You're on the free tier (1 RPS). Wait 1 second between requests or upgrade.

```typescript
// Already implemented in API routes
await waitForRateLimit(); // Enforces 1 second delay
```

### Problem: No fees being collected

**Possible causes:**
1. `JUPITER_REFERRAL_ACCOUNT` not set
2. Token account not initialized for that fee token
3. User is using gasless mode (no fees on gasless)

**Solution:**
```bash
# Check if referral account is set
echo $JUPITER_REFERRAL_ACCOUNT

# Re-run setup if missing
npx ts-node scripts/setup-jupiter-referral.ts
```

### Problem: "Insufficient SOL for gas" error

**Solution:**
- User needs at least 0.01 SOL for transaction fees
- Or enable gasless mode (trade > $10, user has < 0.01 SOL)

### Problem: Transaction fails with "Slippage exceeded"

**Solution:**
- Price moved during transaction
- Ask user to retry
- Consider adding slippage tolerance parameter

### Problem: Can't see SwapModal

**Possible causes:**
1. Post doesn't have `token_address`
2. React component error
3. Wallet not connected

**Check console for errors:**
```bash
# Browser console (F12)
# Look for React errors or missing props
```

---

## Free Tier Limitations

### Current Limits (Jupiter Free Tier)

- **Rate Limit:** 1 request per second
- **No API Key Required:** Can start immediately
- **Full API Access:** All features available
- **Automatic Scaling:** Limits increase with volume

### Rate Limit Scaling

| 24h Swap Volume | Requests/10s | RPS |
|-----------------|--------------|-----|
| $0              | 50           | 5   |
| $10,000         | 51           | 5.1 |
| $100,000        | 61           | 6.1 |
| $1,000,000+     | 165          | 16.5|

### Handling Rate Limits

Rate limiting is **automatically handled** in the API routes:

```typescript
// Implemented in /app/api/jupiter/*/route.ts
await waitForRateLimit(); // Enforces 1 second delay
```

For production with high traffic:
1. Consider caching quotes for a few seconds
2. Implement request queuing
3. Use optimistic UI updates
4. Or upgrade to paid tier (when needed)

---

## Next Steps

1. ✅ Complete initial setup
2. ✅ Test swaps on devnet first
3. ✅ Deploy to production
4. 📊 Monitor swap volume and fees
5. 💰 Set up automated fee claiming (cron job)
6. 🎨 Customize SwapModal styling
7. 📈 Add swap analytics dashboard

---

## Support & Resources

- **Jupiter Docs:** https://dev.jup.ag
- **Discord:** https://discord.gg/jup
- **API Status:** https://status.jup.ag
- **GitHub Issues:** https://github.com/jup-ag/jupiter-api

---

## Summary

You've successfully integrated Jupiter swap functionality into FlexStream! 🎉

**What you can do now:**
- ✅ Users can swap SOL for post/profile tokens
- ✅ Platform collects 1% fee on each swap
- ✅ Gasless transactions for new users
- ✅ Risk warnings for suspicious tokens
- ✅ Track all swaps in database
- ✅ Claim and distribute fees to creators

**Free tier is perfect for:**
- Testing and development
- Small to medium traffic
- MVP launches
- Proof of concept

**Consider upgrading when:**
- You consistently hit rate limits
- Need faster response times
- Have > 1000 swaps per day
- Want dedicated support

---

Made with ❤️ for FlexStream
Powered by Jupiter 🪐
