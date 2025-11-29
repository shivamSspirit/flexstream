import { NextRequest, NextResponse } from 'next/server';
import { 
  fetchAllLiveCoins, 
  transformPumpFunCoin, 
  isPumpFunConfigured 
} from '@/lib/pump-fun';
import { 
  fetchMultipleDexScreenerTokens, 
  enhanceTokenWithDexScreener
} from '@/lib/dexscreener';

export async function GET(request: NextRequest) {
  console.log('🚀 [FAST LIVE STREAMS] GET /api/pump-fun/fast-live-streams - Starting request');
  
  try {
    // Check if Pump.fun is configured
    if (!isPumpFunConfigured()) {
      console.log('❌ [FAST LIVE STREAMS] Pump.fun not configured');
      return NextResponse.json({
        success: false,
        error: 'Pump.fun API not configured. Please check your environment variables.',
        timestamp: Date.now(),
      }, { status: 500 });
    }

    const url = new URL(request.url);
    const maxCoins = parseInt(url.searchParams.get('maxCoins') || '5');
    const includeDexScreener = url.searchParams.get('includeDexScreener') === 'true';

    console.log('📊 [FAST LIVE STREAMS] Parameters:', { maxCoins, includeDexScreener });

    // Step 1: Fetch live coins from Pump.fun
    console.log('🔍 [FAST LIVE STREAMS] Step 1: Fetching live coins from Pump.fun...');
    const liveCoins = await fetchAllLiveCoins(undefined, maxCoins);
    console.log('✅ [FAST LIVE STREAMS] Fetched', liveCoins.length, 'live coins');

    // Step 2: Transform Pump.fun data
    console.log('🔄 [FAST LIVE STREAMS] Step 2: Transforming Pump.fun data...');
    const transformedCoins = liveCoins.map(coin => transformPumpFunCoin(coin));
    console.log('✅ [FAST LIVE STREAMS] Transformed', transformedCoins.length, 'coins');

    // Step 3: Enhance with DexScreener data only (no Helius for speed)
    let enhancedCoins = transformedCoins;
    
    if (includeDexScreener && transformedCoins.length > 0) {
      console.log('🔍 [FAST LIVE STREAMS] Step 3: Enhancing with DexScreener data (no Helius for speed)...');
      
      // Extract token addresses
      const tokenAddresses = transformedCoins.map(coin => coin.token.mint);
      console.log('📋 [FAST LIVE STREAMS] Token addresses to fetch:', tokenAddresses.length);
      
      // Fetch DexScreener data for all tokens
      const dexscreenerData = await fetchMultipleDexScreenerTokens(tokenAddresses);
      console.log('📊 [FAST LIVE STREAMS] DexScreener data received:', dexscreenerData.length);
      
      // Enhance with DexScreener data only
      enhancedCoins = transformedCoins.map((coin, index) => {
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
      
      console.log('✅ [FAST LIVE STREAMS] Enhanced coins with DexScreener data');
    }

    const response = {
      success: true,
      data: enhancedCoins,
      count: enhancedCoins.length,
      timestamp: Date.now(),
      source: 'fast-api',
      metadata: {
        total_fetched: enhancedCoins.length,
        max_requested: maxCoins,
        dexscreener_enhanced: includeDexScreener,
        enhanced_count: includeDexScreener ? enhancedCoins.filter((coin: any) => coin.token.enhanced_with_dexscreener).length : 0,
        dexscreener_count: includeDexScreener ? enhancedCoins.filter((coin: any) => coin.token.enhanced_with_dexscreener).length : 0,
        helius_count: 0, // No Helius for speed
      }
    };

    console.log('✅ [FAST LIVE STREAMS] Response prepared:', {
      count: response.count,
      enhanced: response.metadata.enhanced_count,
      dexscreener: response.metadata.dexscreener_count
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [FAST LIVE STREAMS] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now(),
    }, { status: 500 });
  }
}
