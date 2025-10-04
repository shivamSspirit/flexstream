/**
 * Helius API utilities for fetching accurate token data
 * Optimized for performance and rate limiting
 */

// Helius API configuration
export const HELIUS_CONFIG = {
  API_BASE_URL: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://mainnet.helius-rpc.com',
  API_KEY: process.env.HELIUS_API_KEY,
  TIMEOUT: 5000, // 5 seconds (reduced for faster failures)
  RATE_LIMIT_DELAY: 2000, // 2 second delay between requests
  MAX_RETRIES: 1, // Only 1 retry to avoid long delays
  BATCH_SIZE: 1, // Process 1 token at a time to avoid rate limits
  MAX_CONCURRENT: 1, // Only 1 concurrent request
} as const;

// Rate limiting state
let lastRequestTime = 0;
let requestCount = 0;
let isProcessing = false;

/**
 * Rate limiting function to prevent API abuse
 */
async function rateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < HELIUS_CONFIG.RATE_LIMIT_DELAY) {
    const delay = HELIUS_CONFIG.RATE_LIMIT_DELAY - timeSinceLastRequest;
    console.log(`⏳ [HELIUS] Rate limiting: waiting ${delay}ms`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  lastRequestTime = Date.now();
  requestCount++;
}

/**
 * Get Helius RPC URL with API key
 */
function getHeliusRpcUrl(): string {
  const rpcUrl = HELIUS_CONFIG.API_BASE_URL;
  if (!rpcUrl) {
    console.warn('⚠️ [HELIUS] NEXT_PUBLIC_SOLANA_RPC_URL not found in environment variables');
    return '';
  }
  
  // Add API key if not already present
  if (HELIUS_CONFIG.API_KEY && !rpcUrl.includes('api-key=')) {
    const separator = rpcUrl.includes('?') ? '&' : '?';
    return `${rpcUrl}${separator}api-key=${HELIUS_CONFIG.API_KEY}`;
  }
  
  return rpcUrl;
}

/**
 * Fetch token holder count using Helius RPC getProgramAccounts
 * Optimized for single token requests to avoid rate limits
 */
export async function fetchTokenHolderCount(mintAddress: string, retryCount = 0): Promise<number> {
  console.log(`🔍 [HELIUS] Fetching holder count for: ${mintAddress} (attempt ${retryCount + 1})`);
  
  try {
    // Apply rate limiting
    await rateLimit();
    
    const rpcUrl = getHeliusRpcUrl();
    if (!rpcUrl) {
      console.log('⚠️ [HELIUS] No RPC URL available, skipping holder count fetch');
      return 0;
    }
    
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'FlexStream/1.0',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: `helius-holder-count-${Date.now()}`,
        method: 'getProgramAccounts',
        params: [
          'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', // Token Program ID
          {
            dataSlice: { offset: 64, length: 8 }, // Only get balance bytes (64-72)
            filters: [
              { dataSize: 165 }, // Filter to token account size
              { memcmp: { offset: 0, bytes: mintAddress } } // Filter by mint address
            ]
          }
        ]
      }),
      signal: AbortSignal.timeout(HELIUS_CONFIG.TIMEOUT),
    });

    if (!response.ok) {
      if (response.status === 429) {
        if (retryCount < HELIUS_CONFIG.MAX_RETRIES) {
          const delay = 5000; // 5 second delay for rate limit
          console.log(`⏳ [HELIUS] Rate limited, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchTokenHolderCount(mintAddress, retryCount + 1);
        }
      }
      throw new Error(`Helius API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Handle JSON-RPC response format
    const accounts = data.result || [];
    
    if (!Array.isArray(accounts)) {
      console.log('⚠️ [HELIUS] Invalid response format:', data);
      return 0;
    }
    
    // Filter out zero balance accounts
    // Zero balance accounts have data: "11111111" (8 zero bytes in base64)
    const nonZeroAccounts = accounts.filter((account: any) => {
      if (!account.account?.data) return false;
      
      // Check if the data is NOT the zero balance pattern
      return account.account.data !== "11111111";
    });
    
    const holderCount = nonZeroAccounts.length;
    
    console.log('✅ [HELIUS] Holder count fetched:', {
      mint: mintAddress,
      totalAccounts: accounts.length,
      holdersWithBalance: holderCount
    });
    
    return holderCount;
  } catch (error) {
    console.error('❌ [HELIUS] Error fetching holder count:', error);
    
    // Retry on network errors (but not on rate limits)
    if (retryCount < HELIUS_CONFIG.MAX_RETRIES && error instanceof Error && 
        (error.message.includes('fetch') || error.message.includes('network') || error.name === 'TimeoutError')) {
      const delay = 2000; // 2 second delay for network errors
      console.log(`🔄 [HELIUS] Network error or timeout, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchTokenHolderCount(mintAddress, retryCount + 1);
    }
    return 0;
  }
}

/**
 * Fetches holder counts for multiple token mint addresses using Helius API.
 * Processes tokens sequentially to avoid rate limits.
 */
export async function fetchMultipleTokenHolderCounts(mintAddresses: string[]): Promise<Map<string, number>> {
  console.log(`🔍 [HELIUS] Fetching holder counts for ${mintAddresses.length} tokens (sequential processing)`);
  const results = new Map<string, number>();
  
  // Process tokens sequentially to avoid rate limits
  for (let i = 0; i < mintAddresses.length; i++) {
    const mint = mintAddresses[i];
    console.log(`🔍 [HELIUS] Processing token ${i + 1}/${mintAddresses.length}: ${mint}`);
    
    try {
      const count = await fetchTokenHolderCount(mint);
      if (count !== null && count !== undefined) {
        results.set(mint, count);
      }
    } catch (error) {
      console.error(`❌ [HELIUS] Error processing token ${mint}:`, error);
      // Continue with next token instead of failing completely
    }
    
    // Add delay between tokens to respect rate limits
    if (i < mintAddresses.length - 1) {
      console.log(`⏳ [HELIUS] Waiting ${HELIUS_CONFIG.RATE_LIMIT_DELAY}ms before next token...`);
      await new Promise(resolve => setTimeout(resolve, HELIUS_CONFIG.RATE_LIMIT_DELAY));
    }
  }
  
  console.log(`✅ [HELIUS] Fetched holder counts for ${results.size} tokens.`);
  return results;
}

/**
 * Quick test function to verify Helius connection
 */
export async function testHeliusConnection(): Promise<boolean> {
  try {
    console.log('🧪 [HELIUS] Testing connection...');
    const testMint = 'So11111111111111111111111111111111111111112'; // SOL mint
    const count = await fetchTokenHolderCount(testMint);
    console.log('✅ [HELIUS] Connection test successful, SOL holders:', count);
    return count > 0;
  } catch (error) {
    console.error('❌ [HELIUS] Connection test failed:', error);
    return false;
  }
}