import { NextRequest, NextResponse } from 'next/server';
import {
  getOnlineCount,
  getTradingCount,
  getWatchingCount,
  incrementOnlineCount,
  incrementTradingCount,
  incrementWatchingCount,
  decrementOnlineCount,
  decrementTradingCount,
  decrementWatchingCount,
} from '@/lib/cache';

/**
 * GET /api/stats/fomo
 * Get real-time FOMO counters from Redis
 * Used for "X online now", "X watching", "X trading" displays
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenMint = searchParams.get('token');

    // Get FOMO counts in parallel
    const [online, trading, watching] = await Promise.all([
      getOnlineCount(),
      getTradingCount(),
      tokenMint ? getWatchingCount(tokenMint) : Promise.resolve(0),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        online,
        trading,
        watching: tokenMint ? watching : undefined,
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    console.error('[FOMO Stats API] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch FOMO stats',
    }, { status: 500 });
  }
}

/**
 * POST /api/stats/fomo
 * Track user presence (called when user lands on page or starts trading)
 * Body: { action: 'join' | 'leave', type: 'online' | 'trading' | 'watching', token?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, type, token } = body as {
      action: 'join' | 'leave';
      type: 'online' | 'trading' | 'watching';
      token?: string;
    };

    if (!action || !type) {
      return NextResponse.json({
        success: false,
        error: 'action and type are required',
      }, { status: 400 });
    }

    let count = 0;

    if (action === 'join') {
      switch (type) {
        case 'online':
          count = await incrementOnlineCount();
          break;
        case 'trading':
          count = await incrementTradingCount();
          break;
        case 'watching':
          if (!token) {
            return NextResponse.json({
              success: false,
              error: 'token is required for watching',
            }, { status: 400 });
          }
          count = await incrementWatchingCount(token);
          break;
      }
    } else {
      switch (type) {
        case 'online':
          count = await decrementOnlineCount();
          break;
        case 'trading':
          count = await decrementTradingCount();
          break;
        case 'watching':
          if (!token) {
            return NextResponse.json({
              success: false,
              error: 'token is required for watching',
            }, { status: 400 });
          }
          count = await decrementWatchingCount(token);
          break;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        type,
        count,
        action,
      },
    });
  } catch (error) {
    console.error('[FOMO Stats API] POST Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update FOMO stats',
    }, { status: 500 });
  }
}
