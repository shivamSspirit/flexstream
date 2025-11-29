import { NextRequest, NextResponse } from 'next/server';
import { 
  fetchAllLiveCoins, 
  transformPumpFunCoin, 
  isPumpFunConfigured 
} from '@/lib/pump-fun';

export async function GET(request: NextRequest) {
  console.log('🚀 [WORKING LIVE STREAMS] GET /api/pump-fun/working-live-streams - Starting request');
  
  try {
    // Check if Pump.fun is configured
    if (!isPumpFunConfigured()) {
      console.log('❌ [WORKING LIVE STREAMS] Pump.fun not configured');
      return NextResponse.json({
        success: false,
        error: 'Pump.fun API not configured. Please check your environment variables.',
        timestamp: Date.now(),
      }, { status: 500 });
    }

    const url = new URL(request.url);
    const maxCoins = parseInt(url.searchParams.get('maxCoins') || '20');

    console.log('📊 [WORKING LIVE STREAMS] Parameters:', { maxCoins });

    // Step 1: Fetch live coins from Pump.fun
    console.log('🔍 [WORKING LIVE STREAMS] Step 1: Fetching live coins from Pump.fun...');
    const liveCoins = await fetchAllLiveCoins(undefined, maxCoins);
    console.log('✅ [WORKING LIVE STREAMS] Fetched', liveCoins.length, 'live coins');

    // Step 2: Transform Pump.fun data
    console.log('🔄 [WORKING LIVE STREAMS] Step 2: Transforming Pump.fun data...');
    const transformedCoins = liveCoins.map((coin: any) => transformPumpFunCoin(coin));
    console.log('✅ [WORKING LIVE STREAMS] Transformed', transformedCoins.length, 'coins');

    // Step 3: Add mock data for demonstration
    const enhancedCoins = transformedCoins.map((coin: any, index: number) => {
      // Add realistic mock data for demonstration
      const mockData = {
        viewer_count: Math.floor(Math.random() * 1000) + 100,
        volume_24h: Math.floor(Math.random() * 1000000) + 10000,
        volume_1h: Math.floor(Math.random() * 100000) + 1000,
        volume_5m: Math.floor(Math.random() * 10000) + 100,
        market_cap: Math.floor(Math.random() * 10000000) + 1000000,
        holders_count: Math.floor(Math.random() * 10000) + 100,
        trades_24h: Math.floor(Math.random() * 1000) + 10,
        price_change_24h: (Math.random() - 0.5) * 100,
        messages_last_5m: Math.floor(Math.random() * 50),
        messages_per_minute: Math.random() * 2,
        previous_streams: Math.floor(Math.random() * 10),
        stream_duration: Math.floor(Math.random() * 3600) + 300, // 5 minutes to 1 hour
        social_links: {
          twitter: `@${coin.token.symbol.toLowerCase()}_official`,
          website: `https://${coin.token.symbol.toLowerCase()}.com`,
          telegram: `https://t.me/${coin.token.symbol.toLowerCase()}_official`
        }
      };

      return {
        ...coin,
        token: {
          ...coin.token,
          market_cap: mockData.market_cap,
          volume_24h: mockData.volume_24h,
          holders_count: mockData.holders_count,
          trades_24h: mockData.trades_24h,
          price_change_24h: mockData.price_change_24h,
          enhanced_with_mock: true
        },
        stream_info: {
          ...coin.stream_info,
          viewer_count: mockData.viewer_count,
          volume_1h: mockData.volume_1h,
          volume_5m: mockData.volume_5m,
          messages_last_5m: mockData.messages_last_5m,
          messages_per_minute: mockData.messages_per_minute,
          previous_streams: mockData.previous_streams,
          stream_duration: mockData.stream_duration
        },
        streamer: {
          ...coin.streamer,
          social_links: mockData.social_links,
          followers_count: Math.floor(Math.random() * 10000) + 100
        }
      };
    });

    const response = {
      success: true,
      data: enhancedCoins,
      count: enhancedCoins.length,
      timestamp: Date.now(),
      source: 'working-api',
      metadata: {
        total_fetched: enhancedCoins.length,
        max_requested: maxCoins,
        enhanced_with_mock: true,
        sample_data: {
          first_token: {
            name: enhancedCoins[0]?.token.name,
            symbol: enhancedCoins[0]?.token.symbol,
            market_cap: enhancedCoins[0]?.token.market_cap,
            viewers: enhancedCoins[0]?.stream_info?.viewer_count
          }
        }
      }
    };

    console.log('✅ [WORKING LIVE STREAMS] Response prepared:', {
      count: response.count,
      sample: response.metadata.sample_data
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [WORKING LIVE STREAMS] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now(),
    }, { status: 500 });
  }
}
