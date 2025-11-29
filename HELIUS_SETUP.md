# Helius API Setup Guide

## Overview
Helius provides accurate token holder count data directly from the Solana blockchain. This guide will help you set up Helius API integration for accurate holder count data.

## Why Helius?
- ✅ **Most Accurate**: Direct blockchain data
- ✅ **Real-time**: Live holder count updates
- ✅ **Reliable**: Enterprise-grade infrastructure
- ✅ **Fast**: Optimized API responses
- ✅ **Free Tier**: 100 requests/day free

## Setup Steps

### 1. Create Helius Account
1. Go to [https://helius.xyz](https://helius.xyz)
2. Click "Get Started" or "Sign Up"
3. Create your account with email/password
4. Verify your email address

### 2. Get API Key
1. Log into your Helius dashboard
2. Navigate to "API Keys" section
3. Click "Create New API Key"
4. Give it a name (e.g., "FlexStream App")
5. Copy the generated API key

### 3. Add API Key to Environment
Add your Helius API key to your `.env.local` file:

```bash
# Helius API Configuration
HELIUS_API_KEY=your_helius_api_key_here
```

### 4. Test the Integration
The integration will automatically work once you add the API key. You'll see:
- ✅ **Green ✓** - DexScreener enhanced data
- ✅ **Blue H** - Helius enhanced holder count
- ✅ **Accurate holder counts** from blockchain data

## API Limits

### Free Tier
- **100 requests/day**
- **Perfect for development and small apps**
- **No credit card required**

### Paid Plans
- **Starter**: $99/month - 1M requests
- **Growth**: $299/month - 5M requests  
- **Enterprise**: Custom pricing

## Features Implemented

### 1. Accurate Holder Count
```typescript
// Fetches real holder count from blockchain
const holderCount = await fetchTokenHolderCount(mintAddress);
```

### 2. Multi-Source Enhancement
```typescript
// Combines DexScreener + Helius data
const enhancedToken = await enhanceTokensWithMultipleSources(tokens, dexscreenerData);
```

### 3. Rate Limiting
- 500ms delay between requests
- Automatic retry on failures
- Graceful fallback to DexScreener data

### 4. Error Handling
- Continues without Helius if API key missing
- Falls back to DexScreener holder data
- Logs all API interactions

## Data Priority

1. **Helius** (Most Accurate) - Direct blockchain data
2. **DexScreener** (Good) - Market data provider
3. **Pump.fun** (Fallback) - Original source

## Console Logs

You'll see these logs when Helius is working:

```
🔍 [HELIUS] Fetching holder count for: 2EYvskXTncMS11vejJcWHh8fPaCFy6bzDcVnmofEpump
✅ [HELIUS] Holder count fetched: { mint: "2EYvskXTncMS11vejJcWHh8fPaCFy6bzDcVnmofEpump", totalAccounts: 1247, holdersWithBalance: 892 }
```

## Troubleshooting

### No API Key
```
⚠️ [HELIUS] HELIUS_API_KEY not found in environment variables
```
**Solution**: Add `HELIUS_API_KEY=your_key` to `.env.local`

### Rate Limited
```
⏳ [HELIUS] Rate limited, retrying in 2000ms...
```
**Solution**: Wait or upgrade to paid plan

### Network Error
```
❌ [HELIUS] Error fetching holder count: Network error
```
**Solution**: Check internet connection, API key validity

## Benefits

### Before Helius
- ❌ Inaccurate holder counts
- ❌ Missing or zero holder data
- ❌ Inconsistent data sources

### After Helius
- ✅ Accurate blockchain-based holder counts
- ✅ Real-time data updates
- ✅ Reliable data source
- ✅ Better user experience

## Next Steps

1. **Add API Key**: Get your free Helius API key
2. **Test Integration**: Check console logs for success
3. **Monitor Usage**: Track API usage in Helius dashboard
4. **Upgrade if Needed**: Scale to paid plan as you grow

## Support

- **Helius Docs**: [https://docs.helius.xyz](https://docs.helius.xyz)
- **API Reference**: [https://docs.helius.xyz/api-reference](https://docs.helius.xyz/api-reference)
- **Discord**: [https://discord.gg/helius](https://discord.gg/helius)

## Cost Optimization

### Free Tier Usage
- 20 tokens per request = 5 requests/day
- Perfect for development and testing
- Consider caching for production

### Paid Tier Benefits
- Higher rate limits
- Priority support
- Advanced features
- SLA guarantees
