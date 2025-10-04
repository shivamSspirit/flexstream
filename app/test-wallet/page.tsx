'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useWallet } from '@solana/wallet-adapter-react';
import { SolanaConnectButton } from '@/components/solana/SolanaProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function TestWalletPage() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { connected, publicKey } = useWallet();
  const [testResult, setTestResult] = useState<string>('');

  const handleCheckWallet = () => {
    if (connected && publicKey) {
      setTestResult(JSON.stringify({ 
        connected: true,
        address: publicKey.toBase58()
      }, null, 2));
    } else {
      setTestResult('Wallet not connected');
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Please sign in to test wallet connection</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Wallet Connection Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* User Info */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">User Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-gray-300">
                <p><strong>User ID:</strong> {userId}</p>
                <p><strong>Signed In:</strong> {isSignedIn ? 'Yes' : 'No'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Wallet Status */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Wallet Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {connected ? (
                  <div className="flex items-center space-x-2 text-green-400">
                    <CheckCircleIcon className="w-5 h-5" />
                    <span>Wallet connected</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-gray-400">
                    <ExclamationTriangleIcon className="w-5 h-5" />
                    <span>No wallet connected</span>
                  </div>
                )}
                
                {publicKey && (
                  <div className="mt-4 p-3 bg-gray-700 rounded text-xs font-mono text-gray-300">
                    {publicKey.toBase58()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <Card className="bg-gray-800 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Test Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <SolanaConnectButton />
                <Button 
                  onClick={handleCheckWallet}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Check Wallet
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        {testResult && (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="p-4 bg-gray-900 rounded text-xs text-gray-300 overflow-x-auto">
                {testResult}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
