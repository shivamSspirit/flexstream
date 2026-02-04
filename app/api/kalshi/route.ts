import { NextRequest, NextResponse } from 'next/server';

// Kalshi API endpoints (try main API first, fallback to elections)
const KALSHI_MAIN_API = 'https://api.kalshi.com/trade-api/v2';
const KALSHI_ELECTIONS_API = 'https://api.elections.kalshi.com/trade-api/v2';

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

    const paramString = kalshiParams.toString() ? `?${kalshiParams.toString()}` : '';

    // Try main Kalshi API first
    let response = await fetch(`${KALSHI_MAIN_API}${endpoint}${paramString}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Flexit/1.0',
      },
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    // If main API fails, try elections API
    if (!response.ok) {
      console.log('Main Kalshi API failed, trying elections API...');
      response = await fetch(`${KALSHI_ELECTIONS_API}${endpoint}${paramString}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Flexit/1.0',
        },
        next: { revalidate: 60 },
      });
    }

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
