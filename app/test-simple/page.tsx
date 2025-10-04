'use client';

import { useState, useEffect } from 'react';

export default function TestSimplePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🧪 [SIMPLE TEST] Starting API call...');
      
      const response = await fetch('/api/simple-paginated?page=1&limit=5');
      console.log('🧪 [SIMPLE TEST] Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('🧪 [SIMPLE TEST] API Response:', result);
      
      setData(result);
    } catch (err) {
      console.error('❌ [SIMPLE TEST] Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Simple Test Page</h1>
        
        <div className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-4">API Test</h2>
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Fetch Data'}
            </button>
            
            {error && (
              <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                <p className="text-red-400 font-medium">Error:</p>
                <p className="text-red-300">{error}</p>
              </div>
            )}
            
            {data && (
              <div className="mt-4 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                <p className="text-green-400 font-medium mb-2">Data Loaded:</p>
                <div className="text-gray-300 text-sm">
                  <p>Success: {data.success ? '✅' : '❌'}</p>
                  <p>Count: {data.data?.length || 0}</p>
                  <p>Total: {data.pagination?.totalCoins || 0}</p>
                </div>
                {data.data && data.data.length > 0 && (
                  <div className="mt-4">
                    <p className="text-green-400 font-medium mb-2">First Item:</p>
                    <div className="text-gray-300 text-sm">
                      <p>Name: {data.data[0].token?.name || 'N/A'}</p>
                      <p>Symbol: {data.data[0].token?.symbol || 'N/A'}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
