import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { 
  fetchLiveCoins, 
  transformPumpFunCoin, 
  isPumpFunConfigured 
} from '@/lib/pump-fun';
import { generateTokenForClerkUser } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  console.log('🚀 [PUMP-FUN API] GET /api/pump-fun/live-streams - Starting request');
  
  try {
    // Check if user is authenticated with Clerk
    const { userId } = await auth();
    console.log('🔐 [PUMP-FUN API] Auth check - userId:', userId);
    
    if (!userId) {
      console.log('❌ [PUMP-FUN API] No userId found - returning 401');
      return NextResponse.json({
        success: false,
        error: 'Authentication required. Please sign in to access live streams.',
        data: [],
        count: 0,
        timestamp: Date.now(),
        source: 'pump.fun-api',
        code: 'UNAUTHORIZED'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100'); // Increased default limit
    const offset = parseInt(searchParams.get('offset') || '0');
    const includeNsfw = searchParams.get('includeNsfw') === 'true';
    const order = (searchParams.get('order') as 'ASC' | 'DESC') || 'DESC';

    console.log('📊 [PUMP-FUN API] Request params:', { limit, offset, includeNsfw, order });
    console.log(`👤 [PUMP-FUN API] Fetching live coins for authenticated user: ${userId}`);

    // Generate JWT token for this user
    const email = `user-${userId}@flexstream.app`;
    console.log('🔑 [PUMP-FUN API] Generating JWT token for email:', email);
    
    const jwtToken = generateTokenForClerkUser(userId, email);
    console.log('✅ [PUMP-FUN API] JWT token generated successfully, length:', jwtToken.length);

    console.log('🌐 [PUMP-FUN API] Calling fetchLiveCoins with params:', {
      offset,
      limit,
      includeNsfw,
      order,
      hasJwtToken: !!jwtToken
    });

    // Fetch live coins using utility function with JWT token
    const liveCoins = await fetchLiveCoins({
      offset,
      limit,
      includeNsfw,
      order
    }, jwtToken);

    console.log('📈 [PUMP-FUN API] Raw liveCoins response:', {
      type: typeof liveCoins,
      isArray: Array.isArray(liveCoins),
      length: Array.isArray(liveCoins) ? liveCoins.length : 'N/A',
      firstItem: Array.isArray(liveCoins) && liveCoins.length > 0 ? liveCoins[0] : 'No items'
    });

    // Transform the data to match our interface
    const transformedCoins = liveCoins.map(transformPumpFunCoin);
    console.log('🔄 [PUMP-FUN API] Transformed coins:', {
      count: transformedCoins.length,
      firstTransformed: transformedCoins.length > 0 ? transformedCoins[0] : 'No items'
    });

    const response = {
      success: true,
      data: transformedCoins,
      count: transformedCoins.length,
      timestamp: Date.now(),
      source: 'pump.fun-api'
    };

    console.log('✅ [PUMP-FUN API] Returning successful response:', {
      success: response.success,
      count: response.count,
      timestamp: response.timestamp
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [PUMP-FUN API] Error fetching live coins from Pump.fun:', {
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
      source: 'pump.fun-api'
    }, { status: 500 });
  }
}

// Optional: Add a POST endpoint for filtering live coins
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated with Clerk
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required. Please sign in to access live streams.',
        data: [],
        count: 0,
        timestamp: Date.now(),
        source: 'pump.fun-api',
        code: 'UNAUTHORIZED'
      }, { status: 401 });
    }

    const body = await request.json();
    const { 
      filters, 
      limit = 100, 
      offset = 0, 
      includeNsfw = false, 
      order = 'DESC' 
    } = body;

    console.log(`Filtering live coins for authenticated user: ${userId}`);

    // Generate JWT token for this user
    const email = `user-${userId}@flexstream.app`;
    const jwtToken = generateTokenForClerkUser(userId, email);

    // Fetch live coins using utility function with JWT token
    const liveCoins = await fetchLiveCoins({
      offset,
      limit,
      includeNsfw,
      order
    }, jwtToken);

    // Transform the data to match our interface
    const transformedCoins = liveCoins.map(transformPumpFunCoin);
    let filteredCoins = transformedCoins;

    // Apply filters
    if (filters) {
      if (filters.min_market_cap) {
        filteredCoins = filteredCoins.filter((coin: any) => 
          coin.market_cap >= filters.min_market_cap
        );
      }
      if (filters.max_market_cap) {
        filteredCoins = filteredCoins.filter((coin: any) => 
          coin.market_cap <= filters.max_market_cap
        );
      }
      if (filters.min_volume_24h) {
        filteredCoins = filteredCoins.filter((coin: any) => 
          coin.volume_24h >= filters.min_volume_24h
        );
      }
      if (filters.max_volume_24h) {
        filteredCoins = filteredCoins.filter((coin: any) => 
          coin.volume_24h <= filters.max_volume_24h
        );
      }
      if (filters.price_change_direction) {
        if (filters.price_change_direction === 'up') {
          filteredCoins = filteredCoins.filter((coin: any) => 
            coin.price_change_24h > 0
          );
        } else if (filters.price_change_direction === 'down') {
          filteredCoins = filteredCoins.filter((coin: any) => 
            coin.price_change_24h < 0
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: filteredCoins,
      count: filteredCoins.length,
      filters_applied: filters || {},
      timestamp: Date.now(),
      source: 'pump.fun-api'
    });

  } catch (error) {
    console.error('Error filtering live coins:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      data: [],
      count: 0,
      timestamp: Date.now(),
      source: 'pump.fun-api'
    }, { status: 500 });
  }
}
