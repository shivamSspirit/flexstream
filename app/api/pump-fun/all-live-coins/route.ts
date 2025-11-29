import { NextRequest, NextResponse } from 'next/server';
import { fetchLiveCoins, transformPumpFunCoin, isPumpFunConfigured } from '@/lib/pump-fun';

export async function GET(request: NextRequest) {
  console.log('🚀 [ALL LIVE COINS] GET /api/pump-fun/all-live-coins - Starting request');
  
  try {
    // Check if Pump.fun is configured
    if (!isPumpFunConfigured()) {
      console.log('❌ [ALL LIVE COINS] Pump.fun not configured');
      return NextResponse.json({
        success: false,
        error: 'Pump.fun API not configured. Please check your environment variables.',
        timestamp: Date.now(),
      }, { status: 500 });
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50'); // Increased limit to get more coins per page
    const fetchAll = url.searchParams.get('fetchAll') === 'true';

    console.log('📊 [ALL LIVE COINS] Parameters:', { page, limit, fetchAll });

    if (fetchAll) {
      // Fetch ALL live coins by paginating through all pages
      console.log('🔍 [ALL LIVE COINS] Fetching ALL live coins from Pump.fun...');
      
      let allCoins: any[] = [];
      let currentOffset = 0;
      let hasMoreCoins = true;
      let pageCount = 0;
      const maxPages = 20; // Safety limit to prevent infinite loops
      
      while (hasMoreCoins && pageCount < maxPages) {
        console.log(`📄 [ALL LIVE COINS] Fetching page ${pageCount + 1} (offset: ${currentOffset}, limit: ${limit})...`);
        
        try {
          const pageCoins = await fetchLiveCoins({ offset: currentOffset, limit }, 'dummy-jwt-token');
          console.log(`✅ [ALL LIVE COINS] Fetched ${pageCoins.length} coins from page ${pageCount + 1}`);
          
          if (pageCoins.length === 0) {
            hasMoreCoins = false;
            console.log('📄 [ALL LIVE COINS] No more coins found, stopping pagination');
          } else {
            allCoins = allCoins.concat(pageCoins);
            currentOffset += limit;
            pageCount++;
            
            // If we got fewer coins than the limit, we've reached the end
            if (pageCoins.length < limit) {
              hasMoreCoins = false;
              console.log('📄 [ALL LIVE COINS] Reached end of data (got fewer coins than limit)');
            }
            
            // Add a small delay to prevent rate limiting
            if (hasMoreCoins) {
              console.log('⏳ [ALL LIVE COINS] Waiting 1 second to prevent rate limiting...');
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        } catch (error) {
          console.error(`❌ [ALL LIVE COINS] Error fetching page ${pageCount + 1}:`, error);
          hasMoreCoins = false;
        }
      }
      
      console.log(`🎉 [ALL LIVE COINS] Fetched ${allCoins.length} total coins across ${pageCount} pages`);
      
      // Transform all coins
      console.log('🔄 [ALL LIVE COINS] Transforming all coins...');
      const transformedCoins = allCoins.map((coin: any) => transformPumpFunCoin(coin));
      console.log('✅ [ALL LIVE COINS] Transformed', transformedCoins.length, 'coins');
      
      const response = {
        success: true,
        data: transformedCoins,
        count: transformedCoins.length,
        timestamp: Date.now(),
        source: 'all-live-coins',
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
      
      console.log('✅ [ALL LIVE COINS] Response prepared:', {
        count: response.count,
        pages: response.metadata.pages_fetched,
        sample: response.metadata.sample_data
      });
      
      return NextResponse.json(response);
      
    } else {
      // Regular pagination for single page
      const offset = (page - 1) * limit;
      
      console.log(`🔍 [ALL LIVE COINS] Fetching page ${page} (offset: ${offset}, limit: ${limit})...`);
      const liveCoins = await fetchLiveCoins({ offset, limit }, 'dummy-jwt-token');
      console.log('✅ [ALL LIVE COINS] Fetched', liveCoins.length, 'live coins');
      
      // Transform Pump.fun data
      console.log('🔄 [ALL LIVE COINS] Transforming data...');
      const transformedCoins = liveCoins.map((coin: any) => transformPumpFunCoin(coin));
      console.log('✅ [ALL LIVE COINS] Transformed', transformedCoins.length, 'coins');
      
      // Calculate pagination metadata
      const hasNextPage = liveCoins.length === limit;
      const hasPrevPage = page > 1;
      
      const response = {
        success: true,
        data: transformedCoins,
        pagination: {
          currentPage: page,
          totalPages: hasNextPage ? page + 1 : page,
          totalCoins: transformedCoins.length,
          limit,
          hasNextPage,
          hasPrevPage,
          nextPage: hasNextPage ? page + 1 : null,
          prevPage: hasPrevPage ? page - 1 : null
        },
        count: transformedCoins.length,
        timestamp: Date.now(),
        source: 'all-live-coins-paginated'
      };
      
      console.log('✅ [ALL LIVE COINS] Response prepared:', {
        count: response.count,
        page: response.pagination.currentPage,
        hasNext: response.pagination.hasNextPage
      });
      
      return NextResponse.json(response);
    }

  } catch (error) {
    console.error('❌ [ALL LIVE COINS] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now(),
    }, { status: 500 });
  }
}
