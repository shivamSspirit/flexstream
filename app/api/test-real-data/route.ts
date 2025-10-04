import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateTokenForClerkUser } from '@/lib/jwt';
import { fetchLiveCoins, transformPumpFunCoin, isPumpFunConfigured } from '@/lib/pump-fun';
import { fetchMultipleDexScreenerTokens, enhanceTokenWithDexScreener } from '@/lib/dexscreener';
import { fetchMultipleTokenHolderCounts } from '@/lib/helius';

export async function GET(request: NextRequest) {
  console.log('🧪 [TEST REAL DATA] GET /api/test-real-data - Starting request');
  
  try {
    // Check authentication
    const { userId } = await auth();
    console.log('🔐 [TEST REAL DATA] Auth check - userId:', userId);
    
    if (!userId) {
      console.log('❌ [TEST REAL DATA] No userId found - returning 401');
      return NextResponse.json({
        success: false,
        error: 'Authentication required. Please sign in to access live streams.'
      }, { status: 401 });
    }

    // Generate JWT token for Pump.fun API
    const jwtToken = await generateTokenForClerkUser(userId, `user-${userId}@flexstream.app`);
    if (!jwtToken) {
      console.log('❌ [TEST REAL DATA] Failed to generate JWT token for Clerk user');
      return NextResponse.json({
        success: false,
        error: 'Failed to generate authentication token.'
      }, { status: 500 });
    }

    // Check if Pump.fun is configured
    if (!isPumpFunConfigured()) {
      console.log('❌ [TEST REAL DATA] Pump.fun not configured');
      return NextResponse.json({
        success: false,
        error: 'Pump.fun API not configured. Please check your environment variables.',
        timestamp: Date.now(),
      }, { status: 500 });
    }

    console.log('🔍 [TEST REAL DATA] Step 1: Fetching live coins from Pump.fun...');
    const liveCoins = await fetchLiveCoins({ offset: 0, limit: 5 }, jwtToken);
    console.log('✅ [TEST REAL DATA] Fetched', liveCoins.length, 'live coins');

    if (liveCoins.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No live coins found',
        data: [],
        count: 0
      });
    }

    console.log('🔄 [TEST REAL DATA] Step 2: Transforming Pump.fun data...');
    const transformedCoins = liveCoins.map((coin: any) => transformPumpFunCoin(coin));
    console.log('✅ [TEST REAL DATA] Transformed', transformedCoins.length, 'coins');

    // Test DexScreener integration
    console.log('🔍 [TEST REAL DATA] Step 3: Testing DexScreener integration...');
    const tokenAddresses = transformedCoins.map((coin: any) => coin.token.mint);
    const dexscreenerData = await fetchMultipleDexScreenerTokens(tokenAddresses);
    console.log('📊 [TEST REAL DATA] DexScreener data received:', dexscreenerData.length);

    // Test Helius integration
    console.log('🔍 [TEST REAL DATA] Step 4: Testing Helius integration...');
    const holderCounts = await fetchMultipleTokenHolderCounts(tokenAddresses);
    console.log('📊 [TEST REAL DATA] Helius holder counts received:', holderCounts.size);

    // Enhance first coin with all data
    const enhancedCoins = transformedCoins.map((coin: any, index: number) => {
      const dexscreenerToken = dexscreenerData[index];
      const holderCount = holderCounts.get(coin.token.mint) || 0;
      
      let enhancedToken = coin.token;
      
      if (dexscreenerToken) {
        enhancedToken = enhanceTokenWithDexScreener(coin.token, dexscreenerToken);
      }
      
      return {
        ...coin,
        token: {
          ...enhancedToken,
          holders_count: holderCount,
          enhanced_with_helius: holderCount > 0
        }
      };
    });

    const response = {
      success: true,
      data: enhancedCoins,
      count: enhancedCoins.length,
      timestamp: Date.now(),
      source: 'test-real-data',
      metadata: {
        pump_fun_coins: liveCoins.length,
        dexscreener_enhanced: dexscreenerData.length,
        helius_enhanced: holderCounts.size,
        sample_data: {
          first_token: {
            name: enhancedCoins[0]?.token.name,
            symbol: enhancedCoins[0]?.token.symbol,
            mint: enhancedCoins[0]?.token.mint,
            market_cap: enhancedCoins[0]?.token.market_cap,
            volume_24h: enhancedCoins[0]?.token.volume_24h,
            holders_count: enhancedCoins[0]?.token.holders_count,
            enhanced_with_dexscreener: enhancedCoins[0]?.token.enhanced_with_dexscreener,
            enhanced_with_helius: enhancedCoins[0]?.token.enhanced_with_helius
          }
        }
      }
    };

    console.log('✅ [TEST REAL DATA] Response prepared:', {
      count: response.count,
      sample: response.metadata.sample_data
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [TEST REAL DATA] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now(),
    }, { status: 500 });
  }
}
