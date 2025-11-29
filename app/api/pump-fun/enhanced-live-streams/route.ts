import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { 
  fetchAllLiveCoins, 
  transformPumpFunCoin, 
  isPumpFunConfigured 
} from '@/lib/pump-fun';
import { 
  fetchMultipleDexScreenerTokens, 
  enhanceTokenWithDexScreener,
  enhanceTokensWithMultipleSources
} from '@/lib/dexscreener';
import { generateTokenForClerkUser } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  console.log('🚀 [ENHANCED API] GET /api/pump-fun/enhanced-live-streams - Starting request');
  
  try {
    // Check if user is authenticated with Clerk
    const { userId } = await auth();
    console.log('🔐 [ENHANCED API] Auth check - userId:', userId);
    
    if (!userId) {
      console.log('❌ [ENHANCED API] No userId found - returning 401');
      return NextResponse.json({
        success: false,
        error: 'Authentication required. Please sign in to access live streams.',
        data: [],
        count: 0,
        timestamp: Date.now(),
        source: 'enhanced-api',
        code: 'UNAUTHORIZED'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const maxCoins = parseInt(searchParams.get('maxCoins') || '20');
    const includeDexScreener = searchParams.get('includeDexScreener') !== 'false';

    console.log('📊 [ENHANCED API] Request params:', { maxCoins, includeDexScreener });
    console.log(`👤 [ENHANCED API] Fetching enhanced live coins for authenticated user: ${userId}`);

    // Generate JWT token for this user
    const email = `user-${userId}@flexstream.app`;
    console.log('🔑 [ENHANCED API] Generating JWT token for email:', email);
    
    const jwtToken = generateTokenForClerkUser(userId, email);
    console.log('✅ [ENHANCED API] JWT token generated successfully, length:', jwtToken.length);

    // Step 1: Fetch live coins from Pump.fun
    console.log('🌐 [ENHANCED API] Step 1: Fetching live coins from Pump.fun...');
    const allLiveCoins = await fetchAllLiveCoins(jwtToken, maxCoins);

    console.log('📈 [ENHANCED API] Pump.fun data received:', {
      type: typeof allLiveCoins,
      isArray: Array.isArray(allLiveCoins),
      length: Array.isArray(allLiveCoins) ? allLiveCoins.length : 'N/A'
    });

    // Step 2: Transform Pump.fun data
    console.log('🔄 [ENHANCED API] Step 2: Transforming Pump.fun data...');
    const transformedCoins = allLiveCoins.map(transformPumpFunCoin);
    console.log('✅ [ENHANCED API] Transformed coins:', transformedCoins.length);

    // Step 3: Enhance with DexScreener and Helius data (if enabled)
    let enhancedCoins = transformedCoins;
    
    if (includeDexScreener && transformedCoins.length > 0) {
      console.log('🔍 [ENHANCED API] Step 3: Enhancing with DexScreener and Helius data...');
      
      // Extract token addresses
      const tokenAddresses = transformedCoins.map(coin => coin.token.mint);
      console.log('📋 [ENHANCED API] Token addresses to fetch:', tokenAddresses.length);
      
      // Fetch DexScreener data for all tokens
      const dexscreenerData = await fetchMultipleDexScreenerTokens(tokenAddresses);
      console.log('📊 [ENHANCED API] DexScreener data received:', dexscreenerData.length);
      
      // Enhance with both DexScreener and Helius data
      const tokens = transformedCoins.map(coin => coin.token);
      const enhancedTokens = await enhanceTokensWithMultipleSources(tokens, dexscreenerData);
      
      // Map enhanced tokens back to coins
      enhancedCoins = transformedCoins.map((coin, index) => ({
        ...coin,
        token: enhancedTokens[index]
      }));
      
      console.log('✅ [ENHANCED API] Enhanced coins with DexScreener and Helius data');
    }

    const response = {
      success: true,
      data: enhancedCoins,
      count: enhancedCoins.length,
      timestamp: Date.now(),
      source: 'enhanced-api',
      metadata: {
        total_fetched: enhancedCoins.length,
        max_requested: maxCoins,
        dexscreener_enhanced: includeDexScreener,
        enhanced_count: includeDexScreener ? enhancedCoins.filter((coin: any) => coin.token.enhanced_with_dexscreener || coin.token.enhanced_with_helius).length : 0,
        dexscreener_count: includeDexScreener ? enhancedCoins.filter((coin: any) => coin.token.enhanced_with_dexscreener).length : 0,
        helius_count: includeDexScreener ? enhancedCoins.filter((coin: any) => coin.token.enhanced_with_helius).length : 0,
        pagination: {
          batches_used: Math.ceil(enhancedCoins.length / 200)
        }
      }
    };

    console.log('✅ [ENHANCED API] Returning successful response:', {
      success: response.success,
      count: response.count,
      enhanced_count: response.metadata.enhanced_count,
      timestamp: response.timestamp
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [ENHANCED API] Error fetching enhanced live coins:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    });
    
    // Return a structured error response
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      data: [],
      count: 0,
      timestamp: Date.now(),
      source: 'enhanced-api'
    }, { status: 500 });
  }
}
