# Backend-Only DBC Token Creation - Setup Guide

## Overview

This implementation allows your platform to automatically create DBC tokens for each post **without requiring user wallet signatures**. The platform pays all transaction fees from a dedicated keypair.

## How It Works

### Traditional Flow (OLD)
1. User creates post
2. Backend prepares transaction
3. **User signs transaction** ← User interaction required
4. Transaction submitted to blockchain
5. Post saved to database

### Backend-Only Flow (NEW)
1. User creates post
2. Backend creates and signs transaction **automatically**
3. Transaction submitted to blockchain
4. Post saved to database
5. ✅ Complete - no user signature needed!

## Setup Steps

### 1. Generate Platform Keypair

You need a dedicated Solana wallet (keypair) that will:
- Pay transaction fees for all token creations
- Act as the pool creator for all DBC pools
- Use the same DBC config key for all tokens

**Option A: Using Solana CLI**
```bash
# Install Solana CLI if not already installed
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Generate a new keypair
solana-keygen new --outfile platform-keypair.json

# View the public key
solana-keygen pubkey platform-keypair.json
```

**Option B: Using Node.js Script**
```javascript
// generate-platform-keypair.js
const { Keypair } = require('@solana/web3.js');
const fs = require('fs');

// Generate new keypair
const keypair = Keypair.generate();

// Save to file
const secretKey = Array.from(keypair.secretKey);
fs.writeFileSync(
  'platform-keypair.json',
  JSON.stringify(secretKey)
);

console.log('Platform Public Key:', keypair.publicKey.toBase58());
console.log('Secret key saved to platform-keypair.json');
console.log('Secret key array:', JSON.stringify(secretKey));
```

Run it:
```bash
node generate-platform-keypair.js
```

**Option C: Using Existing Wallet**

If you have an existing wallet from Phantom, Solflare, etc:
1. Export your private key (base58 format)
2. Use it directly in the environment variable

### 2. Fund the Platform Wallet

The platform wallet needs SOL to pay transaction fees.

**For Devnet (Testing):**
```bash
# Get the public key from step 1
solana airdrop 2 YOUR_PLATFORM_PUBLIC_KEY --url devnet

# Check balance
solana balance YOUR_PLATFORM_PUBLIC_KEY --url devnet
```

**For Mainnet (Production):**
- Transfer SOL to the platform wallet address
- Recommended: Start with 1-2 SOL
- Each token creation costs ~0.01-0.02 SOL
- Monitor and refill as needed

### 3. Configure Environment Variables

Add the platform keypair secret to your `.env.local` file:

**Format 1: JSON Array (Recommended)**
```env
# Platform keypair secret key (from platform-keypair.json)
PLATFORM_KEYPAIR_SECRET=[123,45,67,89,...]
```

**Format 2: Base58 String**
```env
# Platform keypair secret key (from wallet export)
PLATFORM_KEYPAIR_SECRET=5Jv8... (your base58 private key)
```

**Complete .env.local Example:**
```env
# Existing Supabase config
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Existing Meteora DBC config
POOL_CONFIG_KEY=GDo9K18dcHx34zefEoS7JkRPKgMQpEnS4ASDLBBbmcWF
NEXT_PUBLIC_METEORA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_METEORA_NETWORK=devnet

# NEW: Platform keypair for backend token creation
PLATFORM_KEYPAIR_SECRET=[123,45,67,89,...]  # Your secret key here

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Verify Setup

Test that the platform keypair is configured correctly:

**Create a test script: `test-platform-keypair.js`**
```javascript
import { getPlatformKeypair } from './lib/meteora-dbc';

async function test() {
  try {
    const keypair = getPlatformKeypair();
    console.log('✅ Platform keypair loaded successfully!');
    console.log('Public Key:', keypair.publicKey.toBase58());
  } catch (error) {
    console.error('❌ Error loading platform keypair:', error.message);
  }
}

test();
```

Run it:
```bash
node test-platform-keypair.js
```

## Security Best Practices

### 🔒 Production Security

1. **Never commit the private key to git**
   - Add `.env.local` to `.gitignore`
   - Never share the private key publicly
   - Use environment variables in production

2. **Use environment-specific keys**
   - Different keypairs for dev/staging/production
   - Different keypairs for devnet vs mainnet

3. **Monitor the platform wallet**
   - Set up alerts for low balance
   - Monitor for unusual activity
   - Keep transaction logs

4. **Rotate keys periodically**
   - Generate new keypairs every few months
   - Transfer remaining SOL to new wallet
   - Update environment variables

5. **Use secure key management**
   - Consider using services like AWS Secrets Manager, Vault, or similar
   - Never store keys in plain text in production databases
   - Use encrypted storage for production keys

### 💰 Cost Management

**Estimated Costs (Devnet):**
- Token creation: ~0.01-0.02 SOL per token
- 100 posts = ~1-2 SOL

**Estimated Costs (Mainnet):**
- Token creation: ~0.01-0.02 SOL per token
- 100 posts = 1-2 SOL (~$100-$200 at $100/SOL)

**Cost Optimization:**
- Monitor transaction fees
- Consider passing costs to users (optional)
- Implement rate limiting to prevent abuse
- Set up auto-refill when balance is low

## DBC Config Key

Your platform uses a **single DBC config key** for all token pools. This is already configured:

```typescript
CONFIG_KEY: 'GDo9K18dcHx34zefEoS7JkRPKgMQpEnS4ASDLBBbmcWF'
```

This config key:
- Defines the bonding curve parameters
- Can be used for unlimited token pools
- Is shared across all tokens on your platform
- Determines fee structure and migration settings

To customize the config key (optional):
- Use the Meteora DBC SDK to create a custom config
- Update the `POOL_CONFIG_KEY` environment variable
- See: https://docs.meteora.ag/developer-guide/guides/dbc/bonding-curve-configs

## Testing

### Test on Devnet First

1. Set up devnet configuration:
```env
NEXT_PUBLIC_METEORA_NETWORK=devnet
NEXT_PUBLIC_METEORA_RPC_URL=https://api.devnet.solana.com
```

2. Fund platform wallet on devnet (see step 2 above)

3. Create a test post through your app

4. Verify transaction on Solana Explorer:
   - Devnet: `https://explorer.solana.com/?cluster=devnet`
   - Look for your platform wallet's recent transactions

### Production Deployment

1. Generate a new platform keypair for mainnet
2. Fund it with SOL
3. Update environment variables:
```env
NEXT_PUBLIC_METEORA_NETWORK=mainnet
NEXT_PUBLIC_METEORA_RPC_URL=https://api.mainnet-beta.solana.com
PLATFORM_KEYPAIR_SECRET=[your mainnet keypair]
```

4. Test thoroughly before going live!

## Troubleshooting

### Error: "PLATFORM_KEYPAIR_SECRET not configured"
- Check that the environment variable is set in `.env.local`
- Restart your Next.js development server
- Verify the variable name is exactly `PLATFORM_KEYPAIR_SECRET`

### Error: "Failed to parse PLATFORM_KEYPAIR_SECRET"
- Verify the format is correct (JSON array or base58)
- Check for typos or missing characters
- Ensure the entire array is included (64 bytes = 64 numbers)

### Error: "Insufficient funds"
- Platform wallet needs SOL for transaction fees
- Use `solana balance` to check wallet balance
- Fund the wallet using airdrop (devnet) or transfer (mainnet)

### Transactions failing silently
- Check Solana network status
- Verify RPC endpoint is responding
- Check transaction logs on Solana Explorer
- Ensure platform wallet has enough SOL

## Benefits of Backend Token Creation

✅ **Better UX**: Users don't need to sign transactions or pay fees
✅ **Faster**: No waiting for user approval
✅ **Simpler**: No wallet connection required during post creation
✅ **Reliable**: No failed transactions due to user rejection
✅ **Scalable**: Platform controls all token creation

## API Changes

### Old Flow
```typescript
// POST /api/posts/create
{
  "success": true,
  "requiresSignature": true,  // User must sign
  "data": {
    "transaction": "base64..."  // Unsigned transaction
  }
}

// POST /api/posts/confirm (after user signs)
{
  "success": true,
  "data": { ... }
}
```

### New Flow
```typescript
// POST /api/posts/create (only endpoint needed!)
{
  "success": true,
  "data": {
    "signature": "txid...",  // Already confirmed!
    "post": { ... },
    "token": { ... },
    "explorerUrl": "..."
  }
}
```

## Support

For issues or questions:
1. Check the Meteora DBC docs: https://docs.meteora.ag/developer-guide/guides/dbc/overview
2. Review the implementation in `lib/meteora-dbc.ts`
3. Check platform wallet balance and transaction logs

---

**Ready to go!** Follow the setup steps above to enable backend-only token creation.
