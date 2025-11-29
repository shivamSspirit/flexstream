import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isPumpFunConfigured, makePumpFunRequest } from '@/lib/pump-fun';
import { generateTokenForClerkUser } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated with Clerk
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required. Please sign in to test the Pump.fun API connection.',
        configured: false,
        authenticated: false,
        timestamp: Date.now(),
      }, { status: 401 });
    }

    // Check if Pump.fun API is configured
    if (!isPumpFunConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'Pump.fun API is not configured properly.',
        configured: false,
        authenticated: true,
        timestamp: Date.now(),
      }, { status: 500 });
    }

    // Generate JWT token for this user
    const email = `user-${userId}@flexstream.app`;
    const jwtToken = generateTokenForClerkUser(userId, email);

    // Test the API connection with a simple request
    try {
      const response = await makePumpFunRequest('/coins/currently-live?limit=1&offset=0&includeNsfw=false&order=DESC', jwtToken);
      const data = await response.json();
      
      return NextResponse.json({
        success: true,
        message: 'Pump.fun API connection successful!',
        configured: true,
        authenticated: true,
        user_id: userId,
        test_data: {
          coins_fetched: Array.isArray(data) ? data.length : 0,
          sample_coin: Array.isArray(data) && data.length > 0 ? {
            mint: data[0].mint || data[0].address,
            name: data[0].name,
            symbol: data[0].symbol,
          } : null,
        },
        timestamp: Date.now(),
      });
    } catch (apiError) {
      return NextResponse.json({
        success: false,
        error: `Pump.fun API request failed: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`,
        configured: true,
        authenticated: true,
        user_id: userId,
        timestamp: Date.now(),
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Test endpoint error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      configured: false,
      authenticated: false,
      timestamp: Date.now(),
    }, { status: 500 });
  }
}
