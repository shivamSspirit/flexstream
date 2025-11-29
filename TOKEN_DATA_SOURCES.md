# Token Data Sources Guide

## Current Implementation
We're currently using:
- **Pump.fun API** - For live streams and basic token data
- **DexScreener API** - For enhanced market data (volume, trades, holders, liquidity)

## Issues with Current Data
1. **Viewers Data** - Pump.fun doesn't provide accurate viewer counts
2. **Volume/Trades/Holders** - Sometimes showing $0.00, 0, 0 due to data inconsistencies
3. **Real-time Updates** - Limited real-time data from current sources

## Recommended Data Sources for Accurate Token Information

### 1. **Solana RPC + Token Program** (Most Accurate)
```typescript
// Get token supply and holder count
const tokenSupply = await connection.getTokenSupply(mintAddress);
const tokenAccounts = await connection.getTokenAccountsByMint(mintAddress);
const holderCount = tokenAccounts.value.length;
```

**Pros:**
- ✅ Most accurate holder count
- ✅ Real-time supply data
- ✅ Free to use
- ✅ Direct from Solana blockchain

**Cons:**
- ❌ No volume/trade data
- ❌ No price data
- ❌ Requires Solana RPC setup

### 2. **Birdeye API** (Recommended for Market Data)
```typescript
// API Endpoint: https://public-api.birdeye.so/public/v1/token/overview
const response = await fetch(`https://public-api.birdeye.so/public/v1/token/overview?address=${mintAddress}`);
```

**Pros:**
- ✅ Accurate volume and trade data
- ✅ Real-time price updates
- ✅ Holder count
- ✅ Market cap calculations
- ✅ Free tier available

**Cons:**
- ❌ Rate limits on free tier
- ❌ Requires API key for higher limits

### 3. **Jupiter API** (For Price Data)
```typescript
// API Endpoint: https://price.jup.ag/v4/price
const response = await fetch(`https://price.jup.ag/v4/price?ids=${mintAddress}`);
```

**Pros:**
- ✅ Accurate price data
- ✅ Real-time updates
- ✅ Free to use
- ✅ Good for price calculations

**Cons:**
- ❌ No volume/trade data
- ❌ No holder information

### 4. **Solscan API** (Comprehensive Data)
```typescript
// API Endpoint: https://public-api.solscan.io/token/meta
const response = await fetch(`https://public-api.solscan.io/token/meta?tokenAddress=${mintAddress}`);
```

**Pros:**
- ✅ Comprehensive token data
- ✅ Holder count
- ✅ Transaction history
- ✅ Free tier available

**Cons:**
- ❌ Rate limits
- ❌ Requires API key

### 5. **CoinGecko API** (If Token is Listed)
```typescript
// API Endpoint: https://api.coingecko.com/api/v3/coins/solana/contract/{contract_address}
const response = await fetch(`https://api.coingecko.com/api/v3/coins/solana/contract/${mintAddress}`);
```

**Pros:**
- ✅ Very accurate data
- ✅ Global market data
- ✅ Historical data
- ✅ Free tier available

**Cons:**
- ❌ Only for listed tokens
- ❌ Rate limits
- ❌ May not have all Pump.fun tokens

## Recommended Implementation Strategy

### Phase 1: Immediate Fixes (Current)
1. ✅ Fix DexScreener data extraction
2. ✅ Add token mint display
3. ✅ Set platform to "Pump.fun"
4. ✅ Improve viewers data fallback

### Phase 2: Enhanced Data Sources
1. **Add Birdeye API** for accurate volume/trades
2. **Add Solana RPC** for holder count
3. **Add Jupiter API** for price data
4. **Implement data aggregation** from multiple sources

### Phase 3: Real-time Updates
1. **WebSocket connections** to multiple APIs
2. **Data caching** with Redis
3. **Fallback mechanisms** when APIs fail
4. **Data validation** across sources

## Implementation Example

```typescript
// Enhanced token data fetcher
export async function fetchEnhancedTokenData(mintAddress: string) {
  const [birdeyeData, solanaData, jupiterData] = await Promise.allSettled([
    fetchBirdeyeData(mintAddress),
    fetchSolanaTokenData(mintAddress),
    fetchJupiterPrice(mintAddress)
  ]);

  return {
    // Use Birdeye for volume/trades
    volume_24h: birdeyeData.value?.volume24h || 0,
    trades_24h: birdeyeData.value?.trades24h || 0,
    
    // Use Solana RPC for holders
    holders_count: solanaData.value?.holderCount || 0,
    
    // Use Jupiter for price
    price_usd: jupiterData.value?.price || 0,
    
    // Use DexScreener as fallback
    market_cap: birdeyeData.value?.marketCap || dexscreenerData.value?.marketCap || 0,
  };
}
```

## Priority Recommendations

1. **Immediate**: Fix current DexScreener data extraction ✅
2. **Short-term**: Add Birdeye API for volume/trades
3. **Medium-term**: Add Solana RPC for holder count
4. **Long-term**: Implement multi-source data aggregation

## Cost Considerations

- **Free**: Solana RPC, Jupiter API, DexScreener
- **Low Cost**: Birdeye ($50/month), Solscan ($30/month)
- **Medium Cost**: CoinGecko ($129/month)

## Next Steps

1. Test current fixes
2. Implement Birdeye API integration
3. Add Solana RPC for holder data
4. Set up data validation and fallbacks
