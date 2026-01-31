import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Cache tip floor for 30 seconds to reduce API calls
let cachedTipFloor: {
  tipFloor: number;
  tipHigh: number;
  tipUrgent: number;
  timestamp: number;
} | null = null;

const CACHE_TTL_MS = 30000; // 30 seconds

/**
 * GET /api/swap/tip-floor
 *
 * Fetches the current Jito tip floor from the Block Engine API
 * Returns percentile-based tip amounts for different priority levels
 */
export async function GET() {
  console.log('[TIP FLOOR] Fetching Jito tip floor');

  try {
    // Check cache
    if (cachedTipFloor && Date.now() - cachedTipFloor.timestamp < CACHE_TTL_MS) {
      console.log('[TIP FLOOR] Returning cached tip floor');
      return NextResponse.json({
        success: true,
        data: cachedTipFloor,
        cached: true,
      });
    }

    // Fetch from Jito Block Engine
    const jitoUrl = process.env.JITO_TIP_FLOOR_URL ||
      'https://mainnet.block-engine.jito.wtf/api/v1/bundles/tip_floor';

    const response = await fetch(jitoUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // 5 second timeout
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`Jito API returned ${response.status}`);
    }

    const data = await response.json();

    // Jito returns array: [{ "percentile_25": x, "percentile_50": x, ... }]
    const tipData = Array.isArray(data) ? data[0] : data;

    // Extract tip amounts (in lamports)
    // Use percentile_50 for normal, percentile_75 for high, percentile_95 for urgent
    const tipFloor = {
      tipFloor: tipData.landed_tips_50th_percentile || tipData.percentile_50 || 10000, // 0.00001 SOL default
      tipHigh: tipData.landed_tips_75th_percentile || tipData.percentile_75 || 25000,
      tipUrgent: tipData.landed_tips_95th_percentile || tipData.percentile_95 || 50000,
      timestamp: Date.now(),
    };

    // Update cache
    cachedTipFloor = tipFloor;

    console.log('[TIP FLOOR] Tip floor fetched:', {
      normal: (tipFloor.tipFloor / 1e9).toFixed(9) + ' SOL',
      high: (tipFloor.tipHigh / 1e9).toFixed(9) + ' SOL',
      urgent: (tipFloor.tipUrgent / 1e9).toFixed(9) + ' SOL',
    });

    return NextResponse.json({
      success: true,
      data: tipFloor,
      cached: false,
    });

  } catch (error) {
    console.error('[TIP FLOOR] Error fetching tip floor:', error);

    // Return default values if Jito API fails
    const defaultTips = {
      tipFloor: 10000,   // 0.00001 SOL
      tipHigh: 25000,    // 0.000025 SOL
      tipUrgent: 50000,  // 0.00005 SOL
      timestamp: Date.now(),
    };

    return NextResponse.json({
      success: true,
      data: defaultTips,
      cached: false,
      fallback: true,
      warning: 'Using default tip values - Jito API unavailable',
    });
  }
}
