/**
 * Kalshi API Service
 * Fetches real-time prediction market data from Kalshi's public API
 *
 * API Documentation: https://trading-api.readme.io/reference
 * Base URL: https://api.elections.kalshi.com/trade-api/v2
 *
 * Note: Despite the "elections" subdomain, this API provides access to ALL Kalshi markets
 */

const KALSHI_API_BASE = 'https://api.elections.kalshi.com/trade-api/v2';

// Types for Kalshi API responses
export interface KalshiSeries {
  ticker: string;
  title: string;
  frequency: string;
  category: string;
  tags?: string[];
}

export interface KalshiEvent {
  event_ticker: string;
  series_ticker: string;
  sub_title: string;
  title: string;
  mutually_exclusive: boolean;
  category: string;
  markets?: KalshiMarket[];
  strike_date?: string;
}

export interface KalshiMarket {
  ticker: string;
  event_ticker: string;
  series_ticker?: string;
  title: string;
  subtitle?: string;
  open_time: string;
  close_time: string;
  expiration_time: string;
  status: 'open' | 'closed' | 'settled';
  yes_bid: number;
  yes_ask: number;
  no_bid: number;
  no_ask: number;
  last_price: number;
  yes_price?: number;
  volume: number;
  volume_24h?: number;
  open_interest?: number;
  result?: 'yes' | 'no' | null;
  category?: string;
  risk_limit_cents?: number;
  cap_strike?: number;
  floor_strike?: number;
}

export interface KalshiOrderbook {
  yes: Array<[number, number]>; // [price, quantity]
  no: Array<[number, number]>;
}

// Helper function to make API requests
async function kalshiFetch<T>(endpoint: string): Promise<T> {
  try {
    const response = await fetch(`${KALSHI_API_BASE}${endpoint}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 30 }, // Cache for 30 seconds
    });

    if (!response.ok) {
      throw new Error(`Kalshi API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error(`Kalshi API fetch error for ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Get series information
 */
export async function getSeries(seriesTicker: string): Promise<{ series: KalshiSeries }> {
  return kalshiFetch(`/series/${seriesTicker}`);
}

/**
 * Get event details
 */
export async function getEvent(eventTicker: string): Promise<{ event: KalshiEvent }> {
  return kalshiFetch(`/events/${eventTicker}`);
}

/**
 * Get markets with optional filters
 */
export async function getMarkets(params?: {
  series_ticker?: string;
  event_ticker?: string;
  status?: 'open' | 'closed' | 'settled';
  limit?: number;
  cursor?: string;
}): Promise<{ markets: KalshiMarket[]; cursor?: string }> {
  const searchParams = new URLSearchParams();
  if (params?.series_ticker) searchParams.set('series_ticker', params.series_ticker);
  if (params?.event_ticker) searchParams.set('event_ticker', params.event_ticker);
  if (params?.status) searchParams.set('status', params.status);
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.cursor) searchParams.set('cursor', params.cursor);

  const query = searchParams.toString();
  return kalshiFetch(`/markets${query ? `?${query}` : ''}`);
}

/**
 * Get a specific market
 */
export async function getMarket(marketTicker: string): Promise<{ market: KalshiMarket }> {
  return kalshiFetch(`/markets/${marketTicker}`);
}

/**
 * Get orderbook for a market
 */
export async function getOrderbook(marketTicker: string): Promise<{ orderbook: KalshiOrderbook }> {
  return kalshiFetch(`/markets/${marketTicker}/orderbook`);
}

/**
 * Get multiple events
 */
export async function getEvents(params?: {
  series_ticker?: string;
  status?: string;
  limit?: number;
  cursor?: string;
  with_nested_markets?: boolean;
}): Promise<{ events: KalshiEvent[]; cursor?: string }> {
  const searchParams = new URLSearchParams();
  if (params?.series_ticker) searchParams.set('series_ticker', params.series_ticker);
  if (params?.status) searchParams.set('status', params.status);
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.cursor) searchParams.set('cursor', params.cursor);
  if (params?.with_nested_markets) searchParams.set('with_nested_markets', 'true');

  const query = searchParams.toString();
  return kalshiFetch(`/events${query ? `?${query}` : ''}`);
}

// Popular series tickers for featured markets
export const POPULAR_SERIES = [
  'KXPRES', // Presidential election
  'KXFED', // Federal Reserve interest rates
  'KXINFL', // Inflation
  'KXBTC', // Bitcoin price
  'KXETH', // Ethereum price
  'KXHIGHNY', // NYC temperature
  'KXGDP', // GDP
  'KXRECESSION', // Recession predictions
  'KXSP500', // S&P 500
];

// Category icons mapping
export const CATEGORY_ICONS: Record<string, string> = {
  'politics': '🏛️',
  'economics': '📊',
  'crypto': '₿',
  'climate': '🌡️',
  'finance': '💹',
  'sports': '⚽',
  'entertainment': '🎬',
  'science': '🔬',
  'technology': '💻',
  'world': '🌍',
  'default': '📈',
};

// Helper to get category icon
export function getCategoryIcon(category: string): string {
  const normalizedCategory = category?.toLowerCase() || 'default';
  return CATEGORY_ICONS[normalizedCategory] || CATEGORY_ICONS['default'];
}

// Format price from cents to display
export function formatKalshiPrice(priceCents: number): string {
  return `${priceCents}¢`;
}

// Calculate implied probability from price
export function getProbability(yesPriceCents: number): number {
  return yesPriceCents / 100;
}

// Format probability as percentage
export function formatProbability(yesPriceCents: number): string {
  return `${yesPriceCents}%`;
}
