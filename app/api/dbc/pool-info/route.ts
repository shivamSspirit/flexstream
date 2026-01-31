import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { createDBCClient } from '@/lib/meteora-dbc';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const poolAddress = searchParams.get('pool');

    if (!poolAddress) {
      return NextResponse.json(
        { success: false, error: 'Pool address is required' },
        { status: 400 }
      );
    }

    const connection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
      'confirmed'
    );

    const dbcClient = createDBCClient(connection);
    const poolPubkey = new PublicKey(poolAddress);

    // Fetch pool info
    const poolInfo = await dbcClient.getPoolInfo(poolPubkey);

    return NextResponse.json({
      success: true,
      data: {
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
    console.error('[API] Pool Info Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch pool info',
      },
      { status: 500 }
    );
  }
}
