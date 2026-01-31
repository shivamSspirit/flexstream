import { NextRequest, NextResponse } from 'next/server';
import { createLeaderboardService } from '@/lib/services/leaderboard-service';

/**
 * Cron endpoint to update leaderboard rankings
 * Should be called periodically (every 5-10 minutes recommended)
 *
 * Setup with Vercel Cron:
 * Add to vercel.json crons array with path and schedule
 */
export async function GET(request: NextRequest) {
  try {
    // Optional: Add authentication for cron endpoint
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Leaderboard Cron] Starting leaderboard update job...');
    const startTime = Date.now();

    const leaderboardService = createLeaderboardService();

    // Calculate all trader metrics
    await leaderboardService.calculateAllTraderMetrics();

    const duration = Date.now() - startTime;

    console.log(`[Leaderboard Cron] Update completed in ${duration}ms`);

    return NextResponse.json({
      success: true,
      message: 'Leaderboard updated successfully',
      duration,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Leaderboard Cron] Error updating leaderboard:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update leaderboard'
      },
      { status: 500 }
    );
  }
}
