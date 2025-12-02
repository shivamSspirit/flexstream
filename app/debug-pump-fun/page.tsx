'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DebugPumpFunPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testPumpFunAPI = async () => {
    setLoading(true);
    setTestResult(null);
    
    try {
      console.log('🧪 [DEBUG] Starting Pump.fun API test...');
      
      const response = await fetch('/api/pump-fun/all-live-streams?maxCoins=50');
      console.log('📡 [DEBUG] API Response:', response);
      
      const data = await response.json();
      console.log('📊 [DEBUG] API Data:', data);
      
      setTestResult({
        status: response.status,
        statusText: response.statusText,
        data: data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ [DEBUG] Test failed:', error);
      setTestResult({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const testJWTGeneration = async () => {
    setLoading(true);
    setTestResult(null);
    
    try {
      console.log('🔑 [DEBUG] Testing JWT generation...');
      
      const response = await fetch('/api/auth/pump-fun-token', {
        method: 'POST'
      });
      console.log('📡 [DEBUG] JWT Response:', response);
      
      const data = await response.json();
      console.log('📊 [DEBUG] JWT Data:', data);
      
      setTestResult({
        status: response.status,
        statusText: response.statusText,
        data: data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ [DEBUG] JWT test failed:', error);
      setTestResult({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white text-2xl">Pump.fun API Debug</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-white">
              <p><strong>Auth:</strong> Removed (using Privy now)</p>
            </div>

            <div className="flex space-x-4 flex-wrap gap-2">
              <Button
                onClick={testPumpFunAPI}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Testing...' : 'Test All Live Streams (50)'}
              </Button>

              <Button
                onClick={testJWTGeneration}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? 'Testing...' : 'Test JWT Generation'}
              </Button>
            </div>
            
            {testResult && (
              <Card className="bg-black/20 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Test Result</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-green-400 text-sm overflow-auto max-h-96">
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white text-xl">Instructions</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-300">
            <ol className="list-decimal list-inside space-y-2">
              <li>Click "Test JWT Generation" first to verify JWT token creation</li>
              <li>Click "Test Pump.fun API" to test the live streams endpoint</li>
              <li>Check the browser console for detailed logs</li>
              <li>Check the terminal where the dev server is running for server-side logs</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
