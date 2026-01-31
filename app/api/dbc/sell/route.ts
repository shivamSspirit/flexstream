import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { createDBCClient } from '@/lib/meteora-dbc';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { poolAddress, sellerWallet, tokenAmount, slippageBps = 500 } = body;

    if (!poolAddress || !sellerWallet || !tokenAmount) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const connection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
      'confirmed'
    );

    const dbcClient = createDBCClient(connection);
    const poolPubkey = new PublicKey(poolAddress);
    const sellerPubkey = new PublicKey(sellerWallet);

    // Create sell transaction
    const transaction = await dbcClient.createSellTransaction(
      poolPubkey,
      sellerPubkey,
      tokenAmount,
      slippageBps
    );

    // Set blockhash BEFORE serialization (required for Transaction.serialize)
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    transaction.feePayer = sellerPubkey;

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
    });
  } catch (error) {
    console.error('[API] Sell Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create sell transaction',
      },
      { status: 500 }
    );
  }
}
