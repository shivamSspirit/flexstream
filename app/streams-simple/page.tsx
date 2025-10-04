'use client';

import { useState, useEffect } from 'react';

export default function StreamsSimplePage() {
  const [streams, setStreams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStreams = async () => {
      try {
        console.log('🔍 [SIMPLE] Starting fetch...');
        
        const response = await fetch('/api/simple-paginated?page=1&limit=5');
        console.log('🔍 [SIMPLE] Response:', response.status, response.statusText);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('🔍 [SIMPLE] Result:', result);
        
        if (result.success && result.data) {
          setStreams(result.data);
          console.log('✅ [SIMPLE] Set streams:', result.data.length);
        } else {
          throw new Error(result.error || 'Failed to fetch streams');
        }
      } catch (err) {
        console.error('❌ [SIMPLE] Error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchStreams();
  }, []);

  console.log('🔍 [SIMPLE] Render - loading:', loading, 'error:', error, 'streams:', streams.length);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <div className="text-white text-xl">Loading streams...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">Error: {error}</div>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Simple Streams Page</h1>
        
        <div className="mb-6">
          <div className="text-green-400 text-lg">
            ✅ Loaded {streams.length} streams
          </div>
        </div>

        {streams.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-xl">No streams found</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {streams.map((stream, index) => (
              <div key={stream.token?.mint || index} className="bg-gray-800 rounded-lg p-6">
                <div className="mb-4">
                  <h3 className="text-white font-bold text-lg">
                    {stream.token?.name || 'Unknown Token'}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {stream.token?.symbol || 'N/A'}
                  </p>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Price:</span>
                    <span className="text-white">
                      ${stream.token?.price_usd?.toFixed(6) || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Market Cap:</span>
                    <span className="text-white">
                      ${stream.token?.market_cap?.toLocaleString() || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Viewers:</span>
                    <span className="text-white">
                      {stream.stream_info?.viewer_count || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Streamer:</span>
                    <span className="text-white">
                      {stream.streamer?.display_name || 'Unknown'}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 flex space-x-2">
                  <button 
                    onClick={() => window.open(`https://pump.fun/coin/${stream.token?.mint}`, '_blank')}
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
        )}
      </div>
    </div>
  );
}
