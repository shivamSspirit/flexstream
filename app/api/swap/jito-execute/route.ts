import { NextRequest, NextResponse } from 'next/server';
import { Connection, VersionedTransaction, Transaction } from '@solana/web3.js';
import { EXECUTION_CONFIG, getCurrentRpcUrl } from '@/lib/execution/config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Jito Block Engine URLs
 */
const JITO_BLOCK_ENGINE_URL = process.env.JITO_BLOCK_ENGINE_URL ||
  'https://mainnet.block-engine.jito.wtf/api/v1';

/**
 * POST /api/swap/jito-execute
 *
 * Submits signed transactions as a Jito bundle
 * Requires both swap and tip transactions to be signed
 */
export async function POST(request: NextRequest) {
  console.log('[JITO EXECUTE] Starting bundle submission');

  try {
    const body = await request.json();

    const {
      signedSwapTransaction, // Base64 encoded signed swap transaction
      signedTipTransaction,  // Base64 encoded signed tip transaction
      isVersionedTransaction = false,
    } = body;

    // Validate required fields
    if (!signedSwapTransaction || !signedTipTransaction) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: signedSwapTransaction, signedTipTransaction',
      }, { status: 400 });
    }

    // Decode and prepare transactions for bundle
    const swapTxBuffer = Buffer.from(signedSwapTransaction, 'base64');
    const tipTxBuffer = Buffer.from(signedTipTransaction, 'base64');

    let swapTxSerialized: Uint8Array;
    let tipTxSerialized: Uint8Array;

    if (isVersionedTransaction) {
      // Versioned Transaction (Jupiter)
      const swapTx = VersionedTransaction.deserialize(swapTxBuffer);
      const tipTx = Transaction.from(tipTxBuffer); // Tip is always legacy

      swapTxSerialized = swapTx.serialize();
      tipTxSerialized = tipTx.serialize();
    } else {
      // Legacy Transaction (DBC)
      const swapTx = Transaction.from(swapTxBuffer);
      const tipTx = Transaction.from(tipTxBuffer);

      swapTxSerialized = swapTx.serialize();
      tipTxSerialized = tipTx.serialize();
    }

    // Convert to base58 for Jito API
    const bs58 = await import('bs58');
    const swapTxBase58 = bs58.default.encode(swapTxSerialized);
    const tipTxBase58 = bs58.default.encode(tipTxSerialized);

    console.log('[JITO EXECUTE] Submitting bundle:', {
      swapTxLength: swapTxSerialized.length,
      tipTxLength: tipTxSerialized.length,
      isVersioned: isVersionedTransaction,
    });

    // Submit bundle to Jito
    const bundleResponse = await fetch(`${JITO_BLOCK_ENGINE_URL}/bundles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'sendBundle',
        params: [
          [swapTxBase58, tipTxBase58], // Bundle: swap first, then tip
        ],
      }),
    });

    if (!bundleResponse.ok) {
      const errorText = await bundleResponse.text();
      console.error('[JITO EXECUTE] Bundle submission failed:', errorText);

      // Attempt fallback to direct RPC
      return await sendFallback(swapTxSerialized, isVersionedTransaction);
    }

    const bundleResult = await bundleResponse.json();

    if (bundleResult.error) {
      console.error('[JITO EXECUTE] Bundle error:', bundleResult.error);

      // Attempt fallback on Jito error
      return await sendFallback(swapTxSerialized, isVersionedTransaction);
    }

    const bundleId = bundleResult.result;

    console.log('[JITO EXECUTE] Bundle submitted:', bundleId);

    // Poll for bundle status
    const status = await waitForBundleStatus(bundleId);

    if (status.status === 'LANDED') {
      console.log('[JITO EXECUTE] Bundle landed successfully');

      return NextResponse.json({
        success: true,
        data: {
          bundleId,
          status: 'LANDED',
          signature: status.signature,
          explorerUrl: status.signature
            ? `https://solscan.io/tx/${status.signature}`
            : null,
          method: 'JITO_BUNDLE',
        },
      });
    }

    // Bundle failed or timed out - try fallback
    console.log('[JITO EXECUTE] Bundle did not land, trying fallback');
    return await sendFallback(swapTxSerialized, isVersionedTransaction);

  } catch (error) {
    console.error('[JITO EXECUTE] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: 500 });
  }
}

/**
 * Wait for bundle to land
 */
async function waitForBundleStatus(
  bundleId: string,
  timeoutMs: number = 30000
): Promise<{ status: string; signature?: string }> {
  const startTime = Date.now();
  const pollInterval = 1000; // 1 second

  while (Date.now() - startTime < timeoutMs) {
    try {
      // Check bundle status via Jito API
      const statusResponse = await fetch(`${JITO_BLOCK_ENGINE_URL}/bundles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getBundleStatuses',
          params: [[bundleId]],
        }),
      });

      if (statusResponse.ok) {
        const statusResult = await statusResponse.json();

        if (statusResult.result?.value?.[0]) {
          const bundleStatus = statusResult.result.value[0];

          if (bundleStatus.confirmation_status === 'confirmed' ||
              bundleStatus.confirmation_status === 'finalized') {
            return {
              status: 'LANDED',
              signature: bundleStatus.transactions?.[0],
            };
          }

          if (bundleStatus.err) {
            return {
              status: 'FAILED',
            };
          }
        }
      }

      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, pollInterval));

    } catch (error) {
      console.error('[JITO EXECUTE] Error polling bundle status:', error);
    }
  }

  return { status: 'TIMEOUT' };
}

/**
 * Fallback: Send transaction directly via RPC
 */
async function sendFallback(
  serializedTransaction: Uint8Array,
  isVersionedTransaction: boolean
): Promise<NextResponse> {
  console.log('[JITO EXECUTE] Using fallback RPC');

  try {
    const connection = new Connection(getCurrentRpcUrl(), EXECUTION_CONFIG.rpc.commitment);

    const signature = await connection.sendRawTransaction(serializedTransaction, {
      skipPreflight: false,
      preflightCommitment: EXECUTION_CONFIG.rpc.commitment,
      maxRetries: 3,
    });

    console.log('[JITO EXECUTE] Fallback transaction sent:', signature);

    // Wait for confirmation
    const confirmation = await connection.confirmTransaction(
      {
        signature,
        blockhash: (await connection.getLatestBlockhash()).blockhash,
        lastValidBlockHeight: (await connection.getLatestBlockhash()).lastValidBlockHeight,
      },
      EXECUTION_CONFIG.rpc.commitment
    );

    if (confirmation.value.err) {
      return NextResponse.json({
        success: false,
        error: `Transaction failed: ${JSON.stringify(confirmation.value.err)}`,
        method: 'FALLBACK_RPC',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        bundleId: null,
        status: 'LANDED',
        signature,
        explorerUrl: `https://solscan.io/tx/${signature}`,
        method: 'FALLBACK_RPC',
      },
    });

  } catch (error) {
    console.error('[JITO EXECUTE] Fallback failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json({
      success: false,
      error: `Both Jito and fallback failed: ${errorMessage}`,
      method: 'FALLBACK_RPC',
    }, { status: 500 });
  }
}
