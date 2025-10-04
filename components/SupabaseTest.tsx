'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

export default function SupabaseTest() {
  const [result, setResult] = useState<string>('');

  const testSupabase = async () => {
    setResult('Testing Supabase connection...\n');
    
    try {
      // Test 1: Basic connection
      setResult(prev => prev + '1. Testing basic connection...\n');
      const { data: testData, error: testError } = await supabase.from('users').select('id').limit(1);
      if (testError) {
        setResult(prev => prev + `❌ Basic connection failed: ${testError.message}\n`);
        return;
      }
      setResult(prev => prev + '✅ Basic connection successful\n');

      // Test 2: Environment variables
      setResult(prev => prev + '2. Checking environment variables...\n');
      setResult(prev => prev + `   URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}\n`);
      setResult(prev => prev + `   Key: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'}\n`);

      // Test 3: Storage API
      setResult(prev => prev + '3. Testing storage API...\n');
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      if (bucketError) {
        setResult(prev => prev + `❌ Storage API failed: ${bucketError.message}\n`);
        setResult(prev => prev + `   Error details: ${JSON.stringify(bucketError)}\n`);
      } else {
        setResult(prev => prev + `✅ Storage API successful\n`);
        setResult(prev => prev + `   Found ${buckets?.length || 0} buckets\n`);
        buckets?.forEach(bucket => {
          setResult(prev => prev + `   - ${bucket.id} (public: ${bucket.public})\n`);
        });
      }

      // Test 4: Direct bucket access
      setResult(prev => prev + '4. Testing direct bucket access...\n');
      const { data: files, error: fileError } = await supabase.storage
        .from('flexstream')
        .list('', { limit: 1 });
      
      if (fileError) {
        setResult(prev => prev + `❌ Direct bucket access failed: ${fileError.message}\n`);
      } else {
        setResult(prev => prev + `✅ Direct bucket access successful\n`);
        setResult(prev => prev + `   Bucket 'flexstream' exists and is accessible\n`);
      }

    } catch (error) {
      setResult(prev => prev + `❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    }
  };

  return (
    <div className="p-4 border border-white/20 rounded-lg bg-black/20 backdrop-blur-md">
      <h3 className="text-lg font-semibold mb-2 text-white">Supabase Connection Test</h3>
      <Button 
        onClick={testSupabase} 
        className="mb-4 bg-blue-600 hover:bg-blue-700 text-white"
      >
        Test Supabase Connection
      </Button>
      <pre className="text-sm bg-black/40 text-green-400 p-3 rounded border border-white/10 overflow-auto max-h-96 font-mono">
        {result || 'Click "Test Supabase Connection" to run diagnostics'}
      </pre>
    </div>
  );
}
