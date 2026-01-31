import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { createDBCClient } from '@/lib/meteora-dbc';
import { DBC_CONFIG } from '@/lib/dbc-config';

/**
 * GET /api/tokens/pool-info?poolAddress=...
 * Fetches pool information from the Meteora DBC SDK (server-side only)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const poolAddress = searchParams.get('poolAddress');

    if (!poolAddress) {
      return NextResponse.json(
        { success: false, error: 'Missing poolAddress parameter' },
        { status: 400 }
      );
    }

    // Validate the pool address
    let poolPubkey: PublicKey;
    try {
      poolPubkey = new PublicKey(poolAddress);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid pool address format' },
        { status: 400 }
      );
    }

    console.log('[API] Fetching pool info for:', poolAddress);

    // Create connection and DBC client
    const connection = new Connection(DBC_CONFIG.RPC_URL, 'confirmed');
    const dbcClient = createDBCClient(connection);

    // Fetch pool info
    const poolInfo = await dbcClient.getPoolInfo(poolPubkey);

    console.log('[API] Pool info fetched successfully:', {
      pool: poolAddress,
      buyPrice: poolInfo.buyPrice,
      liquidity: poolInfo.liquidity,
      marketCap: poolInfo.marketCap,
    });

    return NextResponse.json({
      success: true,
      poolInfo: {
        mint: poolInfo.mint.toBase58(),
        pool: poolInfo.pool.toBase58(),
        virtualBaseReserves: poolInfo.virtualBaseReserves,
        virtualQuoteReserves: poolInfo.virtualQuoteReserves,
        marketCap: poolInfo.marketCap,
        buyPrice: poolInfo.buyPrice,
        sellPrice: poolInfo.sellPrice,
        liquidity: poolInfo.liquidity,
      },
    });
  } catch (error) {
    console.error('[API] Error fetching pool info:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Check if pool doesn't exist
    if (errorMessage.includes('Pool not found') || errorMessage.includes('Account does not exist')) {
      return NextResponse.json(
        { success: false, error: 'Pool not found or not initialized', notFound: true },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
