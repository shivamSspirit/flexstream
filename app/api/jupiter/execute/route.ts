import { NextRequest, NextResponse } from 'next/server';

// Jupiter Ultra API endpoint
const JUPITER_API_URL = 'https://lite-api.jup.ag/ultra/v1';

// Rate limiting helper for free tier (1 RPS)
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second for free tier

async function waitForRateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  lastRequestTime = Date.now();
}

export async function POST(req: NextRequest) {
  try {
    const { signedTransaction, requestId } = await req.json();

    // Validate inputs
    if (!signedTransaction) {
      return NextResponse.json(
        { error: 'Missing required parameter: signedTransaction' },
        { status: 400 }
      );
    }

    if (!requestId) {
      return NextResponse.json(
        { error: 'Missing required parameter: requestId' },
        { status: 400 }
      );
    }

    // Validate base64 format
    try {
      Buffer.from(signedTransaction, 'base64');
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid signedTransaction: must be base64 encoded' },
        { status: 400 }
      );
    }

    // Wait for rate limit (1 RPS on free tier)
    await waitForRateLimit();

    // Execute on Jupiter
    const response = await fetch(`${JUPITER_API_URL}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // No API key needed for free tier
      },
      body: JSON.stringify({
        signedTransaction,
        requestId
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Jupiter execute error:', error);

      let errorDetails;
      try {
        errorDetails = JSON.parse(error);
      } catch {
        errorDetails = { message: error };
      }

      // Handle common error codes
      if (errorDetails.code === 1) {
        return NextResponse.json(
          {
            error: 'Insufficient funds',
            code: 1,
            message: 'Not enough tokens to complete the swap',
            details: errorDetails
          },
          { status: 400 }
        );
      }

      if (errorDetails.code === 2) {
        return NextResponse.json(
          {
            error: 'Insufficient SOL for gas',
            code: 2,
            message: 'You need at least 0.01 SOL for transaction fees',
            suggestion: 'Try using gasless mode or add more SOL to your wallet',
            details: errorDetails
          },
          { status: 400 }
        );
      }

      if (errorDetails.code === 3) {
        return NextResponse.json(
          {
            error: 'Below minimum for gasless',
            code: 3,
            message: 'Trade size is below minimum for gasless transactions (~$10)',
            suggestion: 'Increase trade amount or add SOL to your wallet',
            details: errorDetails
          },
          { status: 400 }
        );
      }

      if (errorDetails.code === 6001) {
        return NextResponse.json(
          {
            error: 'Slippage exceeded',
            code: 6001,
            message: 'Price moved beyond acceptable slippage tolerance',
            suggestion: 'Try again or increase slippage tolerance',
            details: errorDetails
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          error: 'Failed to execute swap',
          details: errorDetails,
          status: response.status
        },
        { status: response.status }
      );
    }

    const result = await response.json();

    // Check if execution was successful
    if (result.status === 'success') {
      // TODO: Store swap record in database for fee tracking
      // await storeSwapRecord({
      //   signature: result.signature,
      //   requestId,
      //   inAmount: result.inAmount,
      //   outAmount: result.outAmount,
      //   timestamp: Date.now()
      // });

      return NextResponse.json({
        status: 'success',
        signature: result.signature,
        explorerUrl: `https://solscan.io/tx/${result.signature}`,
        message: 'Swap completed successfully',
        details: result
      });
    }

    // Handle pending or processing status
    if (result.status === 'processing') {
      return NextResponse.json({
        status: 'processing',
        requestId,
        message: 'Transaction is being processed',
        details: result
      });
    }

    // Handle failure
    return NextResponse.json(
      {
        status: 'failed',
        error: result.error || 'Swap execution failed',
        details: result
      },
      { status: 400 }
    );

  } catch (error) {
    console.error('Execute endpoint error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
