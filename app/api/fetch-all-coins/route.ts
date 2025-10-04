import { NextRequest, NextResponse } from 'next/server';
import { fetchLiveCoins, transformPumpFunCoin, isPumpFunConfigured } from '@/lib/pump-fun';

export async function GET(request: NextRequest) {
  console.log('🚀 [FETCH ALL COINS] GET /api/fetch-all-coins - Starting request');
  
  try {
    // Check if Pump.fun is configured
    if (!isPumpFunConfigured()) {
      console.log('❌ [FETCH ALL COINS] Pump.fun not configured');
      return NextResponse.json({
        success: false,
        error: 'Pump.fun API not configured. Please check your environment variables.',
        timestamp: Date.now(),
      }, { status: 500 });
    }

    console.log('🔍 [FETCH ALL COINS] Fetching ALL live coins from Pump.fun...');
    
    let allCoins: any[] = [];
    let currentOffset = 0;
    let hasMoreCoins = true;
    let pageCount = 0;
    const limit = 50; // Fetch 50 coins per page
    const maxPages = 10; // Safety limit to prevent infinite loops
    
    while (hasMoreCoins && pageCount < maxPages) {
      console.log(`📄 [FETCH ALL COINS] Fetching page ${pageCount + 1} (offset: ${currentOffset}, limit: ${limit})...`);
      
      try {
        const pageCoins = await fetchLiveCoins({ offset: currentOffset, limit }, 'dummy-jwt-token');
        console.log(`✅ [FETCH ALL COINS] Fetched ${pageCoins.length} coins from page ${pageCount + 1}`);
        
        if (pageCoins.length === 0) {
          hasMoreCoins = false;
          console.log('📄 [FETCH ALL COINS] No more coins found, stopping pagination');
        } else {
          allCoins = allCoins.concat(pageCoins);
          currentOffset += limit;
          pageCount++;
          
          // If we got fewer coins than the limit, we've reached the end
          if (pageCoins.length < limit) {
            hasMoreCoins = false;
            console.log('📄 [FETCH ALL COINS] Reached end of data (got fewer coins than limit)');
          }
          
          // Add a small delay to prevent rate limiting
          if (hasMoreCoins) {
            console.log('⏳ [FETCH ALL COINS] Waiting 1 second to prevent rate limiting...');
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      } catch (error) {
        console.error(`❌ [FETCH ALL COINS] Error fetching page ${pageCount + 1}:`, error);
        hasMoreCoins = false;
      }
    }
    
    console.log(`🎉 [FETCH ALL COINS] Fetched ${allCoins.length} total coins across ${pageCount} pages`);
    
    // Transform all coins
    console.log('🔄 [FETCH ALL COINS] Transforming all coins...');
    const transformedCoins = allCoins.map((coin: any) => transformPumpFunCoin(coin));
    console.log('✅ [FETCH ALL COINS] Transformed', transformedCoins.length, 'coins');
    
    const response = {
      success: true,
      data: transformedCoins,
      count: transformedCoins.length,
      timestamp: Date.now(),
      source: 'fetch-all-coins',
      metadata: {
        total_coins: transformedCoins.length,
        pages_fetched: pageCount,
        fetch_all: true,
        sample_data: {
          first_coin: transformedCoins[0] ? {
            name: transformedCoins[0].token.name,
            symbol: transformedCoins[0].token.symbol,
            mint: transformedCoins[0].token.mint
          } : null,
          last_coin: transformedCoins[transformedCoins.length - 1] ? {
            name: transformedCoins[transformedCoins.length - 1].token.name,
            symbol: transformedCoins[transformedCoins.length - 1].token.symbol,
            mint: transformedCoins[transformedCoins.length - 1].token.mint
          } : null
        }
      }
    };
    
    console.log('✅ [FETCH ALL COINS] Response prepared:', {
      count: response.count,
      pages: response.metadata.pages_fetched,
      sample: response.metadata.sample_data
    });
    
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [FETCH ALL COINS] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now(),
    }, { status: 500 });
  }
}
