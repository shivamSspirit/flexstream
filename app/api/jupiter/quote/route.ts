import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';

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
    const { inputMint, outputMint, amount, taker } = await req.json();

    // Validate inputs
    if (!inputMint || !outputMint || !amount || !taker) {
      return NextResponse.json(
        { error: 'Missing required parameters: inputMint, outputMint, amount, taker' },
        { status: 400 }
      );
    }

    // Validate public keys
    try {
      new PublicKey(inputMint);
      new PublicKey(outputMint);
      new PublicKey(taker);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid public key format' },
        { status: 400 }
      );
    }

    // Validate amount
    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount: must be a positive number' },
        { status: 400 }
      );
    }

    // Check if user qualifies for gasless (< 0.01 SOL)
    const connection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
    );

    let useGasless = false;
    try {
      const balance = await connection.getBalance(new PublicKey(taker));
      // Use gasless if balance < 0.01 SOL and amount > $10 equivalent (assuming ~0.1 SOL = $10)
      useGasless = balance < 0.01 * 1e9 && amountNum > 0.1 * 1e9;
    } catch (error) {
      console.warn('Failed to check balance for gasless eligibility:', error);
    }

    // Build query parameters
    const params = new URLSearchParams({
      inputMint,
      outputMint,
      amount: Math.floor(amountNum).toString(),
      taker
    });

    // Add referral fees if not using gasless
    // Note: On free tier, you can still collect fees when user has enough SOL
    if (!useGasless && process.env.JUPITER_REFERRAL_ACCOUNT) {
      params.append('referralAccount', process.env.JUPITER_REFERRAL_ACCOUNT);
      params.append('referralFee', process.env.JUPITER_REFERRAL_FEE_BPS || '100'); // Default 1%
    }

    // Wait for rate limit (1 RPS on free tier)
    await waitForRateLimit();

    // Fetch quote from Jupiter
    const response = await fetch(`${JUPITER_API_URL}/order?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // No API key needed for free tier
      }
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Jupiter API error:', error);

      return NextResponse.json(
        {
          error: 'Failed to get quote from Jupiter',
          details: error,
          status: response.status
        },
        { status: response.status }
      );
    }

    const quote = await response.json();

    // Add metadata about gasless mode
    const result = {
      ...quote,
      isGasless: useGasless,
      rateLimit: {
        tier: 'free',
        rps: 1,
        note: 'Upgrade to paid tier for higher limits'
      }
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Quote endpoint error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET method for simple queries (optional)
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const inputMint = searchParams.get('inputMint');
  const outputMint = searchParams.get('outputMint');
  const amount = searchParams.get('amount');
  const taker = searchParams.get('taker');

  if (!inputMint || !outputMint || !amount || !taker) {
    return NextResponse.json(
      { error: 'Missing required query parameters' },
      { status: 400 }
    );
  }

  // Forward to POST handler
  return POST(
    new NextRequest(req.url, {
      method: 'POST',
      headers: req.headers,
      body: JSON.stringify({ inputMint, outputMint, amount, taker })
    })
  );
}
