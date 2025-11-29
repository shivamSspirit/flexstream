# DBC Integration Implementation Guide

## Overview
This guide explains how to integrate DBC (Decentralized Bonding Curve) token creation with post creation in FlexStream.

## Your Setup
- **DBC Config Key**: `GDo9K18dcHx34zefEoS7JkRPKgMQpEnS4ASDLBBbmcWF`
- **Helius RPC**: Available
- **Supabase**: Configured
- **Network**: Devnet

---

## Step 1: Install DBC SDK

First, you need the actual DBC SDK. Check with DBC team for the package name.

```bash
# Replace with actual DBC package
npm install @dbc/sdk
# OR
npm install your-dbc-package-name
```

---

## Step 2: Update Environment Variables

Add to `.env.local`:

```env
# DBC Configuration
NEXT_PUBLIC_DBC_CONFIG_KEY=GDo9K18dcHx34zefEoS7JkRPKgMQpEnS4ASDLBBbmcWF
NEXT_PUBLIC_DBC_PROGRAM_ID=YOUR_DBC_PROGRAM_ID
NEXT_PUBLIC_SOLANA_NETWORK=devnet

# Existing Helius RPC
NEXT_PUBLIC_HELIUS_RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR_KEY

# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

---

## Step 3: Update Supabase Schema

Add token fields to your `posts` table:

```sql
-- Add new columns to posts table
ALTER TABLE posts
ADD COLUMN token_mint TEXT,
ADD COLUMN token_symbol TEXT,
ADD COLUMN token_name TEXT,
ADD COLUMN bonding_curve_address TEXT,
ADD COLUMN initial_price DECIMAL,
ADD COLUMN current_market_cap DECIMAL,
ADD COLUMN token_created_at TIMESTAMP,
ADD COLUMN is_token_tradable BOOLEAN DEFAULT false;

-- Create index for faster queries
CREATE INDEX idx_posts_token_mint ON posts(token_mint);
CREATE INDEX idx_posts_bonding_curve ON posts(bonding_curve_address);

-- Create a tokens table for better tracking
CREATE TABLE IF NOT EXISTS tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mint_address TEXT UNIQUE NOT NULL,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_uri TEXT,
  creator_wallet TEXT NOT NULL,
  post_id UUID REFERENCES posts(id),
  bonding_curve_address TEXT,
  initial_supply BIGINT,
  current_supply BIGINT,
  market_cap DECIMAL,
  price_usd DECIMAL,
  price_sol DECIMAL,
  volume_24h DECIMAL,
  holders_count INT DEFAULT 0,
  is_tradable BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for tokens
CREATE INDEX idx_tokens_mint ON tokens(mint_address);
CREATE INDEX idx_tokens_post ON tokens(post_id);
CREATE INDEX idx_tokens_creator ON tokens(creator_wallet);
```

---

## Step 4: Replace DBC SDK Placeholders

In `/lib/dbc.ts`, replace the placeholder code with actual DBC SDK calls:

```typescript
import { DBCClient } from '@dbc/sdk'; // Replace with actual import

// Initialize DBC client
const connection = new Connection(HELIUS_RPC, 'confirmed');
const dbcClient = new DBCClient({
  configKey: new PublicKey(DBC_CONFIG_KEY),
  connection,
  network: 'devnet',
});

// Create token function
export async function createTokenForPost(
  connection: Connection,
  params: CreateTokenParams
): Promise<TokenMetadata> {
  try {
    // Replace this with actual DBC SDK method
    const result = await dbcClient.createToken({
      name: params.name,
      symbol: params.symbol,
      description: params.description,
      uri: params.imageUrl,
      creator: params.creatorWallet,
      initialSupply: params.initialSupply || 1000000000,
    });

    return {
      mint: result.mint.toBase58(),
      name: params.name,
      symbol: params.symbol,
      description: params.description,
      imageUri: params.imageUrl || '',
      creator: params.creatorWallet.toBase58(),
      bondingCurveAddress: result.bondingCurve.toBase58(),
      createdAt: Date.now(),
    };
  } catch (error) {
    console.error('Error creating DBC token:', error);
    throw error;
  }
}
```

---

## Step 5: Update CreatePostModal Component

Enhance the CreatePostModal to include token creation:

```typescript
'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { createTokenForPost, generateTokenSymbol } from '@/lib/dbc';
import { supabase } from '@/lib/supabase';

interface CreatePostWithTokenProps {
  // ... existing props
}

export function CreatePostModal({ ... }: CreatePostWithTokenProps) {
  const { publicKey, connected } = useWallet();
  const [postContent, setPostContent] = useState('');
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [isCreatingToken, setIsCreatingToken] = useState(false);

  const handleCreatePostWithToken = async () => {
    if (!connected || !publicKey) {
      alert('Please connect your wallet first');
      return;
    }

    setIsCreatingToken(true);

    try {
      // 1. Upload media files to storage
      const mediaUrls = await uploadMedia(files);

      // 2. Create DBC token
      const tokenMetadata = await createTokenForPost(connection, {
        name: tokenName,
        symbol: tokenSymbol,
        description: postContent,
        imageUrl: mediaUrls[0],
        creatorWallet: publicKey,
      });

      // 3. Save post to Supabase with token info
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: userId,
          content: postContent,
          media_urls: mediaUrls,
          token_mint: tokenMetadata.mint,
          token_symbol: tokenMetadata.symbol,
          token_name: tokenMetadata.name,
          bonding_curve_address: tokenMetadata.bondingCurveAddress,
          is_token_tradable: true,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // 4. Save token to tokens table
      await supabase
        .from('tokens')
        .insert({
          mint_address: tokenMetadata.mint,
          symbol: tokenMetadata.symbol,
          name: tokenMetadata.name,
          description: postContent,
          image_uri: mediaUrls[0],
          creator_wallet: publicKey.toBase58(),
          post_id: data.id,
          bonding_curve_address: tokenMetadata.bondingCurveAddress,
        });

      alert('Post and token created successfully!');
      router.push('/');
      
    } catch (error) {
      console.error('Error creating post with token:', error);
      alert('Failed to create post and token');
    } finally {
      setIsCreatingToken(false);
    }
  };

  return (
    <div>
      {/* ... existing UI ... */}
      
      {/* Token Creation Section */}
      <div className="mt-4 p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
        <h3 className="text-sm font-bold text-purple-400 mb-3">
          🪙 Token Details (Auto-Created)
        </h3>
        
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Token Name (e.g., My Awesome Token)"
            value={tokenName}
            onChange={(e) => setTokenName(e.target.value)}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg"
          />
          
          <input
            type="text"
            placeholder="Token Symbol (e.g., MAT)"
            value={tokenSymbol}
            onChange={(e) => setTokenSymbol(e.target.value.toUpperCase())}
            maxLength={10}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg"
          />
          
          <p className="text-xs text-secondary">
            ✨ A tradable token will be automatically created for this post
          </p>
        </div>
      </div>

      <Button
        onClick={handleCreatePostWithToken}
        disabled={!tokenName || !tokenSymbol || isCreatingToken}
        className="w-full mt-4"
      >
        {isCreatingToken ? 'Creating Token & Post...' : 'Create Post & Token'}
      </Button>
    </div>
  );
}
```

---

## Step 6: Update Feed to Show Token Info

In your feed components (`SimpleFeed.tsx`, `page.tsx`):

```typescript
// Fetch token data for each post
const fetchPostsWithTokens = async () => {
  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      *,
      user:users(*),
      token:tokens(*)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Fetch live market data for tokens
  const postsWithMarketData = await Promise.all(
    posts.map(async (post) => {
      if (post.token_mint) {
        const marketData = await getBondingCurvePrice(post.token_mint);
        return {
          ...post,
          currentMarketCap: marketData.marketCap,
          currentPrice: marketData.buyPrice,
        };
      }
      return post;
    })
  );

  return postsWithMarketData;
};
```

---

## Step 7: Implement Buy/Sell Functionality

Update the Buy button to use DBC:

```typescript
const handleBuyToken = async (tokenMint: string) => {
  if (!connected || !publicKey) {
    alert('Please connect wallet');
    return;
  }

  try {
    // Use DBC SDK to buy token
    const signature = await buyToken(
      connection,
      tokenMint,
      publicKey,
      solAmount // Amount of SOL to spend
    );

    alert('Purchase successful! Signature: ' + signature);
  } catch (error) {
    console.error('Buy error:', error);
    alert('Purchase failed');
  }
};
```

---

## Step 8: Testing Checklist

### Local Testing
- [ ] DBC SDK imported and initialized
- [ ] Config key working on devnet
- [ ] Wallet connects successfully
- [ ] Token creation works
- [ ] Token data saves to Supabase
- [ ] Posts display with token info
- [ ] Buy button opens trading interface
- [ ] Market cap displays correctly

### Integration Testing
- [ ] Multiple users can create tokens
- [ ] Tokens are instantly tradable
- [ ] Bonding curve pricing works
- [ ] Market cap updates in real-time
- [ ] Token holders count updates
- [ ] Error handling works

---

## Step 9: Production Deployment

Before going live:

1. **Switch to Mainnet**:
```env
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
```

2. **Update DBC Config** (get mainnet config from DBC team)

3. **Test on devnet thoroughly first!**

4. **Set up monitoring** for token creation failures

---

## Important Notes

### DBC SDK Documentation
Since I don't have access to the actual DBC SDK documentation, you'll need to:

1. **Contact DBC Team** for:
   - SDK package name and installation
   - API documentation
   - Example code
   - Program IDs for devnet/mainnet
   - Config key usage

2. **Check DBC Documentation** for:
   - Token creation parameters
   - Bonding curve configuration
   - Trading functions
   - Event listeners

### Common Issues

**Token Creation Fails**:
- Check wallet has SOL for rent
- Verify config key is correct
- Ensure you're on the right network

**Trading Not Working**:
- Verify bonding curve address
- Check liquidity is available
- Ensure token is marked as tradable

**Market Cap Not Updating**:
- Implement WebSocket listeners for DBC events
- Set up background jobs to sync data
- Cache token data appropriately

---

## Next Steps

1. **Get DBC SDK Package Name** from DBC team
2. **Install the SDK** and test on devnet
3. **Replace placeholder code** with actual SDK calls
4. **Test token creation** with a simple post
5. **Verify tokens are tradable** on DEXs
6. **Add real-time price updates** via WebSockets
7. **Deploy to production** after thorough testing

---

## Support & Resources

- **DBC Documentation**: [Get from DBC team]
- **Solana Docs**: https://docs.solana.com
- **Helius Docs**: https://docs.helius.dev
- **Supabase Docs**: https://supabase.com/docs

---

## File Structure Created

```
flexstream/
├── lib/
│   └── dbc.ts                              # DBC service functions
├── app/
│   └── api/
│       └── dbc/
│           ├── create-token/route.ts       # Token creation API
│           ├── buy/route.ts                # Buy token API
│           ├── sell/route.ts               # Sell token API
│           └── bonding-curve/route.ts      # Market data API
└── DBC_IMPLEMENTATION_GUIDE.md            # This guide
```

All code is ready with placeholders - you just need to plug in the actual DBC SDK!

