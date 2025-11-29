'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestWalletSimplePage() {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleBasicTest = () => {
    console.log('🔘 [Page] Basic test button clicked');
    console.log("CLicked thsi button");
    setTestResult('Basic test successful! Page is working.');
  };

  const handleSimpleTest = async () => {
    console.log('🔘 [Page] Simple test button clicked');
    console.log("CLicked thsi button");
    setIsLoading(true);
    setTestResult('Testing simple wallet generation...');
    
    try {
      console.log('🌐 [Page] Making API call to /api/test-wallet-no-auth');
      const response = await fetch('/api/test-wallet-no-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('📡 [Page] Response received:', response.status, response.statusText);
      const result = await response.json();
      console.log('📄 [Page] Response data:', result);
      
      setTestResult(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('❌ [Page] Error in simple test:', error);
      setTestResult(`Simple test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
      console.log('✅ [Page] Simple test completed');
    }
  };

  const handleDebugDB = async () => {
    console.log('🔘 [Page] Debug DB button clicked');
    console.log("CLicked thsi button");
    setIsLoading(true);
    setTestResult('Debugging database...');
    
    try {
      console.log('🌐 [Page] Making API call to /api/test-db-no-auth');
      const response = await fetch('/api/test-db-no-auth');
      console.log('📡 [Page] Response received:', response.status, response.statusText);
      
      const result = await response.json();
      console.log('📄 [Page] Response data:', result);
      
      setTestResult(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('❌ [Page] Error in debug DB:', error);
      setTestResult(`Debug error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
      console.log('✅ [Page] Debug DB completed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Simple Wallet Test (No Auth)</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Test Actions */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Test Actions</CardTitle>
              <CardDescription className="text-gray-400">
                Test wallet generation without authentication
              </CardDescription>
            </CardHeader>
            <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={handleBasicTest}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Basic Test
              </Button>
              
              <Button 
                onClick={handleSimpleTest}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? 'Testing...' : 'Simple Test'}
              </Button>
              
              <Button 
                onClick={handleDebugDB}
                disabled={isLoading}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {isLoading ? 'Debugging...' : 'Debug DB'}
              </Button>
            </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-gray-300">
                <p><strong>Page:</strong> Simple Test (No Auth Required)</p>
                <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
                <p><strong>Result:</strong> {testResult ? 'Available' : 'None'}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Test Results */}
        {testResult && (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-900 p-4 rounded text-green-400 text-sm overflow-auto max-h-96">
                {testResult}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="bg-gray-800 border-gray-700 mt-6">
          <CardHeader>
            <CardTitle className="text-white">Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-gray-300 space-y-2">
              <p>1. Click "Basic Test" to verify the page is working</p>
              <p>2. Click "Simple Test" to test wallet generation without authentication</p>
              <p>3. Click "Debug DB" to check database state</p>
              <p>4. Check the results below for any errors</p>
              <p>5. Open browser console (F12) to see debug logs</p>
              <p>6. If this works, the issue is with Clerk authentication</p>
              <p>7. If this fails, the issue is with the API endpoints or database</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
