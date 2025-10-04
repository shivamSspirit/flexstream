import { NextRequest, NextResponse } from 'next/server';
import { 
  fetchAllLiveCoins, 
  transformPumpFunCoin, 
  isPumpFunConfigured 
} from '@/lib/pump-fun';
import { 
  fetchMultipleDexScreenerTokens, 
  enhanceTokensWithMultipleSources
} from '@/lib/dexscreener';

export async function GET(request: NextRequest) {
  console.log('🧪 [TEST LIVE STREAMS] GET /api/test-live-streams - Starting request');
  
  try {
    // Check if Pump.fun is configured
    if (!isPumpFunConfigured()) {
      console.log('❌ [TEST LIVE STREAMS] Pump.fun not configured');
      return NextResponse.json({
        success: false,
        error: 'Pump.fun API not configured. Please check your environment variables.',
        timestamp: Date.now(),
      }, { status: 500 });
    }

    const url = new URL(request.url);
    const maxCoins = parseInt(url.searchParams.get('maxCoins') || '5');
    const includeDexScreener = url.searchParams.get('includeDexScreener') === 'true';

    console.log('📊 [TEST LIVE STREAMS] Parameters:', { maxCoins, includeDexScreener });

    // Step 1: Fetch live coins from Pump.fun
    console.log('🔍 [TEST LIVE STREAMS] Step 1: Fetching live coins from Pump.fun...');
    const liveCoins = await fetchAllLiveCoins(undefined, maxCoins);
    console.log('✅ [TEST LIVE STREAMS] Fetched', liveCoins.length, 'live coins');

    // Step 2: Transform Pump.fun data
    console.log('🔄 [TEST LIVE STREAMS] Step 2: Transforming Pump.fun data...');
    const transformedCoins = liveCoins.map((coin: any) => transformPumpFunCoin(coin));
    console.log('✅ [TEST LIVE STREAMS] Transformed', transformedCoins.length, 'coins');

    // Step 3: Enhance with DexScreener and Helius data (if enabled)
    let enhancedCoins = transformedCoins;
    
    if (includeDexScreener && transformedCoins.length > 0) {
      console.log('🔍 [TEST LIVE STREAMS] Step 3: Enhancing with DexScreener and Helius data...');
      
      // Extract token addresses
      const tokenAddresses = transformedCoins.map((coin: any) => coin.token.mint);
      console.log('📋 [TEST LIVE STREAMS] Token addresses to fetch:', tokenAddresses.length);
      
      // Fetch DexScreener data for all tokens
      const dexscreenerData = await fetchMultipleDexScreenerTokens(tokenAddresses);
      console.log('📊 [TEST LIVE STREAMS] DexScreener data received:', dexscreenerData.length);
      
      // Enhance with both DexScreener and Helius data
      const tokens = transformedCoins.map((coin: any) => coin.token); // Extract only the token objects
      const enhancedTokens = await enhanceTokensWithMultipleSources(tokens, dexscreenerData);
      
      // Map enhanced tokens back to coins
      enhancedCoins = transformedCoins.map((coin, index) => ({
        ...coin,
        token: enhancedTokens[index]
      }));
      
      console.log('✅ [TEST LIVE STREAMS] Enhanced coins with DexScreener and Helius data');
    }

    const response = {
      success: true,
      data: enhancedCoins,
      count: enhancedCoins.length,
      timestamp: Date.now(),
      source: 'test-api',
      metadata: {
        total_fetched: enhancedCoins.length,
        max_requested: maxCoins,
        dexscreener_enhanced: includeDexScreener,
        enhanced_count: includeDexScreener ? enhancedCoins.filter((coin: any) => coin.token.enhanced_with_dexscreener || coin.token.enhanced_with_helius).length : 0,
        dexscreener_count: includeDexScreener ? enhancedCoins.filter((coin: any) => coin.token.enhanced_with_dexscreener).length : 0,
        helius_count: includeDexScreener ? enhancedCoins.filter((coin: any) => coin.token.enhanced_with_helius).length : 0,
      }
    };

    console.log('✅ [TEST LIVE STREAMS] Response prepared:', {
      count: response.count,
      enhanced: response.metadata.enhanced_count,
      dexscreener: response.metadata.dexscreener_count,
      helius: response.metadata.helius_count
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [TEST LIVE STREAMS] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now(),
    }, { status: 500 });
  }
}
