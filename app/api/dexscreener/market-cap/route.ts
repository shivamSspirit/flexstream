import { NextRequest, NextResponse } from 'next/server';
// import { auth } from '@clerk/nextjs/server';
import { fetchTokenMarketCap } from '@/lib/dexscreener';

export async function GET(request: NextRequest) {
  console.log('💰 [MARKET-CAP API] GET /api/dexscreener/market-cap - Starting request');
  
  try {
    // Check if user is authenticated (header-based)
    const userId = request.headers.get('x-user-id');
    console.log('🔐 [MARKET-CAP API] Auth check - userId:', userId);
    
    if (!userId) {
      console.log('❌ [MARKET-CAP API] No userId found - returning 401');
      return NextResponse.json({
        success: false,
        error: 'Authentication required. Please sign in to access market cap data.',
        data: null,
        timestamp: Date.now(),
        source: 'dexscreener-market-cap-api',
        code: 'UNAUTHORIZED'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const contractAddress = searchParams.get('address');

    if (!contractAddress) {
      console.log('❌ [MARKET-CAP API] No contract address provided');
      return NextResponse.json({
        success: false,
        error: 'Contract address is required. Please provide a token contract address.',
        data: null,
        timestamp: Date.now(),
        source: 'dexscreener-market-cap-api',
        code: 'MISSING_ADDRESS'
      }, { status: 400 });
    }

    console.log('💰 [MARKET-CAP API] Fetching market cap for contract:', contractAddress);

    // Fetch market cap data from DexScreener
    const marketCapData = await fetchTokenMarketCap(contractAddress);

    if (!marketCapData) {
      console.log('⚠️ [MARKET-CAP API] No market cap data found for:', contractAddress);
      return NextResponse.json({
        success: false,
        error: 'No market cap data found for this token contract address.',
        data: null,
        timestamp: Date.now(),
        source: 'dexscreener-market-cap-api',
        code: 'NO_DATA_FOUND'
      }, { status: 404 });
    }

    const response = {
      success: true,
      data: marketCapData,
      timestamp: Date.now(),
      source: 'dexscreener-market-cap-api',
      message: 'Market cap data fetched successfully'
    };

    console.log('✅ [MARKET-CAP API] Returning successful response:', {
      success: response.success,
      contractAddress: marketCapData.contractAddress,
      marketCap: marketCapData.marketCap,
      timestamp: response.timestamp
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [MARKET-CAP API] Error fetching market cap data:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    });
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      data: null,
      timestamp: Date.now(),
      source: 'dexscreener-market-cap-api',
      code: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  console.log('💰 [MARKET-CAP API] POST /api/dexscreener/market-cap - Starting batch request');
  
  try {
    // Check if user is authenticated (header-based)
    const userId = request.headers.get('x-user-id');
    console.log('🔐 [MARKET-CAP API] Auth check - userId:', userId);
    
    if (!userId) {
      console.log('❌ [MARKET-CAP API] No userId found - returning 401');
      return NextResponse.json({
        success: false,
        error: 'Authentication required. Please sign in to access market cap data.',
        data: [],
        timestamp: Date.now(),
        source: 'dexscreener-market-cap-api',
        code: 'UNAUTHORIZED'
      }, { status: 401 });
    }

    const body = await request.json();
    const { contractAddresses } = body;

    if (!contractAddresses || !Array.isArray(contractAddresses) || contractAddresses.length === 0) {
      console.log('❌ [MARKET-CAP API] No contract addresses provided');
      return NextResponse.json({
        success: false,
        error: 'Contract addresses array is required. Please provide an array of token contract addresses.',
        data: [],
        timestamp: Date.now(),
        source: 'dexscreener-market-cap-api',
        code: 'MISSING_ADDRESSES'
      }, { status: 400 });
    }

    console.log('💰 [MARKET-CAP API] Fetching market cap for', contractAddresses.length, 'contracts');

    // Fetch market cap data for multiple tokens
    const results = await Promise.allSettled(
      contractAddresses.map(address => fetchTokenMarketCap(address))
    );

    const successful = results
      .filter((result): result is PromiseFulfilledResult<any> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value);

    const failed = results
      .filter(result => result.status === 'rejected')
      .length;

    const response = {
      success: true,
      data: successful,
      metadata: {
        total_requested: contractAddresses.length,
        successful: successful.length,
        failed: failed,
        success_rate: `${((successful.length / contractAddresses.length) * 100).toFixed(1)}%`
      },
      timestamp: Date.now(),
      source: 'dexscreener-market-cap-api',
      message: `Successfully fetched market cap data for ${successful.length} out of ${contractAddresses.length} tokens`
    };

    console.log('✅ [MARKET-CAP API] Returning batch response:', {
      success: response.success,
      total_requested: response.metadata.total_requested,
      successful: response.metadata.successful,
      failed: response.metadata.failed,
      timestamp: response.timestamp
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [MARKET-CAP API] Error fetching batch market cap data:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    });
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      data: [],
      timestamp: Date.now(),
      source: 'dexscreener-market-cap-api',
      code: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 });
  }
}
