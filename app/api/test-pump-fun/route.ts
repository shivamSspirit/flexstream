import { NextRequest, NextResponse } from 'next/server';
import { fetchLiveCoins, isPumpFunConfigured } from '@/lib/pump-fun';

export async function GET(request: NextRequest) {
  console.log('🧪 [TEST PUMP FUN] GET /api/test-pump-fun - Starting request');
  
  try {
    // Check if Pump.fun is configured
    if (!isPumpFunConfigured()) {
      console.log('❌ [TEST PUMP FUN] Pump.fun not configured');
      return NextResponse.json({
        success: false,
        error: 'Pump.fun API not configured. Please check your environment variables.',
        timestamp: Date.now(),
      }, { status: 500 });
    }

    console.log('🔍 [TEST PUMP FUN] Fetching live coins from Pump.fun...');
    const liveCoins = await fetchLiveCoins({ offset: 0, limit: 5 }, 'dummy-jwt-token');
    console.log('✅ [TEST PUMP FUN] Fetched', liveCoins.length, 'live coins');

    const response = {
      success: true,
      data: liveCoins,
      count: liveCoins.length,
      timestamp: Date.now(),
      source: 'test-pump-fun',
      metadata: {
        pump_fun_configured: isPumpFunConfigured(),
        sample_data: liveCoins.length > 0 ? {
          first_coin: {
            name: liveCoins[0]?.name,
            symbol: liveCoins[0]?.symbol,
            mint: liveCoins[0]?.mint
          }
        } : null
      }
    };

    console.log('✅ [TEST PUMP FUN] Response prepared:', {
      count: response.count,
      sample: response.metadata.sample_data
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [TEST PUMP FUN] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now(),
    }, { status: 500 });
  }
}
