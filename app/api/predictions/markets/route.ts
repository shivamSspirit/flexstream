/**
 * Unified Prediction Markets API
 *
 * GET /api/predictions/markets - Get unified markets from Kalshi + DFlow
 * Query params:
 *   - category: string (crypto, politics, economics, tech, etc.)
 *   - status: 'open' | 'closed' | 'settled'
 *   - source: 'kalshi' | 'dflow'
 *   - search: string
 *   - sortBy: 'volume' | 'newest' | 'closing' | 'probability'
 *   - limit: number
 *   - offset: number
 *   - hasArbitrage: boolean
 *   - endingSoon: boolean
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getUnifiedMarkets,
  getMockMarkets,
} from '@/lib/services/unified-predictions-service';
import type { MarketFilters, MarketStatus, PredictionSource } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 30;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const filters: MarketFilters = {};

    const category = searchParams.get('category');
    if (category) filters.category = category;

    const status = searchParams.get('status') as MarketStatus | null;
    if (status) filters.status = status;

    const source = searchParams.get('source') as PredictionSource | null;
    if (source) filters.source = source;

    const search = searchParams.get('search');
    if (search) filters.search = search;

    const sortBy = searchParams.get('sortBy') as MarketFilters['sortBy'];
    if (sortBy) filters.sortBy = sortBy;

    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' | null;
    if (sortOrder) filters.sortOrder = sortOrder;

    const limit = searchParams.get('limit');
    if (limit) filters.limit = parseInt(limit, 10);

    const offset = searchParams.get('offset');
    if (offset) filters.offset = parseInt(offset, 10);

    const minVolume = searchParams.get('minVolume');
    if (minVolume) filters.minVolume = parseInt(minVolume, 10);

    const hasArbitrage = searchParams.get('hasArbitrage');
    if (hasArbitrage === 'true') filters.hasArbitrage = true;

    const endingSoon = searchParams.get('endingSoon');
    if (endingSoon === 'true') filters.endingSoon = true;

    // Fetch unified markets
    const response = await getUnifiedMarkets(filters);

    // If no markets found, use mock data as fallback
    if (response.markets.length === 0) {
      const mockMarkets = getMockMarkets();
      return NextResponse.json({
        success: true,
        data: {
          markets: mockMarkets,
          total: mockMarkets.length,
          hasMore: false,
          sources: {
            kalshi: { count: 0, status: 'error' },
            dflow: { count: 0, status: 'error' },
            mock: { count: mockMarkets.length, status: 'ok' },
          },
          lastUpdated: new Date().toISOString(),
          isMockData: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error fetching unified markets:', error);

    // Return mock data as fallback on error
    const mockMarkets = getMockMarkets();
    return NextResponse.json({
      success: true,
      data: {
        markets: mockMarkets,
        total: mockMarkets.length,
        hasMore: false,
        sources: {
          kalshi: { count: 0, status: 'error' },
          dflow: { count: 0, status: 'error' },
          mock: { count: mockMarkets.length, status: 'ok' },
        },
        lastUpdated: new Date().toISOString(),
        isMockData: true,
        error: 'Failed to fetch live markets, showing demo data',
      },
    });
  }
}
