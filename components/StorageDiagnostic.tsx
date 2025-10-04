'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

export default function StorageDiagnostic() {
  const [diagnostic, setDiagnostic] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostic = async () => {
    setIsRunning(true);
    setDiagnostic('Running diagnostic...\n');

    try {
      // Test 1: Supabase connection
      setDiagnostic(prev => prev + '1. Testing Supabase connection...\n');
      const { data: testData, error: testError } = await supabase.from('users').select('id').limit(1);
      if (testError) {
        setDiagnostic(prev => prev + `❌ Connection failed: ${testError.message}\n`);
        return;
      }
      setDiagnostic(prev => prev + '✅ Supabase connection successful\n');

      // Test 2: List buckets
      setDiagnostic(prev => prev + '2. Listing storage buckets...\n');
      setDiagnostic(prev => prev + `   Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}\n`);
      setDiagnostic(prev => prev + `   Supabase Key: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'}\n`);
      
      // Try multiple methods to list buckets
      setDiagnostic(prev => prev + '   Trying listBuckets()...\n');
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      
      if (bucketError) {
        setDiagnostic(prev => prev + `❌ Failed to list buckets: ${bucketError.message}\n`);
        setDiagnostic(prev => prev + `   Error details: ${JSON.stringify(bucketError)}\n`);
        
        // Try alternative method - list files from flexstream bucket directly
        setDiagnostic(prev => prev + '   Trying direct bucket access...\n');
        const { data: files, error: fileError } = await supabase.storage
          .from('flexstream')
          .list('', { limit: 1 });
        
        if (fileError) {
          setDiagnostic(prev => prev + `❌ Direct bucket access failed: ${fileError.message}\n`);
        } else {
          setDiagnostic(prev => prev + `✅ Direct bucket access successful - bucket exists!\n`);
          setDiagnostic(prev => prev + `   Files in bucket: ${files?.length || 0}\n`);
        }
        return;
      }
      
      setDiagnostic(prev => prev + `✅ Found ${buckets?.length || 0} buckets:\n`);
      buckets?.forEach(bucket => {
        setDiagnostic(prev => prev + `   - ${bucket.id} (public: ${bucket.public})\n`);
      });

      // Test 3: Check for flexstream bucket using direct access
      setDiagnostic(prev => prev + '3. Checking for flexstream bucket...\n');
      setDiagnostic(prev => prev + '   Using direct bucket access method...\n');
      
      const { data: files, error: fileError } = await supabase.storage
        .from('flexstream')
        .list('', { limit: 1 });
      
      if (fileError) {
        setDiagnostic(prev => prev + `❌ flexstream bucket not accessible: ${fileError.message}\n`);
        setDiagnostic(prev => prev + 'ℹ️  Make sure the bucket exists and is public in Supabase Dashboard\n');
        return;
      } else {
        setDiagnostic(prev => prev + `✅ flexstream bucket found and accessible\n`);
        setDiagnostic(prev => prev + `   Files in bucket: ${files?.length || 0}\n`);
      }

      // Test 5: Test file upload (small test image file)
      setDiagnostic(prev => prev + '5. Testing file upload...\n');
      
      // Create a small test image file (1x1 pixel PNG)
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 1, 1);
      }
      
      // Convert canvas to blob and test upload
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create test image'));
        }, 'image/png');
      });
      
      const testFile = new File([blob], 'test.png', { type: 'image/png' });
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('flexstream')
        .upload(`test/${Date.now()}-test.png`, testFile);
      
      if (uploadError) {
        setDiagnostic(prev => prev + `❌ Upload test failed: ${uploadError.message}\n`);
      } else {
        setDiagnostic(prev => prev + '✅ Upload test successful\n');
        
        // Clean up test file
        await supabase.storage.from('flexstream').remove([uploadData.path]);
        setDiagnostic(prev => prev + '✅ Test file cleaned up\n');
      }

    } catch (error) {
      setDiagnostic(prev => prev + `❌ Diagnostic failed: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    }

    setIsRunning(false);
  };

  return (
    <div className="p-4 border border-white/20 rounded-lg bg-black/20 backdrop-blur-md">
      <h3 className="text-lg font-semibold mb-2 text-white">Storage Diagnostic</h3>
      <div className="flex space-x-2 mb-4">
        <Button 
          onClick={runDiagnostic} 
          disabled={isRunning}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {isRunning ? 'Running...' : 'Run Diagnostic'}
        </Button>
        <Button 
          onClick={() => window.location.reload()} 
          disabled={isRunning}
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10"
        >
          Refresh Page
        </Button>
      </div>
      <pre className="text-sm bg-black/40 text-green-400 p-3 rounded border border-white/10 overflow-auto max-h-96 font-mono">
        {diagnostic || 'Click "Run Diagnostic" to test your storage configuration'}
      </pre>
    </div>
  );
}
