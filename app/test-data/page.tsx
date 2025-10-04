'use client';

import { useState, useEffect } from 'react';

export default function TestDataPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🔍 [TEST DATA] Fetching data...');
        const response = await fetch('/api/test-live-streams?maxCoins=3&includeDexScreener=true');
        console.log('📡 [TEST DATA] Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('📊 [TEST DATA] Result:', result);
        setData(result);
      } catch (err) {
        console.error('❌ [TEST DATA] Error:', err);
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
        <div className="text-red-400 text-xl">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900 p-8">
      <div className="text-white">
        <h1 className="text-3xl font-bold mb-6">Test Data Results</h1>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">API Response:</h2>
          <div className="bg-gray-800 p-4 rounded-lg">
            <p><strong>Success:</strong> {data?.success ? '✅' : '❌'}</p>
            <p><strong>Count:</strong> {data?.count}</p>
            <p><strong>Enhanced Count:</strong> {data?.metadata?.enhanced_count}</p>
            <p><strong>DexScreener Count:</strong> {data?.metadata?.dexscreener_count}</p>
            <p><strong>Helius Count:</strong> {data?.metadata?.helius_count}</p>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">First Token Market Cap:</h2>
          {data?.data?.[0] && (
            <div className="bg-gray-800 p-4 rounded-lg">
              <p><strong>Name:</strong> {data.data[0].token.name}</p>
              <p><strong>Symbol:</strong> {data.data[0].token.symbol}</p>
              <p><strong>Mint:</strong> {data.data[0].token.mint}</p>
              <p><strong>Market Cap:</strong> ${data.data[0].token.market_cap?.toLocaleString()}</p>
              <p><strong>Enhanced with DexScreener:</strong> {data.data[0].token.enhanced_with_dexscreener ? '✅' : '❌'}</p>
              <p><strong>Enhanced with Helius:</strong> {data.data[0].token.enhanced_with_helius ? '✅' : '❌'}</p>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Raw Data:</h2>
          <pre className="bg-gray-800 p-4 rounded-lg overflow-auto text-sm">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
