import { NextRequest, NextResponse } from 'next/server';
import { createPriceTrackingService } from '@/lib/services/price-tracking-service';

/**
 * Cron endpoint to update all token prices
 * This can be called by a cron service (Vercel Cron, GitHub Actions, etc.)
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

    console.log('[Cron] Starting price update job...');

    const priceTracker = createPriceTrackingService();
    await priceTracker.updateAllTokenPrices();

    console.log('[Cron] Price update job completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Token prices updated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron] Error updating prices:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update prices',
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for manual price updates (single token)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { poolAddress } = body;

    if (!poolAddress) {
      return NextResponse.json(
        { success: false, error: 'Pool address is required' },
        { status: 400 }
      );
    }

    console.log('[Cron] Updating price for pool:', poolAddress);

    const priceTracker = createPriceTrackingService();
    await priceTracker.updateTokenPrice(poolAddress);

    return NextResponse.json({
      success: true,
      message: 'Token price updated successfully',
      poolAddress,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron] Error updating single token price:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update token price',
      },
      { status: 500 }
    );
  }
}
