/**
 * DexScreener API utilities for fetching additional token data
 */

import { fetchTokenHolderCount } from './helius';

// DexScreener API configuration
export const DEXSCREENER_CONFIG = {
  API_BASE_URL: 'https://api.dexscreener.com/latest',
  TIMEOUT: 8000, // 8 seconds (reduced)
  RATE_LIMIT_DELAY: 2000, // 2 second delay between requests (increased)
  MAX_RETRIES: 2, // Reduced from 3
  BATCH_SIZE: 3, // Process 3 tokens at a time
} as const;

// Rate limiting state
let lastRequestTime = 0;
let requestCount = 0;

/**
 * Rate limiting function to prevent API abuse
 */
async function rateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < DEXSCREENER_CONFIG.RATE_LIMIT_DELAY) {
    const delay = DEXSCREENER_CONFIG.RATE_LIMIT_DELAY - timeSinceLastRequest;
    console.log(`⏳ [DEXSCREENER] Rate limiting: waiting ${delay}ms`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  lastRequestTime = Date.now();
  requestCount++;
}

/**
 * Fetch token data from DexScreener by token address with retry logic
 * @param tokenAddress - The token contract address
 */
export async function fetchDexScreenerTokenData(tokenAddress: string, retryCount = 0): Promise<any> {
  console.log(`🔍 [DEXSCREENER] Fetching token data for: ${tokenAddress} (attempt ${retryCount + 1})`);
  
  try {
    // Apply rate limiting
    await rateLimit();
    
    const url = `https://api.dexscreener.com/tokens/v1/solana/${tokenAddress}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FlexStream/1.0',
        'Cache-Control': 'no-cache',
      },
      signal: AbortSignal.timeout(DEXSCREENER_CONFIG.TIMEOUT),
    });

    console.log('📡 [DEXSCREENER] Response status:', response.status);

    if (!response.ok) {
      if (response.status === 429 || response.status === 1015) {
        // Rate limited - retry with exponential backoff
        if (retryCount < DEXSCREENER_CONFIG.MAX_RETRIES) {
          const delay = Math.pow(2, retryCount) * 2000; // 2s, 4s, 8s
          console.log(`⏳ [DEXSCREENER] Rate limited, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchDexScreenerTokenData(tokenAddress, retryCount + 1);
        }
      }
      throw new Error(`DexScreener API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Check for API error responses
    if (data.error) {
      console.log('⚠️ [DEXSCREENER] API returned error:', data.error);
      return null;
    }
    
    console.log('📊 [DEXSCREENER] Response data:', {
      pairs: data.pairs?.length || 0,
      hasData: !!data.pairs && data.pairs.length > 0,
      firstPair: data.pairs?.[0] ? {
        priceUsd: data.pairs[0].priceUsd,
        marketCap: data.pairs[0].marketCap,
        liquidity: data.pairs[0].liquidity?.usd
      } : null
    });

    return data;
  } catch (error) {
    console.error('❌ [DEXSCREENER] Error fetching token data:', error);
    
    // Retry on network errors
    if (retryCount < DEXSCREENER_CONFIG.MAX_RETRIES && error instanceof Error && 
        (error.message.includes('fetch') || error.message.includes('network'))) {
      const delay = Math.pow(2, retryCount) * 1000;
      console.log(`🔄 [DEXSCREENER] Network error, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchDexScreenerTokenData(tokenAddress, retryCount + 1);
    }
    
    return null;
  }
}

/**
 * Fetch multiple tokens data from DexScreener
 * @param tokenAddresses - Array of token contract addresses
 */
export async function fetchMultipleDexScreenerTokens(tokenAddresses: string[]) {
  console.log('🔍 [DEXSCREENER] Fetching multiple tokens:', tokenAddresses.length);
  
  const results = await Promise.allSettled(
    tokenAddresses.map(address => fetchDexScreenerTokenData(address))
  );

  const successful = results
    .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled' && result.value !== null)
    .map(result => result.value);

  console.log('✅ [DEXSCREENER] Successfully fetched:', successful.length, 'out of', tokenAddresses.length);
  
  // Return array of token data objects
  return successful;
}

/**
 * Fetch market cap for a specific token by contract address
 * @param tokenAddress - Token contract address
 */
export async function fetchTokenMarketCap(tokenAddress: string) {
  console.log('💰 [DEXSCREENER] Fetching market cap for token:', tokenAddress);
  
  try {
    const data = await fetchDexScreenerTokenData(tokenAddress);
    if (!data) {
      console.log('⚠️ [DEXSCREENER] No data found for token:', tokenAddress);
      return null;
    }

    const bestPair = extractBestPairData(data);
    if (!bestPair) {
      console.log('⚠️ [DEXSCREENER] No pair data found for token:', tokenAddress);
      return null;
    }

    const marketCapData = {
      contractAddress: tokenAddress,
      marketCap: bestPair.marketCapUsd || bestPair.marketCap || 0,
      fdv: bestPair.fullyDilutedValuation || bestPair.fdv || 0,
      priceUsd: parseFloat(String(bestPair.priceUsd || '0')) || 0,
      priceSol: parseFloat(bestPair.priceNative) || 0,
      liquidity: bestPair.liquidity?.usd || 0,
      volume24h: bestPair.volume?.h24 || 0,
      circulatingSupply: bestPair.circulatingSupply || 0,
      totalSupply: bestPair.totalSupply || 0,
      dexId: bestPair.dexId,
      pairUrl: bestPair.pairUrl,
      lastUpdated: Date.now()
    };

    console.log('✅ [DEXSCREENER] Market cap data:', {
      contractAddress: tokenAddress,
      marketCap: marketCapData.marketCap,
      fdv: marketCapData.fdv,
      priceUsd: marketCapData.priceUsd
    });

    return marketCapData;
  } catch (error) {
    console.error('❌ [DEXSCREENER] Error fetching market cap:', error);
    return null;
  }
}

/**
 * Extract the best pair data from DexScreener response
 * @param dexscreenerData - Raw DexScreener API response
 */
export function extractBestPairData(dexscreenerData: any) {
  console.log('🔍 [DEXSCREENER] extractBestPairData input:', typeof dexscreenerData, Array.isArray(dexscreenerData));
  
  // Handle the array format we're getting: [array of pair objects]
  let pairs = [];
  
  if (Array.isArray(dexscreenerData) && dexscreenerData.length > 0) {
    // If it's an array of arrays, flatten it
    if (Array.isArray(dexscreenerData[0])) {
      pairs = dexscreenerData.flat();
    } else {
      // It's already an array of pairs
      pairs = dexscreenerData;
    }
  }
  
  if (pairs.length === 0) {
    console.log('⚠️ [DEXSCREENER] No pairs found');
    return null;
  }

  console.log(`🔍 [DEXSCREENER] Found ${pairs.length} pairs`);

  // Get the first pair (they're already sorted by DexScreener)
  const bestPair = pairs[0];
  
  console.log('🔍 [DEXSCREENER] Best pair:', {
    marketCap: bestPair.marketCap,
    priceUsd: bestPair.priceUsd,
    volume24h: bestPair.volume?.h24
  });
  
  // Extract market cap and other data
  const marketCapUsd = parseFloat(bestPair.marketCap || '0');
  const fdv = parseFloat(bestPair.fdv || '0');
  const priceUsd = parseFloat(bestPair.priceUsd || '0');
  const liquidityUsd = parseFloat(bestPair.liquidity?.usd || '0');
  
  console.log('💰 [DEXSCREENER] Extracted data:', {
    marketCapUsd,
    fdv,
    priceUsd,
    liquidityUsd
  });
  
  return {
    pairAddress: bestPair.pairAddress,
    baseToken: bestPair.baseToken,
    quoteToken: bestPair.quoteToken,
    priceNative: bestPair.priceNative,
    priceUsd: priceUsd,
    txns: bestPair.txns,
    volume: bestPair.volume,
    priceChange: bestPair.priceChange,
    liquidity: bestPair.liquidity,
    fdv: fdv,
    marketCap: marketCapUsd,
    pairCreatedAt: bestPair.pairCreatedAt,
    dexId: bestPair.dexId,
    pairUrl: bestPair.url,
    // Enhanced market cap data - use the most accurate values
    marketCapUsd: marketCapUsd > 0 ? marketCapUsd : fdv,
    fullyDilutedValuation: fdv,
    circulatingSupply: bestPair.baseToken?.circulatingSupply || 0,
    totalSupply: bestPair.baseToken?.totalSupply || 0,
  };
}

/**
 * Enhance Pump.fun token data with DexScreener data
 * @param pumpFunToken - Original Pump.fun token data
 * @param dexscreenerData - DexScreener API response
 * @param heliusHolderCount - Optional holder count from Helius API
 */
export function enhanceTokenWithDexScreener(pumpFunToken: any, dexscreenerData: any, heliusHolderCount?: number) {
  console.log('🔍 [DEXSCREENER] enhanceTokenWithDexScreener called with:', {
    tokenMint: pumpFunToken.mint,
    dexscreenerDataType: typeof dexscreenerData,
    dexscreenerDataKeys: Object.keys(dexscreenerData || {}),
    dexscreenerDataSample: JSON.stringify(dexscreenerData, null, 2).substring(0, 200)
  });
  
  const bestPair = extractBestPairData(dexscreenerData);
  
  console.log('🔍 [DEXSCREENER] extractBestPairData result:', bestPair ? 'SUCCESS' : 'NULL');
  
  if (!bestPair) {
    console.log('⚠️ [DEXSCREENER] No pair data found for token:', pumpFunToken.mint);
    return { ...pumpFunToken, enhanced_with_dexscreener: false };
  }

  console.log('✅ [DEXSCREENER] Enhancing token with DexScreener data:', pumpFunToken.mint);

  // Ensure we have valid numeric values
  const priceUsd = parseFloat(String(bestPair.priceUsd || '0')) || 0;
  const priceSol = parseFloat(bestPair.priceNative) || 0;
  const marketCap = bestPair.marketCapUsd || bestPair.marketCap || 0;
  const fdv = bestPair.fullyDilutedValuation || bestPair.fdv || 0;
  const liquidityUsd = parseFloat(bestPair.liquidity?.usd || '0');
  
  console.log('📊 [DEXSCREENER] Final enhancement values:', {
    priceUsd,
    priceSol,
    marketCap,
    fdv,
    liquidityUsd,
    originalMarketCap: pumpFunToken.market_cap
  });

  return {
    ...pumpFunToken,
    enhanced_with_dexscreener: true,
    // Enhanced price data - use DexScreener values if available and valid
    price_usd: priceUsd > 0 ? priceUsd : pumpFunToken.price_usd,
    price_sol: priceSol > 0 ? priceSol : pumpFunToken.price_sol,
    
    // Enhanced market data - prioritize DexScreener values
    market_cap: marketCap > 0 ? marketCap : pumpFunToken.market_cap,
    fdv: fdv > 0 ? fdv : pumpFunToken.fdv,
    circulating_supply: bestPair.circulatingSupply || 0,
    total_supply: bestPair.totalSupply || 0,
    
    // Enhanced holders data - prioritize Helius, then DexScreener, then fallback
    holders_count: heliusHolderCount || bestPair.baseToken?.holders || pumpFunToken.holders_count || 0,
    
    // Enhanced volume data
    volume_24h: bestPair.volume?.h24 || pumpFunToken.volume_24h,
    volume_6h: bestPair.volume?.h6 || 0,
    volume_1h: bestPair.volume?.h1 || 0,
    
    // Enhanced price change data
    price_change_24h: parseFloat(bestPair.priceChange?.h24) || pumpFunToken.price_change_24h,
    price_change_6h: parseFloat(bestPair.priceChange?.h6) || 0,
    price_change_1h: parseFloat(bestPair.priceChange?.h1) || 0,
    
    // Enhanced trading data - fix the trades calculation
    trades_24h: (bestPair.txns?.h24?.buys || 0) + (bestPair.txns?.h24?.sells || 0) || pumpFunToken.trades_count_24h || 0,
    trades_6h: (bestPair.txns?.h6?.buys || 0) + (bestPair.txns?.h6?.sells || 0) || 0,
    trades_1h: (bestPair.txns?.h1?.buys || 0) + (bestPair.txns?.h1?.sells || 0) || 0,
    
    // Enhanced liquidity data
    liquidity_usd: liquidityUsd,
    liquidity_base: parseFloat(bestPair.liquidity?.base || '0'),
    liquidity_quote: parseFloat(bestPair.liquidity?.quote || '0'),
    
    // Additional DexScreener data
    dex_info: {
      dex_id: bestPair.dexId,
      pair_address: bestPair.pairAddress,
      pair_url: bestPair.pairUrl,
      pair_created_at: bestPair.pairCreatedAt,
      base_token: bestPair.baseToken,
      quote_token: bestPair.quoteToken,
    },
    
    // Enhanced image data (use DexScreener image if available)
    image_uri: bestPair.baseToken?.image || pumpFunToken.image_uri,
    
    // Enhanced metadata
    enhanced_with_helius: !!heliusHolderCount,
    last_updated: Date.now(),
  };
}

/**
 * Enhance multiple tokens with both DexScreener and Helius data
 * @param tokens - Array of Pump.fun tokens
 * @param dexscreenerData - Array of DexScreener API responses
 */
export async function enhanceTokensWithMultipleSources(tokens: any[], dexscreenerData: any[]) {
  console.log('🔄 [ENHANCEMENT] Starting multi-source enhancement for', tokens.length, 'tokens');
  
  // Extract mint addresses for Helius API calls
  const mintAddresses = tokens.map(token => token.mint);
  
  // Fetch holder counts from Helius in parallel
  console.log('🔍 [HELIUS] Fetching holder counts for', mintAddresses.length, 'tokens');
  const heliusHolderCounts = new Map<string, number>();
  
  try {
    const { fetchMultipleTokenHolderCounts } = await import('./helius');
    const holderCounts = await fetchMultipleTokenHolderCounts(mintAddresses);
    holderCounts.forEach((count, mint) => {
      heliusHolderCounts.set(mint, count);
    });
  } catch (error) {
    console.warn('⚠️ [HELIUS] Failed to fetch holder counts, continuing without Helius data:', error);
  }
  
  // Enhance each token with both sources
  const enhancedTokens = tokens.map((token, index) => {
    const matchingDexscreenerData = dexscreenerData.find(
      (data: any) => data.pairs?.[0]?.baseToken?.address === token.mint
    );
    
    const heliusHolderCount = heliusHolderCounts.get(token.mint);
    
    if (matchingDexscreenerData) {
      return enhanceTokenWithDexScreener(token, matchingDexscreenerData, heliusHolderCount);
    }
    
    // If no DexScreener data, still try to enhance with Helius holder count
    if (heliusHolderCount) {
      return {
        ...token,
        holders_count: heliusHolderCount,
        enhanced_with_dexscreener: false,
        enhanced_with_helius: true,
        last_updated: Date.now(),
      };
    }
    
    return { ...token, enhanced_with_dexscreener: false, enhanced_with_helius: false };
  });
  
  const enhancedCount = enhancedTokens.filter(token => 
    token.enhanced_with_dexscreener || token.enhanced_with_helius
  ).length;
  
  console.log('✅ [ENHANCEMENT] Multi-source enhancement completed:', {
    total: tokens.length,
    enhanced: enhancedCount,
    withDexScreener: enhancedTokens.filter(t => t.enhanced_with_dexscreener).length,
    withHelius: enhancedTokens.filter(t => t.enhanced_with_helius).length
  });
  
  return enhancedTokens;
}
