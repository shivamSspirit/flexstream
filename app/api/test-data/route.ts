import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('🧪 [TEST DATA] GET /api/test-data - Starting request');
  
  try {
    const url = new URL(request.url);
    const count = parseInt(url.searchParams.get('count') || '5');

    // Create mock data with all the fields you need
    const mockStreams = Array.from({ length: count }, (_, index) => ({
      token: {
        name: `Token ${index + 1}`,
        symbol: `TKN${index + 1}`,
        mint: `mint_address_${index + 1}_${Math.random().toString(36).substring(7)}`,
        market_cap: Math.floor(Math.random() * 10000000) + 1000000,
        volume_24h: Math.floor(Math.random() * 1000000) + 10000,
        holders_count: Math.floor(Math.random() * 10000) + 100,
        trades_24h: Math.floor(Math.random() * 1000) + 10,
        price_change_24h: (Math.random() - 0.5) * 100,
        image_url: `https://picsum.photos/100/100?random=${index}`,
        description: `This is token ${index + 1} description`,
        enhanced_with_mock: true
      },
      stream_info: {
        viewer_count: Math.floor(Math.random() * 1000) + 100,
        volume_1h: Math.floor(Math.random() * 100000) + 1000,
        volume_5m: Math.floor(Math.random() * 10000) + 100,
        messages_last_5m: Math.floor(Math.random() * 50),
        messages_per_minute: Math.random() * 2,
        previous_streams: Math.floor(Math.random() * 10),
        stream_duration: Math.floor(Math.random() * 3600) + 300
      },
      streamer: {
        name: `Streamer ${index + 1}`,
        username: `streamer${index + 1}`,
        followers_count: Math.floor(Math.random() * 10000) + 100,
        social_links: {
          twitter: `@streamer${index + 1}`,
          website: `https://streamer${index + 1}.com`,
          telegram: `https://t.me/streamer${index + 1}`
        }
      },
      trading_activity: {
        market_cap: 0,
        total_volume_24h: 0
      }
    }));

    const response = {
      success: true,
      data: mockStreams,
      count: mockStreams.length,
      timestamp: Date.now(),
      source: 'test-api',
      metadata: {
        total_fetched: mockStreams.length,
        max_requested: count,
        enhanced_with_mock: true
      }
    };

    console.log('✅ [TEST DATA] Response prepared:', {
      count: response.count,
      sample: response.data[0]?.token.name
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [TEST DATA] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now(),
    }, { status: 500 });
  }
}
