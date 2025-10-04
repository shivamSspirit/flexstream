'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LinkPreviewTest() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testLinkPreview = async () => {
    if (!url) return;
    
    setLoading(true);
    setResult(null);
    
    try {
      console.log('Testing link preview for:', url);
      const response = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);
      setResult(data);
    } catch (error) {
      console.error('Error:', error);
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border border-white/20 rounded-lg bg-black/20 backdrop-blur-md">
      <h3 className="text-lg font-semibold mb-2 text-white">Link Preview Test</h3>
      
      <div className="flex space-x-2 mb-4">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter URL to test (e.g., https://twitter.com/elonmusk)"
          className="bg-white/10 border-white/20 text-white placeholder-gray-400"
        />
        <Button 
          onClick={testLinkPreview} 
          disabled={loading || !url}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {loading ? 'Testing...' : 'Test'}
        </Button>
      </div>

      {result && (
        <div className="mt-4 p-4 bg-black/40 rounded border border-white/10">
          <h4 className="text-white font-medium mb-2">Result:</h4>
          <pre className="text-sm text-green-400 overflow-auto max-h-64 font-mono">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
