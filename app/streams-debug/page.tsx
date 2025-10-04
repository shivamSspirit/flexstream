'use client';

import { useState, useEffect } from 'react';

interface StreamData {
  token: {
    name: string;
    symbol: string;
    mint: string;
    price_usd: number;
    market_cap: number;
    volume_24h: number;
    holders_count: number;
  };
  streamer: {
    display_name: string;
    wallet_address: string;
    followers_count: number;
  };
  stream_info: {
    viewer_count: number;
    title: string;
  };
}

export default function StreamsDebugPage() {
  const [streams, setStreams] = useState<StreamData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStreams = async () => {
      try {
        console.log('🔍 [DEBUG] Fetching streams...');
        
        const response = await fetch('/api/simple-paginated?page=1&limit=5');
        console.log('🔍 [DEBUG] Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('🔍 [DEBUG] API Response:', result);
        
        if (result.success && result.data) {
          setStreams(result.data);
          console.log('✅ [DEBUG] Loaded', result.data.length, 'streams');
        } else {
          throw new Error(result.error || 'Failed to fetch streams');
        }
      } catch (err) {
        console.error('❌ [DEBUG] Error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchStreams();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading streams...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-400 text-xl">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Streams Debug Page</h1>
        
        <div className="mb-6">
          <div className="text-green-400 text-lg">
            ✅ Loaded {streams.length} streams
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {streams.map((stream, index) => (
            <div key={stream.token.mint} className="bg-gray-800 rounded-lg p-6">
              <div className="mb-4">
                <h3 className="text-white font-bold text-lg">{stream.token.name}</h3>
                <p className="text-gray-400 text-sm">{stream.token.symbol}</p>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Price:</span>
                  <span className="text-white">${stream.token.price_usd.toFixed(6)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Market Cap:</span>
                  <span className="text-white">${stream.token.market_cap.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Volume 24h:</span>
                  <span className="text-white">${stream.token.volume_24h.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Holders:</span>
                  <span className="text-white">{stream.token.holders_count.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Viewers:</span>
                  <span className="text-white">{stream.stream_info.viewer_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Streamer:</span>
                  <span className="text-white">{stream.streamer.display_name}</span>
                </div>
              </div>
              
              <div className="mt-4 flex space-x-2">
                <button 
                  onClick={() => window.open(`https://pump.fun/coin/${stream.token.mint}`, '_blank')}
                  className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
                >
                  View Token
                </button>
                <button 
                  onClick={() => console.log('Watch stream:', stream)}
                  className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700"
                >
                  Watch Stream
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
