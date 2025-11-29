import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';

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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const mints = searchParams.get('mints');

    if (!mints) {
      return NextResponse.json(
        { error: 'Missing required parameter: mints (comma-separated token addresses)' },
        { status: 400 }
      );
    }

    // Validate mint addresses
    const mintArray = mints.split(',').map(m => m.trim());

    if (mintArray.length === 0 || mintArray.length > 10) {
      return NextResponse.json(
        { error: 'Must provide 1-10 token addresses' },
        { status: 400 }
      );
    }

    // Validate each mint
    try {
      mintArray.forEach(mint => new PublicKey(mint));
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token address format' },
        { status: 400 }
      );
    }

    // Wait for rate limit (1 RPS on free tier)
    await waitForRateLimit();

    // Fetch shield data from Jupiter
    const response = await fetch(
      `${JUPITER_API_URL}/shield?mints=${mintArray.join(',')}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // No API key needed for free tier
        }
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Jupiter shield API error:', error);

      return NextResponse.json(
        {
          error: 'Failed to check token risks',
          details: error,
          status: response.status
        },
        { status: response.status }
      );
    }

    const shieldData = await response.json();

    // Add risk summary for easier frontend consumption
    const result = {
      ...shieldData,
      summary: {
        totalTokens: mintArray.length,
        hasWarnings: Object.values(shieldData).some((token: any) =>
          token.warnings && token.warnings.length > 0
        ),
        hasErrors: Object.values(shieldData).some((token: any) =>
          token.errors && token.errors.length > 0
        )
      }
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Shield endpoint error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST method for checking multiple tokens with metadata
export async function POST(req: NextRequest) {
  try {
    const { mints } = await req.json();

    if (!Array.isArray(mints) || mints.length === 0) {
      return NextResponse.json(
        { error: 'Must provide an array of token addresses' },
        { status: 400 }
      );
    }

    if (mints.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 tokens per request' },
        { status: 400 }
      );
    }

    // Forward to GET handler
    const mintsString = mints.join(',');
    const url = new URL(req.url);
    url.searchParams.set('mints', mintsString);

    return GET(
      new NextRequest(url.toString(), {
        method: 'GET',
        headers: req.headers
      })
    );

  } catch (error) {
    console.error('Shield POST endpoint error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
