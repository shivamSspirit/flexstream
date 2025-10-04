import { NextRequest, NextResponse } from 'next/server';
import { fetchLiveCoins, transformPumpFunCoin, isPumpFunConfigured, fetchAllLiveCoinsOfficial } from '@/lib/pump-fun';
import { fetchMultipleTokenHolderCounts } from '@/lib/helius';
import { fetchMultipleDexScreenerTokens, enhanceTokenWithDexScreener } from '@/lib/dexscreener';
import { auth } from '@/lib/auth';
import { generateTokenForClerkUser } from '@/lib/jwt';

// Cache for all live coins to avoid refetching
let allLiveCoinsCache: any[] = [];
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

export async function GET(request: NextRequest) {
  console.log('🚀 [SIMPLE PAGINATED] GET /api/simple-paginated - Starting request');
  
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10'); // Default to 10 per page
    const fetchAll = url.searchParams.get('fetchAll') === 'true';

    console.log('📊 [SIMPLE PAGINATED] Parameters:', { page, limit, fetchAll });

    // Check if Pump.fun is configured
    if (!isPumpFunConfigured()) {
      console.log('❌ [SIMPLE PAGINATED] Pump.fun not configured');
      return NextResponse.json({
        success: false,
        error: 'Pump.fun API not configured.',
        timestamp: Date.now(),
      }, { status: 500 });
    }

    // Check if we need to fetch all coins (cache miss or expired)
    const now = Date.now();
    const isCacheValid = allLiveCoinsCache.length > 0 && (now - cacheTimestamp) < CACHE_DURATION;
    
    if (!isCacheValid) {
      console.log('🔄 [SIMPLE PAGINATED] Cache miss or expired - fetching ALL live coins...');
      
      // Get JWT token from Clerk authentication
      const { userId } = await auth();
      console.log('🔐 [SIMPLE PAGINATED] Clerk userId:', userId);
      
      let jwtToken: string | undefined;
      if (userId) {
        try {
          // Generate JWT token with minimal required parameters
          jwtToken = generateTokenForClerkUser(userId, 'user@example.com');
          console.log('🔑 [SIMPLE PAGINATED] Generated JWT token for fetching all coins');
        } catch (error) {
          console.error('❌ [SIMPLE PAGINATED] Failed to generate JWT token:', error);
          // Continue without JWT token - API might work without auth
        }
      } else {
        console.log('⚠️ [SIMPLE PAGINATED] No authenticated user - trying without JWT token');
      }
      
      // Fetch ALL live coins using the official API
      console.log('🔍 [SIMPLE PAGINATED] Fetching ALL live coins from official Pump.fun API...');
      allLiveCoinsCache = await fetchAllLiveCoinsOfficial(jwtToken);
      cacheTimestamp = now;
      console.log('✅ [SIMPLE PAGINATED] Fetched', allLiveCoinsCache.length, 'live coins from official API');
    } else {
      console.log('✅ [SIMPLE PAGINATED] Using cached data:', allLiveCoinsCache.length, 'coins');
    }

    // Transform all coins if not already transformed
    if (allLiveCoinsCache.length > 0 && typeof allLiveCoinsCache[0] === 'object' && !allLiveCoinsCache[0].token) {
      console.log('🔄 [SIMPLE PAGINATED] Transforming all cached coins...');
      allLiveCoinsCache = allLiveCoinsCache.map((coin: any) => transformPumpFunCoin(coin));
      console.log('✅ [SIMPLE PAGINATED] Transformed', allLiveCoinsCache.length, 'coins');
    }

    // Paginate the transformed data
    const offset = (page - 1) * limit;
    let paginatedCoins = allLiveCoinsCache.slice(offset, offset + limit);
    console.log(`📄 [SIMPLE PAGINATED] Page ${page}: showing ${paginatedCoins.length} coins (offset: ${offset})`);
    
    // Fetch holder counts from Helius for current page only (to avoid rate limits)
    console.log('🔍 [SIMPLE PAGINATED] Fetching holder counts from Helius for current page...');
    const mintAddresses = paginatedCoins.map((coin: any) => coin.token.mint);
    const heliusHolderCounts = await fetchMultipleTokenHolderCounts(mintAddresses);
    
    // Update current page coins with Helius holder counts
    paginatedCoins = paginatedCoins.map(coin => {
      const holderCount = heliusHolderCounts.get(coin.token.mint);
      if (holderCount !== undefined) {
        return {
          ...coin,
          token: {
            ...coin.token,
            holders_count: holderCount,
            enhanced_with_helius: true,
          },
        };
      }
      return coin;
    });
    
    const heliusCount = Array.from(heliusHolderCounts.values()).filter(count => count > 0).length;
    console.log('✅ [SIMPLE PAGINATED] Enhanced', heliusCount, 'coins on current page with Helius holder counts');
    
    // Fetch DexScreener data for current page (market cap, volume, trades, price changes)
    console.log('🔍 [SIMPLE PAGINATED] Fetching DexScreener data for current page...');
    console.log('🔍 [SIMPLE PAGINATED] Mint addresses to fetch:', mintAddresses);
    
    // Fetch DexScreener data for each token individually
    const dexscreenerPromises = mintAddresses.map(async (mint) => {
      try {
        const response = await fetch(`https://api.dexscreener.com/tokens/v1/solana/${mint}`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(5000)
        });
        
        if (!response.ok) return null;
        const data = await response.json();
        return { mint, data };
      } catch (error) {
        console.log('❌ [DEXSCREENER] Error fetching data for', mint, error);
        return null;
      }
    });
    
    const dexscreenerResults = await Promise.all(dexscreenerPromises);
    const validDexscreenerData = dexscreenerResults.filter(result => result !== null);
    console.log('📊 [SIMPLE PAGINATED] DexScreener data received:', validDexscreenerData.length, 'items');
    
    // Update current page coins with DexScreener data
    paginatedCoins = paginatedCoins.map(coin => {
      const dexscreenerInfo = validDexscreenerData.find(result => result.mint === coin.token.mint);
      
      if (dexscreenerInfo && dexscreenerInfo.data && dexscreenerInfo.data.length > 0) {
        const pairData = dexscreenerInfo.data[0]; // Get the first pair
        console.log('✅ [SIMPLE PAGINATED] Found DexScreener data for token:', coin.token.mint, 'Market cap:', pairData.marketCap);
        
        // Update the coin with DexScreener data directly
        return {
          ...coin,
          token: {
            ...coin.token,
            // Market data
            market_cap: pairData.marketCap || coin.token.market_cap,
            price_usd: parseFloat(pairData.priceUsd) || coin.token.price_usd,
            
            // Volume data
            volume_24h: pairData.volume?.h24 || coin.token.volume_24h,
            volume_6h: pairData.volume?.h6 || 0,
            volume_1h: pairData.volume?.h1 || 0,
            
            // Price changes (1h, 6h, 24h only)
            price_change_1h: pairData.priceChange?.h1 || coin.token.price_change_1h || 0,
            price_change_6h: pairData.priceChange?.h6 || 0,
            price_change_24h: pairData.priceChange?.h24 || coin.token.price_change_24h || 0,
            
            // Trading data
            trades_24h: (pairData.txns?.h24?.buys || 0) + (pairData.txns?.h24?.sells || 0),
            trades_6h: (pairData.txns?.h6?.buys || 0) + (pairData.txns?.h6?.sells || 0),
            trades_1h: (pairData.txns?.h1?.buys || 0) + (pairData.txns?.h1?.sells || 0),
            
            // Additional data
            liquidity_usd: pairData.liquidity?.usd || 0,
            fdv: pairData.fdv || 0,
            
            enhanced_with_dexscreener: true
          }
        };
      } else {
        console.log('⚠️ [SIMPLE PAGINATED] No DexScreener data found for token:', coin.token.mint);
        return coin;
      }
    });
    
    const dexscreenerCount = paginatedCoins.filter((coin: any) => coin.token.enhanced_with_dexscreener).length;
    console.log('✅ [SIMPLE PAGINATED] Enhanced', dexscreenerCount, 'coins on current page with DexScreener data');
    
    // Console log the first coin data for debugging
    if (paginatedCoins.length > 0) {
      console.log('🔍 [API] First coin data structure:', JSON.stringify(paginatedCoins[0], null, 2));
    }

    // Calculate pagination metadata based on ALL coins
    const totalCoins = allLiveCoinsCache.length;
    const totalPages = Math.ceil(totalCoins / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Count enhanced coins on current page
    const heliusEnhancedCount = paginatedCoins.filter((coin: any) => coin.token.enhanced_with_helius).length;
    const dexscreenerEnhancedCount = paginatedCoins.filter((coin: any) => coin.token.enhanced_with_dexscreener).length;

    const response = {
      success: true,
      data: paginatedCoins,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalCoins: totalCoins,
        limit,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null
      },
      count: paginatedCoins.length,
      timestamp: Date.now(),
      source: 'simple-paginated',
      helius_count: heliusEnhancedCount,
      dexscreener_count: dexscreenerEnhancedCount,
      cacheInfo: {
        totalCached: allLiveCoinsCache.length,
        cacheAge: Math.round((now - cacheTimestamp) / 1000),
        isCached: isCacheValid
      }
    };

    console.log('✅ [SIMPLE PAGINATED] Response prepared:', {
      count: response.count,
      page: response.pagination.currentPage,
      totalPages: response.pagination.totalPages,
      totalCoins: response.pagination.totalCoins,
      hasNext: response.pagination.hasNextPage,
      helius_enhanced: response.helius_count,
      dexscreener_enhanced: response.dexscreener_count,
      cacheInfo: response.cacheInfo
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [SIMPLE PAGINATED] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now(),
    }, { status: 500 });
  }
}
