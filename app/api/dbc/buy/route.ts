import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { createDBCClient } from '@/lib/meteora-dbc';
import { withRateLimit, rateLimitedResponse, rateLimitHeaders } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { poolAddress, buyerWallet, solAmount, slippageBps = 500 } = body;

    if (!poolAddress || !buyerWallet || !solAmount) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Rate limit check (10 trades per minute per wallet)
    const rateLimit = await withRateLimit(request, 'trading', buyerWallet);
    if (!rateLimit.success) {
      return rateLimitedResponse(rateLimit);
    }

    const connection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
      'confirmed'
    );

    const dbcClient = createDBCClient(connection);
    const poolPubkey = new PublicKey(poolAddress);
    const buyerPubkey = new PublicKey(buyerWallet);

    // Create buy transaction
    const transaction = await dbcClient.createBuyTransaction(
      poolPubkey,
      buyerPubkey,
      solAmount,
      slippageBps
    );

    // Set blockhash BEFORE serialization (required for Transaction.serialize)
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    transaction.feePayer = buyerPubkey;

    // Serialize transaction
    const serializedTx = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });

    return NextResponse.json({
      success: true,
      data: {
        transaction: Buffer.from(serializedTx).toString('base64'),
        blockhash,
        lastValidBlockHeight,
      },
    }, {
      headers: rateLimitHeaders(rateLimit),
    });
  } catch (error) {
    console.error('[API] Buy Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create buy transaction',
      },
      { status: 500 }
    );
  }
}
