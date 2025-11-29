import { NextRequest, NextResponse } from 'next/server';
import { 
  fetchLiveCoins, 
  transformPumpFunCoin, 
  isPumpFunConfigured 
} from '@/lib/pump-fun';
import { 
  fetchMultipleDexScreenerTokens, 
  enhanceTokenWithDexScreener
} from '@/lib/dexscreener';
import { fetchMultipleTokenHolderCounts } from '@/lib/helius';
import { auth } from '@/lib/auth';
import { generateTokenForClerkUser } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  console.log('🚀 [PAGINATED LIVE STREAMS] GET /api/pump-fun/paginated-live-streams - Starting request');
  
  try {
    // Get JWT token from Clerk authentication
    const { userId } = await auth();
    console.log('🔐 [PAGINATED LIVE STREAMS] Clerk userId:', userId);
    
    let jwtToken: string | undefined;
    if (userId) {
      try {
        jwtToken = await generateTokenForClerkUser(userId, `user-${userId}@flexstream.app`);
        console.log('🔑 [PAGINATED LIVE STREAMS] Generated JWT token for Clerk user');
      } catch (error) {
        console.error('❌ [PAGINATED LIVE STREAMS] Failed to generate JWT token:', error);
        // Continue without JWT token - API might work without auth
      }
    } else {
      console.log('⚠️ [PAGINATED LIVE STREAMS] No authenticated user - trying without JWT token');
    }

    // Check if Pump.fun is configured
    if (!isPumpFunConfigured()) {
      console.log('❌ [PAGINATED LIVE STREAMS] Pump.fun not configured');
      return NextResponse.json({
        success: false,
        error: 'Pump.fun API not configured. Please check your environment variables.',
        timestamp: Date.now(),
      }, { status: 500 });
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const includeDexScreener = url.searchParams.get('includeDexScreener') === 'true';
    const includeHelius = url.searchParams.get('includeHelius') === 'true';

    console.log('📊 [PAGINATED LIVE STREAMS] Parameters:', { page, limit, includeDexScreener, includeHelius });

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Step 1: Fetch live coins from Pump.fun with pagination
    console.log(`🔍 [PAGINATED LIVE STREAMS] Step 1: Fetching live coins from Pump.fun (offset: ${offset}, limit: ${limit})...`);
    const liveCoins = await fetchLiveCoins({ offset, limit }, jwtToken);
    console.log('✅ [PAGINATED LIVE STREAMS] Fetched', liveCoins.length, 'live coins');

    // Step 2: Transform Pump.fun data
    console.log('🔄 [PAGINATED LIVE STREAMS] Step 2: Transforming Pump.fun data...');
    const transformedCoins = liveCoins.map((coin: any) => transformPumpFunCoin(coin));
    console.log('✅ [PAGINATED LIVE STREAMS] Transformed', transformedCoins.length, 'coins');

    // Step 4: Enhance with DexScreener data (if enabled)
    let enhancedCoins = transformedCoins;
    
    if (includeDexScreener && transformedCoins.length > 0) {
      console.log('🔍 [PAGINATED LIVE STREAMS] Step 4: Enhancing with DexScreener data...');
      
      // Extract token addresses
      const tokenAddresses = transformedCoins.map((coin: any) => coin.token.mint);
      console.log('📋 [PAGINATED LIVE STREAMS] Token addresses to fetch:', tokenAddresses.length);
      
      // Fetch DexScreener data for all tokens
      const dexscreenerData = await fetchMultipleDexScreenerTokens(tokenAddresses);
      console.log('📊 [PAGINATED LIVE STREAMS] DexScreener data received:', dexscreenerData.length);
      
      // Enhance with DexScreener data
      enhancedCoins = transformedCoins.map((coin: any, index: number) => {
        const dexscreenerToken = dexscreenerData[index];
        if (dexscreenerToken) {
          const enhancedToken = enhanceTokenWithDexScreener(coin.token, dexscreenerToken);
          return {
            ...coin,
            token: enhancedToken
          };
        }
        return coin;
      });
      
      console.log('✅ [PAGINATED LIVE STREAMS] Enhanced coins with DexScreener data');
    }

    // Step 5: Enhance with Helius holder counts (if enabled)
    if (includeHelius && enhancedCoins.length > 0) {
      console.log('🔍 [PAGINATED LIVE STREAMS] Step 5: Enhancing with Helius holder counts...');
      
      const tokenAddresses = enhancedCoins.map((coin: any) => coin.token.mint);
      const holderCounts = await fetchMultipleTokenHolderCounts(tokenAddresses);
      
      // Update coins with holder counts
      enhancedCoins = enhancedCoins.map((coin: any) => {
        const holderCount = holderCounts.get(coin.token.mint) || 0;
        return {
          ...coin,
          token: {
            ...coin.token,
            holders_count: holderCount,
            enhanced_with_helius: holderCount > 0
          }
        };
      });
      
      console.log('✅ [PAGINATED LIVE STREAMS] Enhanced coins with Helius holder counts');
    }

    // Calculate pagination metadata
    // Note: We don't know the total count from Pump.fun API, so we estimate
    const totalCoins = liveCoins.length; // This is just the current page count
    const totalPages = Math.max(1, Math.ceil(totalCoins / limit));
    const hasNextPage = liveCoins.length === limit; // If we got exactly the limit, there might be more
    const hasPrevPage = page > 1;

    const response = {
      success: true,
      data: enhancedCoins,
      pagination: {
        currentPage: page,
        totalPages,
        totalCoins,
        limit,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null
      },
      count: enhancedCoins.length,
      timestamp: Date.now(),
      source: 'paginated-api',
      metadata: {
        total_fetched: enhancedCoins.length,
        page_requested: page,
        limit_per_page: limit,
        dexscreener_enhanced: includeDexScreener,
        helius_enhanced: includeHelius,
        enhanced_count: enhancedCoins.filter((coin: any) => 
          coin.token.enhanced_with_dexscreener || coin.token.enhanced_with_helius
        ).length,
        dexscreener_count: enhancedCoins.filter((coin: any) => coin.token.enhanced_with_dexscreener).length,
        helius_count: enhancedCoins.filter((coin: any) => coin.token.enhanced_with_helius).length,
      }
    };

    console.log('✅ [PAGINATED LIVE STREAMS] Response prepared:', {
      count: response.count,
      page: response.pagination.currentPage,
      totalPages: response.pagination.totalPages,
      hasNext: response.pagination.hasNextPage
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [PAGINATED LIVE STREAMS] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now(),
    }, { status: 500 });
  }
}
