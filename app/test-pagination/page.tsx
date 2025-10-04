'use client';

import { useState, useEffect } from 'react';

export default function TestPaginationPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🔍 [TEST PAGINATION] Fetching data...');
        const response = await fetch('/api/simple-paginated?page=1&limit=5');
        console.log('📡 [TEST PAGINATION] Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('📊 [TEST PAGINATION] Result:', result);
        
        setData(result);
      } catch (err) {
        console.error('❌ [TEST PAGINATION] Error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900 p-8">
        <div className="text-white text-xl">Loading test data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900 p-8">
        <div className="text-red-500 text-xl">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900 p-8">
      <h1 className="text-3xl font-bold text-white mb-4">Test Pagination</h1>
      <div className="text-green-400 mb-4">
        ✅ Success: {data?.success ? 'Yes' : 'No'}
      </div>
      <div className="text-green-400 mb-4">
        📊 Count: {data?.count || 0}
      </div>
      <div className="text-green-400 mb-4">
        📄 Page: {data?.pagination?.currentPage || 'N/A'}
      </div>
      <div className="text-green-400 mb-4">
        🔄 Has Next: {data?.pagination?.hasNextPage ? 'Yes' : 'No'}
      </div>
      
      {data?.data && data.data.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-white mb-4">Sample Data:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.data.slice(0, 3).map((stream: any, index: number) => (
              <div key={index} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-4">
                <h3 className="text-white font-bold text-lg">{stream.token.name}</h3>
                <p className="text-gray-400 text-sm">${stream.token.symbol}</p>
                <p className="text-gray-500 text-xs font-mono">
                  {stream.token.mint.substring(0, 8)}...{stream.token.mint.substring(stream.token.mint.length - 8)}
                </p>
                <div className="mt-2 text-green-400 text-sm">
                  Market Cap: ${stream.token.market_cap?.toLocaleString() || 'N/A'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <pre className="mt-8 bg-gray-800 p-4 rounded text-white text-sm overflow-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
