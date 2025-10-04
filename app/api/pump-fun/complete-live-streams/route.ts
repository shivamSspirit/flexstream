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
import { fetchMultipleTokenHolderCounts } from '@/lib/helius';

export async function GET(request: NextRequest) {
  console.log('🚀 [COMPLETE LIVE STREAMS] GET /api/pump-fun/complete-live-streams - Starting request');
  
  try {
    // Check if Pump.fun is configured
    if (!isPumpFunConfigured()) {
      console.log('❌ [COMPLETE LIVE STREAMS] Pump.fun not configured');
      return NextResponse.json({
        success: false,
        error: 'Pump.fun API not configured. Please check your environment variables.',
        timestamp: Date.now(),
      }, { status: 500 });
    }

    const url = new URL(request.url);
    const maxCoins = parseInt(url.searchParams.get('maxCoins') || '20');
    const includeDexScreener = url.searchParams.get('includeDexScreener') === 'true';
    const includeHelius = url.searchParams.get('includeHelius') === 'true';

    console.log('📊 [COMPLETE LIVE STREAMS] Parameters:', { maxCoins, includeDexScreener, includeHelius });

    // Step 1: Fetch live coins from Pump.fun
    console.log('🔍 [COMPLETE LIVE STREAMS] Step 1: Fetching live coins from Pump.fun...');
    const liveCoins = await fetchAllLiveCoins(undefined, maxCoins);
    console.log('✅ [COMPLETE LIVE STREAMS] Fetched', liveCoins.length, 'live coins');

    // Step 2: Transform Pump.fun data
    console.log('🔄 [COMPLETE LIVE STREAMS] Step 2: Transforming Pump.fun data...');
    const transformedCoins = liveCoins.map((coin: any) => transformPumpFunCoin(coin));
    console.log('✅ [COMPLETE LIVE STREAMS] Transformed', transformedCoins.length, 'coins');

    // Step 3: Enhance with DexScreener data
    let enhancedCoins = transformedCoins;
    
    if (includeDexScreener && transformedCoins.length > 0) {
      console.log('🔍 [COMPLETE LIVE STREAMS] Step 3: Enhancing with DexScreener data...');
      
      // Extract token addresses
      const tokenAddresses = transformedCoins.map((coin: any) => coin.token.mint);
      console.log('📋 [COMPLETE LIVE STREAMS] Token addresses to fetch:', tokenAddresses.length);
      
      // Fetch DexScreener data for all tokens
      const dexscreenerData = await fetchMultipleDexScreenerTokens(tokenAddresses);
      console.log('📊 [COMPLETE LIVE STREAMS] DexScreener data received:', dexscreenerData.length);
      
      // Enhance with DexScreener data
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
      
      console.log('✅ [COMPLETE LIVE STREAMS] Enhanced coins with DexScreener data');
    }

    // Step 4: Enhance with Helius holder counts (if enabled)
    if (includeHelius && enhancedCoins.length > 0) {
      console.log('🔍 [COMPLETE LIVE STREAMS] Step 4: Enhancing with Helius holder counts...');
      
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
      
      console.log('✅ [COMPLETE LIVE STREAMS] Enhanced coins with Helius holder counts');
    }

    const response = {
      success: true,
      data: enhancedCoins,
      count: enhancedCoins.length,
      timestamp: Date.now(),
      source: 'complete-api',
      metadata: {
        total_fetched: enhancedCoins.length,
        max_requested: maxCoins,
        dexscreener_enhanced: includeDexScreener,
        helius_enhanced: includeHelius,
        enhanced_count: enhancedCoins.filter((coin: any) => 
          coin.token.enhanced_with_dexscreener || coin.token.enhanced_with_helius
        ).length,
        dexscreener_count: enhancedCoins.filter((coin: any) => coin.token.enhanced_with_dexscreener).length,
        helius_count: enhancedCoins.filter((coin: any) => coin.token.enhanced_with_helius).length,
      }
    };

    console.log('✅ [COMPLETE LIVE STREAMS] Response prepared:', {
      count: response.count,
      enhanced: response.metadata.enhanced_count,
      dexscreener: response.metadata.dexscreener_count,
      helius: response.metadata.helius_count
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [COMPLETE LIVE STREAMS] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now(),
    }, { status: 500 });
  }
}
