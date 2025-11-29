'use client';

import { useState, useEffect } from 'react';

export default function DebugUIPage() {
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testAPI = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🧪 [DEBUG] Testing API call...');
      
      const url = new URL('/api/simple-paginated', window.location.origin);
      url.searchParams.append('fetchAll', 'true');
      url.searchParams.append('page', '1');
      url.searchParams.append('limit', '5');
      url.searchParams.append('includeDexScreener', 'true');
      url.searchParams.append('includeHelius', 'true');

      console.log('🧪 [DEBUG] Fetching URL:', url.toString());
      
      const response = await fetch(url.toString());
      console.log('🧪 [DEBUG] Response status:', response.status);
      console.log('🧪 [DEBUG] Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('🧪 [DEBUG] API Response:', result);
      
      setApiResponse(result);
    } catch (err) {
      console.error('❌ [DEBUG] Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testAPI();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">UI Debug Page</h1>
        
        <div className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-4">API Test</h2>
            <button
              onClick={testAPI}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test API'}
            </button>
            
            {error && (
              <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                <p className="text-red-400 font-medium">Error:</p>
                <p className="text-red-300">{error}</p>
              </div>
            )}
            
            {apiResponse && (
              <div className="mt-4 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                <p className="text-green-400 font-medium mb-2">API Response:</p>
                <div className="text-gray-300 text-sm">
                  <p>Success: {apiResponse.success ? '✅' : '❌'}</p>
                  <p>Data Count: {apiResponse.data?.length || 0}</p>
                  <p>Total Coins: {apiResponse.pagination?.totalCoins || 0}</p>
                  <p>Current Page: {apiResponse.pagination?.currentPage || 0}</p>
                  <p>Total Pages: {apiResponse.pagination?.totalPages || 0}</p>
                </div>
                {apiResponse.data && apiResponse.data.length > 0 && (
                  <div className="mt-4">
                    <p className="text-green-400 font-medium mb-2">First Stream:</p>
                    <div className="text-gray-300 text-sm">
                      <p>Token: {apiResponse.data[0].token?.name || 'N/A'}</p>
                      <p>Symbol: {apiResponse.data[0].token?.symbol || 'N/A'}</p>
                      <p>Viewers: {apiResponse.data[0].stream_info?.viewer_count || 0}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-4">Browser Info</h2>
            <div className="text-gray-300 text-sm space-y-2">
              <p>User Agent: {typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A'}</p>
              <p>URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}</p>
              <p>Origin: {typeof window !== 'undefined' ? window.location.origin : 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
