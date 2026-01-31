import { NextRequest, NextResponse } from 'next/server';
import { createLeaderboardService } from '@/lib/services/leaderboard-service';

/**
 * POST /api/leaderboard/calculate
 * Trigger leaderboard metrics calculation
 * Can be called by cron job or manually
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication for this endpoint
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Leaderboard Calculate] Starting calculation job...');

    const body = await request.json().catch(() => ({}));
    const { walletAddress } = body;

    const leaderboardService = createLeaderboardService();

    if (walletAddress) {
      // Calculate for specific user
      console.log('[Leaderboard Calculate] Calculating for user:', walletAddress);
      await leaderboardService.calculateTraderMetrics(walletAddress);
    } else {
      // Calculate for all traders
      console.log('[Leaderboard Calculate] Calculating for all traders...');
      await leaderboardService.calculateAllTraderMetrics();
    }

    console.log('[Leaderboard Calculate] Calculation completed successfully');

    return NextResponse.json({
      success: true,
      message: walletAddress
        ? `Metrics calculated for ${walletAddress}`
        : 'All trader metrics calculated successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Leaderboard Calculate] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to calculate metrics'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/leaderboard/calculate
 * Trigger calculation via GET (for simple cron services)
 */
export async function GET(request: NextRequest) {
  return POST(request);
}
