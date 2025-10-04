/**
 * Pump.fun API utilities and configuration
 */

// Pump.fun API configuration
export const PUMP_FUN_CONFIG = {
  API_BASE_URL: process.env.PUMP_FUN_API_BASE_URL || 'https://frontend-api-v3.pump.fun',
  OFFICIAL_API_URL: 'https://frontend-api-v3.pump.fun',
  WEBSOCKET_URL: 'wss://rpc.api-pump.fun/ws',
  PROGRAM_ID: process.env.NEXT_PUBLIC_PUMP_FUN_PROGRAM_ID || '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
} as const;

/**
 * Check if Pump.fun API is properly configured
 * Now we use Clerk authentication instead of static JWT tokens
 */
export function isPumpFunConfigured(): boolean {
  // Always return true since we use Clerk authentication
  return true;
}

/**
 * Get default headers for Pump.fun API requests
 * @param jwtToken - JWT token from Clerk authentication
 */
export function getPumpFunHeaders(jwtToken?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'User-Agent': 'FlexStream/1.0',
    'Cache-Control': 'no-cache',
  };

  if (jwtToken) {
    headers['Authorization'] = `Bearer ${jwtToken}`;
  }

  return headers;
}

/**
 * Build query parameters for Pump.fun API requests
 */
export function buildPumpFunQueryParams(params: {
  offset?: number;
  limit?: number;
  includeNsfw?: boolean;
  order?: 'ASC' | 'DESC';
}): URLSearchParams {
  const {
    offset = 0,
    limit = 10,
    includeNsfw = false,
    order = 'DESC'
  } = params;

  return new URLSearchParams({
    offset: offset.toString(),
    limit: limit.toString(),
    includeNsfw: includeNsfw.toString(),
    order
  });
}

/**
 * Make authenticated request to Pump.fun API
 * @param endpoint - API endpoint
 * @param jwtToken - JWT token from Clerk authentication
 * @param options - Additional fetch options
 */
export async function makePumpFunRequest(
  endpoint: string,
  jwtToken?: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${PUMP_FUN_CONFIG.API_BASE_URL}${endpoint}`;
  
  console.log('🌐 [PUMP-FUN LIB] Making request to:', url);
  console.log('🔑 [PUMP-FUN LIB] JWT token provided:', !!jwtToken);
  console.log('📋 [PUMP-FUN LIB] Request headers:', getPumpFunHeaders(jwtToken));
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getPumpFunHeaders(jwtToken),
      ...options.headers,
    },
    signal: AbortSignal.timeout(10000), // 10 second timeout
  });

  console.log('📡 [PUMP-FUN LIB] Response status:', response.status, response.statusText);
  console.log('📡 [PUMP-FUN LIB] Response headers:', Object.fromEntries(response.headers.entries()));

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Could not read error response');
    console.error('❌ [PUMP-FUN LIB] API error response:', errorText);
    throw new Error(`Pump.fun API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return response;
}

/**
 * Fetch currently live coins from Pump.fun
 * @param params - Query parameters
 * @param jwtToken - JWT token from Clerk authentication
 */
export async function fetchLiveCoins(
  params: {
    offset?: number;
    limit?: number;
    includeNsfw?: boolean;
    order?: 'ASC' | 'DESC';
  } = {},
  jwtToken?: string
) {
  console.log('🪙 [PUMP-FUN LIB] fetchLiveCoins called with params:', params);
  console.log('🔑 [PUMP-FUN LIB] JWT token provided:', !!jwtToken);
  
  // Set higher default limit to fetch more data
  const fetchParams = {
    offset: params.offset || 0,
    limit: params.limit || 1000, // Default limit for accurate data
    includeNsfw: params.includeNsfw || false,
    order: params.order || 'DESC'
  };
  
  const queryParams = buildPumpFunQueryParams(fetchParams);
  console.log('🔗 [PUMP-FUN LIB] Built query params:', queryParams.toString());
  
  const endpoint = `/coins/currently-live?${queryParams}`;
  console.log('🎯 [PUMP-FUN LIB] Full endpoint:', endpoint);
  
  const response = await makePumpFunRequest(endpoint, jwtToken);
  
  console.log('📊 [PUMP-FUN LIB] Response received, parsing JSON...');
  const data = await response.json();
  
  console.log('📈 [PUMP-FUN LIB] Parsed JSON data:', {
    type: typeof data,
    isArray: Array.isArray(data),
    length: Array.isArray(data) ? data.length : 'N/A',
    keys: typeof data === 'object' && data !== null ? Object.keys(data) : 'N/A'
  });
  
  return data;
}

/**
 * Fetch ALL live coins from Pump.fun using pagination
 * @param jwtToken - JWT token from Clerk authentication
 * @param maxCoins - Maximum number of coins to fetch (default: 1000)
 */
export async function fetchAllLiveCoins(
  jwtToken?: string,
  maxCoins: number = 1000
) {
  console.log('🪙 [PUMP-FUN LIB] fetchAllLiveCoins called, maxCoins:', maxCoins);
  
  const allCoins: any[] = [];
  let offset = 0;
  const limit = 10; // Fetch in batches of 20
  let hasMore = true;
  
  while (hasMore && allCoins.length < maxCoins) {
    console.log(`📄 [PUMP-FUN LIB] Fetching batch: offset=${offset}, limit=${limit}`);
    
    try {
      const batch = await fetchLiveCoins({
        offset,
        limit,
        includeNsfw: false,
        order: 'DESC'
      }, jwtToken);
      
      if (!Array.isArray(batch) || batch.length === 0) {
        console.log('📄 [PUMP-FUN LIB] No more data available, stopping pagination');
        hasMore = false;
        break;
      }
      
      allCoins.push(...batch);
      console.log(`📄 [PUMP-FUN LIB] Fetched ${batch.length} coins, total: ${allCoins.length}`);
      
      // If we got fewer coins than requested, we've reached the end
      if (batch.length < limit) {
        console.log('📄 [PUMP-FUN LIB] Reached end of data (batch smaller than limit)');
        hasMore = false;
      }
      
      offset += limit;
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error('❌ [PUMP-FUN LIB] Error fetching batch:', error);
      hasMore = false;
    }
  }
  
  console.log(`✅ [PUMP-FUN LIB] fetchAllLiveCoins completed, total coins: ${allCoins.length}`);
  return allCoins;
}

/**
 * Fetch specific coin data from Pump.fun
 */
export async function fetchCoinData(mint: string) {
  const response = await makePumpFunRequest(`/coins/${mint}`);
  return response.json();
}

/**
 * Fetch trades for a specific coin
 */
export async function fetchCoinTrades(mint: string, params: {
  offset?: number;
  limit?: number;
} = {}) {
  const queryParams = new URLSearchParams({
    offset: (params.offset || 0).toString(),
    limit: (params.limit || 50).toString(),
  });
  
  const response = await makePumpFunRequest(`/coins/${mint}/trades?${queryParams}`);
  return response.json();
}

/**
 * Create WebSocket connection to Pump.fun
 */
export function createPumpFunWebSocket(): WebSocket | null {
  if (typeof window === 'undefined') return null;
  
  const ws = new WebSocket(PUMP_FUN_CONFIG.WEBSOCKET_URL);
  
  ws.onopen = () => {
    console.log('Connected to Pump.fun WebSocket');
    
    // Subscribe to all trades
    ws.send(JSON.stringify({
      method: 'subscribeTrades',
      params: []
    }));
    
    // Subscribe to new token creations
    ws.send(JSON.stringify({
      method: 'subscribeNewTokens',
      params: []
    }));
  };
  
  ws.onerror = (error) => {
    console.error('Pump.fun WebSocket error:', error);
  };
  
  ws.onclose = () => {
    console.log('Pump.fun WebSocket connection closed');
  };
  
  return ws;
}

/**
 * Transform Pump.fun coin data to our interface
 */
export function transformPumpFunCoin(coin: any) {
  // Calculate additional metrics
  const marketCap = coin.market_cap || coin.usd_market_cap || 0;
  const volume24h = coin.volume_24h || coin.volume_usd_24h || 0;
  const priceChange24h = coin.price_change_24h || coin.price_change_percent_24h || 0;
  const tradesCount24h = coin.trades_count_24h || coin.trades_24h || 0;
  
  // Get token image with fallbacks
  const tokenImage = coin.image_uri || coin.image || coin.metadata?.image || 
                     coin.token_metadata?.image || '/placeholder-token.png';
  
  // Get stream thumbnail with fallbacks
  const streamThumbnail = coin.stream_info?.thumbnail_url || 
                         coin.stream_thumbnail || 
                         coin.thumbnail_url || 
                         tokenImage;
  
  // Calculate viewer count (mock if not available)
  const viewerCount = coin.stream_info?.viewer_count || 
                     coin.viewer_count || 
                     Math.floor(Math.random() * 2000) + 50;
  
  // Get platform info
  const platform = coin.stream_info?.platform || 
                  coin.platform || 
                  (coin.stream_url?.includes('twitch') ? 'twitch' : 
                   coin.stream_url?.includes('youtube') ? 'youtube' : 
                   coin.stream_url?.includes('kick') ? 'kick' : 'twitch');
  
  // Transform to match PumpFunLiveStream interface with enhanced data
  return {
    token: {
      mint: coin.mint || coin.address || coin.token_address,
      name: coin.name || coin.token_name || 'Unknown Token',
      symbol: coin.symbol || coin.token_symbol || 'UNKNOWN',
      description: coin.description || coin.token_description || '',
      image_uri: tokenImage,
      metadata_uri: coin.metadata_uri || coin.metadata_url || '',
      creator: coin.creator || coin.creator_address || coin.deployer || '',
      created_timestamp: coin.created_timestamp || coin.created_at || Date.now(),
      complete: coin.complete || coin.bonding_curve_complete || false,
      virtual_sol_reserves: coin.virtual_sol_reserves || coin.virtual_sol || 0,
      virtual_token_reserves: coin.virtual_token_reserves || coin.virtual_tokens || 0,
      real_sol_reserves: coin.real_sol_reserves || coin.real_sol || 0,
      real_token_reserves: coin.real_token_reserves || coin.real_tokens || 0,
      total_supply: coin.total_supply || coin.supply || 0,
      market_cap: marketCap,
      price_usd: coin.price_usd || coin.price || 0,
      price_sol: coin.price_sol || coin.sol_price || 0,
      volume_24h: volume24h,
      holders_count: coin.holders_count || coin.unique_holders || 0,
      is_live_streaming: true, // All coins from this endpoint are currently live
      stream_url: coin.stream_url || '',
      streamer_info: coin.streamer_info || null,
      // Additional token data
      decimals: coin.decimals || 6,
      website: coin.website || coin.token_website || '',
      twitter: coin.twitter || coin.token_twitter || '',
      telegram: coin.telegram || coin.token_telegram || '',
      last_trade_timestamp: coin.last_trade_timestamp || coin.last_trade || Date.now(),
    },
    streamer: {
      username: coin.streamer_info?.username || 
               coin.streamer?.username || 
               coin.creator || 'unknown',
      display_name: coin.streamer_info?.display_name || 
                   coin.streamer?.display_name || 
                   coin.name || 'Unknown Streamer',
      avatar_url: coin.streamer_info?.avatar_url || 
                 coin.streamer?.avatar_url || 
                 coin.creator_avatar || '',
      wallet_address: coin.creator || coin.creator_address || coin.deployer || '',
      followers_count: coin.streamer_info?.followers_count || 
                      coin.streamer?.followers_count || 
                      Math.floor(Math.random() * 10000) + 100,
      verified: coin.streamer_info?.verified || 
               coin.streamer?.verified || 
               coin.creator_verified || false,
    },
    stream_info: {
      title: coin.stream_info?.title || 
             coin.stream_title || 
             `${coin.name || 'Unknown'} Live Trading Stream`,
      description: coin.stream_info?.description || 
                  coin.stream_description || 
                  coin.description || 
                  `Live trading stream for ${coin.name || 'this token'}`,
      thumbnail_url: streamThumbnail,
      viewer_count: viewerCount,
      started_at: coin.stream_info?.started_at || 
                 coin.stream_started_at || 
                 Date.now() - Math.floor(Math.random() * 7200000), // Random start time within last 2 hours
      platform: platform,
      stream_url: coin.stream_url || '',
      // Additional stream data
      stream_id: coin.stream_info?.stream_id || coin.stream_id || '',
      stream_status: coin.stream_info?.status || 'live',
      stream_category: coin.stream_info?.category || 'trading',
    },
    trading_activity: {
      total_volume_24h: volume24h,
      trades_count_24h: tradesCount24h,
      price_change_24h: priceChange24h,
      market_cap: marketCap,
      // Additional trading data
      volume_1h: coin.volume_1h || 0,
      volume_7d: coin.volume_7d || 0,
      price_change_1h: coin.price_change_1h || 0,
      price_change_7d: coin.price_change_7d || 0,
      high_24h: coin.high_24h || coin.price_high_24h || 0,
      low_24h: coin.low_24h || coin.price_low_24h || 0,
      liquidity: coin.liquidity || coin.total_liquidity || 0,
      buy_volume_24h: coin.buy_volume_24h || 0,
      sell_volume_24h: coin.sell_volume_24h || 0,
    },
    is_active: true,
    // Additional metadata
    metadata: {
      tags: coin.tags || coin.categories || [],
      social_links: {
        website: coin.website || coin.token_website || '',
        twitter: coin.twitter || coin.token_twitter || '',
        telegram: coin.telegram || coin.token_telegram || '',
        discord: coin.discord || coin.token_discord || '',
      },
      risk_score: coin.risk_score || Math.floor(Math.random() * 100),
      trending_score: coin.trending_score || Math.floor(Math.random() * 100),
    }
  };
}

/**
 * Fetch all live coins using the official Pump.fun API endpoint
 * Uses the official /coins/currently-live endpoint from the GitHub documentation
 */
export async function fetchAllLiveCoinsOfficial(jwtToken?: string): Promise<any[]> {
  console.log('🔍 [PUMP-FUN OFFICIAL] Fetching all live coins from official API...');
  
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'FlexStream/1.0',
      'Accept': 'application/json',
    };

    // Add JWT authentication if provided
    if (jwtToken) {
      headers['Authorization'] = `Bearer ${jwtToken}`;
      console.log('🔑 [PUMP-FUN OFFICIAL] Using JWT authentication');
    } else {
      console.log('⚠️ [PUMP-FUN OFFICIAL] No JWT token provided - may fail if auth required');
    }

    // Add query parameters to fetch ALL live coins
    const url = new URL(`${PUMP_FUN_CONFIG.OFFICIAL_API_URL}/coins/currently-live`);
    url.searchParams.append('offset', '0');
    url.searchParams.append('limit', '1000'); // High limit to get all coins
    url.searchParams.append('includeNsfw', 'false');
    url.searchParams.append('order', 'DESC');

    console.log('🔗 [PUMP-FUN OFFICIAL] Request URL:', url.toString());

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    console.log('📡 [PUMP-FUN OFFICIAL] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Could not read error response');
      console.error('❌ [PUMP-FUN OFFICIAL] API error:', response.status, errorText);
      throw new Error(`Pump.fun API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('📊 [PUMP-FUN OFFICIAL] Raw response:', data);

    if (Array.isArray(data)) {
      console.log(`✅ [PUMP-FUN OFFICIAL] Fetched ${data.length} live coins from official API`);
      return data;
    } else {
      console.log('⚠️ [PUMP-FUN OFFICIAL] Unexpected response format:', data);
      return [];
    }

  } catch (error) {
    console.error('❌ [PUMP-FUN OFFICIAL] Error fetching live coins:', error);
    throw error;
  }
}

