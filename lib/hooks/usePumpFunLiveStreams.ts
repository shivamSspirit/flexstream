import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PumpFunLiveStream, PumpFunStreamFilter } from '@/types';
import { createPumpFunWebSocket } from '@/lib/pump-fun';
import { usePumpFunAuth } from './usePumpFunAuth';

const PUMP_FUN_API_BASE = '/api/pump-fun';
const PUMP_FUN_ALL_API_BASE = '/api/pump-fun/all-live-streams';
const PUMP_FUN_ENHANCED_API_BASE = '/api/pump-fun/enhanced-live-streams';

export function usePumpFunLiveStreams(filters?: PumpFunStreamFilter) {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [realTimeData, setRealTimeData] = useState<any[]>([]);
  
  // Get authentication state
  const { isAuthenticated, isLoading: isAuthLoading, token } = usePumpFunAuth();

  // Fetch live streams data
  const {
    data: liveStreams,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['pump-fun-live-streams', filters, token],
    queryFn: async () => {
      console.log('🎣 [PUMP-FUN HOOK] useQuery queryFn called');
      console.log('🔐 [PUMP-FUN HOOK] Authentication state:', { isAuthenticated, isAuthLoading, hasToken: !!token });
      
      // Temporarily disabled authentication check for testing
      // if (!isAuthenticated) {
      //   console.log('❌ [PUMP-FUN HOOK] Not authenticated, throwing error');
      //   throw new Error('Authentication required. Please sign in to access live streams.');
      // }

      // Use authenticated enhanced endpoint with JWT
      const url = new URL('/api/pump-fun/enhanced-live-streams', window.location.origin);
      
      // Add default parameters for fetching all data
      url.searchParams.append('maxCoins', '20'); // Fetch up to 20 coins for accurate data
      url.searchParams.append('includeDexScreener', 'true'); // Include DexScreener enhancement
      
      console.log('🔗 [PUMP-FUN HOOK] Base URL:', url.toString());
      
      if (filters) {
        console.log('🔍 [PUMP-FUN HOOK] Applying filters:', filters);
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            url.searchParams.set(key, value.toString()); // Use set to override defaults if needed
          }
        });
      }

      const finalUrl = url.toString();
      console.log('🌐 [PUMP-FUN HOOK] Making fetch request to:', finalUrl);

      const response = await fetch(finalUrl);
      console.log('📡 [PUMP-FUN HOOK] Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          console.log('🔒 [PUMP-FUN HOOK] 401 Unauthorized - authentication expired');
          throw new Error('Authentication expired. Please sign in again.');
        }
        const errorText = await response.text().catch(() => 'Could not read error response');
        console.error('❌ [PUMP-FUN HOOK] Fetch failed:', errorText);
        throw new Error(`Failed to fetch live streams: ${response.statusText} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('📊 [PUMP-FUN HOOK] Response data:', {
        success: result.success,
        count: result.count,
        dataType: typeof result.data,
        dataLength: Array.isArray(result.data) ? result.data.length : 'N/A',
        error: result.error
      });
      
      return result.data as PumpFunLiveStream[];
    },
    enabled: isAuthenticated && !isAuthLoading,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 15000, // Consider data stale after 15 seconds
  });

  // WebSocket connection for real-time updates
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const ws = createPumpFunWebSocket();
      if (!ws) {
        console.error('Failed to create WebSocket connection');
        setIsConnected(false);
        return;
      }

      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Connected to Pump.fun WebSocket');
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Real-time Pump.fun data:', data);
          
          // Update real-time data
          setRealTimeData(prev => {
            const newData = [...prev, data];
            // Keep only last 100 items to prevent memory issues
            return newData.slice(-100);
          });

          // Invalidate and refetch live streams data
          queryClient.invalidateQueries({ queryKey: ['pump-fun-live-streams'] });
        } catch (error) {
          console.error('Error parsing WebSocket data:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('Pump.fun WebSocket error:', error);
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log('Pump.fun WebSocket connection closed');
        setIsConnected(false);
        
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (wsRef.current?.readyState !== WebSocket.OPEN) {
            connectWebSocket();
          }
        }, 5000);
      };
    } catch (error) {
      console.error('Failed to connect to Pump.fun WebSocket:', error);
      setIsConnected(false);
    }
  }, [queryClient]);

  // Disconnect WebSocket
  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Connect WebSocket on mount
  useEffect(() => {
    connectWebSocket();
    
    return () => {
      disconnectWebSocket();
    };
  }, [connectWebSocket, disconnectWebSocket]);

  // Filter live streams based on provided filters
  const filteredLiveStreams = liveStreams?.filter(stream => {
    if (!filters) return true;

    if (filters.min_viewers && stream.stream_info.viewer_count < filters.min_viewers) {
      return false;
    }
    if (filters.max_viewers && stream.stream_info.viewer_count > filters.max_viewers) {
      return false;
    }
    if (filters.min_market_cap && stream.trading_activity.market_cap < filters.min_market_cap) {
      return false;
    }
    if (filters.max_market_cap && stream.trading_activity.market_cap > filters.max_market_cap) {
      return false;
    }
    if (filters.min_volume_24h && stream.trading_activity.total_volume_24h < filters.min_volume_24h) {
      return false;
    }
    if (filters.max_volume_24h && stream.trading_activity.total_volume_24h > filters.max_volume_24h) {
      return false;
    }
    if (filters.platform && filters.platform !== 'all' && stream.stream_info.platform !== filters.platform) {
      return false;
    }
    if (filters.verified_streamers_only && !stream.streamer.verified) {
      return false;
    }
    if (filters.price_change_direction) {
      if (filters.price_change_direction === 'up' && stream.trading_activity.price_change_24h <= 0) {
        return false;
      }
      if (filters.price_change_direction === 'down' && stream.trading_activity.price_change_24h >= 0) {
        return false;
      }
    }

    return true;
  }) || [];

  return {
    liveStreams: filteredLiveStreams,
    realTimeData,
    isLoading: isLoading || isAuthLoading,
    error,
    isConnected,
    isAuthenticated,
    refetch,
    connectWebSocket,
    disconnectWebSocket,
  };
}

// Hook for individual coin data
export function usePumpFunCoin(mint: string) {
  return useQuery({
    queryKey: ['pump-fun-coin', mint],
    queryFn: async () => {
      const response = await fetch(`${PUMP_FUN_API_BASE}/coins/${mint}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch coin data: ${response.statusText}`);
      }
      const result = await response.json();
      return result.data;
    },
    enabled: !!mint,
    refetchInterval: 10000, // Refetch every 10 seconds for individual coin
  });
}

// Hook for trading data
export function usePumpFunTrades(mint?: string) {
  return useQuery({
    queryKey: ['pump-fun-trades', mint],
    queryFn: async () => {
      const url = mint 
        ? `${PUMP_FUN_API_BASE}/trades?mint=${mint}`
        : `${PUMP_FUN_API_BASE}/trades`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch trades: ${response.statusText}`);
      }
      const result = await response.json();
      return result.data;
    },
    refetchInterval: 5000, // Refetch every 5 seconds for trades
  });
}
