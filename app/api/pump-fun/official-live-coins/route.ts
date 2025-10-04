import { NextRequest, NextResponse } from 'next/server';
import { fetchAllLiveCoinsOfficial, transformPumpFunCoin } from '@/lib/pump-fun';

export async function GET(request: NextRequest) {
  console.log('🚀 [OFFICIAL LIVE COINS] GET /api/pump-fun/official-live-coins - Starting request');
  
  try {
    console.log('🔍 [OFFICIAL LIVE COINS] Fetching ALL live coins from official Pump.fun API...');
    
    // Fetch all live coins using the official API endpoint
    const liveCoins = await fetchAllLiveCoinsOfficial();
    console.log('✅ [OFFICIAL LIVE COINS] Fetched', liveCoins.length, 'live coins from official API');
    
    // Transform the data to match our interface
    console.log('🔄 [OFFICIAL LIVE COINS] Transforming data...');
    const transformedCoins = liveCoins.map((coin: any) => transformPumpFunCoin(coin));
    console.log('✅ [OFFICIAL LIVE COINS] Transformed', transformedCoins.length, 'coins');
    
    const response = {
      success: true,
      data: transformedCoins,
      count: transformedCoins.length,
      timestamp: Date.now(),
      source: 'official-pump-fun-api',
      metadata: {
        total_coins: transformedCoins.length,
        api_endpoint: 'https://api.pump.fun/coins/currently-live',
        fetch_all: true,
        sample_data: {
          first_coin: transformedCoins[0] ? {
            name: transformedCoins[0].token.name,
            symbol: transformedCoins[0].token.symbol,
            mint: transformedCoins[0].token.mint,
            market_cap: transformedCoins[0].token.market_cap
          } : null,
          last_coin: transformedCoins[transformedCoins.length - 1] ? {
            name: transformedCoins[transformedCoins.length - 1].token.name,
            symbol: transformedCoins[transformedCoins.length - 1].token.symbol,
            mint: transformedCoins[transformedCoins.length - 1].token.mint,
            market_cap: transformedCoins[transformedCoins.length - 1].token.market_cap
          } : null
        }
      }
    };
    
    console.log('✅ [OFFICIAL LIVE COINS] Response prepared:', {
      count: response.count,
      sample: response.metadata.sample_data
    });
    
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [OFFICIAL LIVE COINS] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now(),
    }, { status: 500 });
  }
}
