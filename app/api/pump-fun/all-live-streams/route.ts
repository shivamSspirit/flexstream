import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { 
  fetchAllLiveCoins, 
  transformPumpFunCoin, 
  isPumpFunConfigured 
} from '@/lib/pump-fun';
import { generateTokenForClerkUser } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  console.log('🚀 [PUMP-FUN API] GET /api/pump-fun/all-live-streams - Starting request');
  
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
    const maxCoins = parseInt(searchParams.get('maxCoins') || '1000');

    console.log('📊 [PUMP-FUN API] Request params:', { maxCoins });
    console.log(`👤 [PUMP-FUN API] Fetching ALL live coins for authenticated user: ${userId}`);

    // Generate JWT token for this user
    const email = `user-${userId}@flexstream.app`;
    console.log('🔑 [PUMP-FUN API] Generating JWT token for email:', email);
    
    const jwtToken = generateTokenForClerkUser(userId, email);
    console.log('✅ [PUMP-FUN API] JWT token generated successfully, length:', jwtToken.length);

    console.log('🌐 [PUMP-FUN API] Calling fetchAllLiveCoins with params:', {
      maxCoins,
      hasJwtToken: !!jwtToken
    });

    // Fetch ALL live coins using pagination
    const allLiveCoins = await fetchAllLiveCoins(jwtToken, maxCoins);

    console.log('📈 [PUMP-FUN API] Raw allLiveCoins response:', {
      type: typeof allLiveCoins,
      isArray: Array.isArray(allLiveCoins),
      length: Array.isArray(allLiveCoins) ? allLiveCoins.length : 'N/A',
      firstItem: Array.isArray(allLiveCoins) && allLiveCoins.length > 0 ? allLiveCoins[0] : 'No items'
    });

    // Transform the data to match our interface
    const transformedCoins = allLiveCoins.map(transformPumpFunCoin);
    console.log('🔄 [PUMP-FUN API] Transformed coins:', {
      count: transformedCoins.length,
      firstTransformed: transformedCoins.length > 0 ? transformedCoins[0] : 'No items'
    });

    const response = {
      success: true,
      data: transformedCoins,
      count: transformedCoins.length,
      timestamp: Date.now(),
      source: 'pump.fun-api',
      pagination: {
        total_fetched: transformedCoins.length,
        max_requested: maxCoins,
        batches_used: Math.ceil(transformedCoins.length / 200)
      }
    };

    console.log('✅ [PUMP-FUN API] Returning successful response:', {
      success: response.success,
      count: response.count,
      timestamp: response.timestamp,
      pagination: response.pagination
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [PUMP-FUN API] Error fetching all live coins from Pump.fun:', {
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
