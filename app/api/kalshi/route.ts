import { NextRequest, NextResponse } from 'next/server';

const KALSHI_API_BASE = 'https://api.elections.kalshi.com/trade-api/v2';

/**
 * API Route to proxy Kalshi requests
 * This avoids CORS issues when fetching from the client
 *
 * Usage: /api/kalshi?endpoint=/markets&status=open&limit=20
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const endpoint = searchParams.get('endpoint');

    if (!endpoint) {
      return NextResponse.json(
        { success: false, error: 'Missing endpoint parameter' },
        { status: 400 }
      );
    }

    // Build the Kalshi URL with remaining params
    const kalshiParams = new URLSearchParams();
    searchParams.forEach((value, key) => {
      if (key !== 'endpoint') {
        kalshiParams.set(key, value);
      }
    });

    const kalshiUrl = `${KALSHI_API_BASE}${endpoint}${kalshiParams.toString() ? `?${kalshiParams.toString()}` : ''}`;

    const response = await fetch(kalshiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FlexStream/1.0',
      },
      next: { revalidate: 30 }, // Cache for 30 seconds
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Kalshi API error:', response.status, errorText);
      return NextResponse.json(
        { success: false, error: `Kalshi API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Kalshi proxy error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch from Kalshi' },
      { status: 500 }
    );
  }
}
