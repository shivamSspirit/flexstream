import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('🧪 [TEST RPC METHODS] Testing available RPC methods');
  
  try {
    const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
    if (!rpcUrl) {
      return NextResponse.json({
        success: false,
        error: 'No RPC URL available'
      }, { status: 500 });
    }
    
    // Test basic RPC methods to see what's available
    const methods = [
      'getHealth',
      'getVersion', 
      'getAccountInfo',
      'getTokenAccountsByOwner',
      'getProgramAccounts'
    ];
    
    const results = [];
    
    for (const method of methods) {
      try {
        const response = await fetch(rpcUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 'test',
            method: method,
            params: method === 'getHealth' ? [] : 
                   method === 'getVersion' ? [] :
                   method === 'getAccountInfo' ? ['11111111111111111111111111111112'] :
                   method === 'getTokenAccountsByOwner' ? ['11111111111111111111111111111112', { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' }] :
                   method === 'getProgramAccounts' ? ['TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', { dataSize: 165 }] :
                   []
          }),
        });
        
        const data = await response.json();
        
        results.push({
          method,
          status: response.status,
          hasError: !!data.error,
          errorMessage: data.error?.message || null,
          hasResult: !!data.result
        });
        
      } catch (error) {
        results.push({
          method,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      rpcUrl: rpcUrl.replace(/api-key=[^&]+/, 'api-key=***'),
      results,
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('❌ [TEST RPC METHODS] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    }, { status: 500 });
  }
}
