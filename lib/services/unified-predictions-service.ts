/**
 * Unified Prediction Markets Service
 *
 * Combines Kalshi (regulated exchange) + DFlow (Solana tokenization)
 * to provide seamless prediction market trading on Solana.
 *
 * Architecture:
 * - Kalshi: Source of truth for market data, prices, volume
 * - DFlow: Trading layer for Solana-native execution
 *
 * Grant-worthy features:
 * - Cross-platform price comparison
 * - Arbitrage opportunity detection
 * - Mobile-first social discovery
 */

import { VersionedTransaction, Connection } from '@solana/web3.js';
import type {
  UnifiedMarket,
  UnifiedMarketsResponse,
  MarketFilters,
  PredictionTradeRequest,
  PredictionTradeResponse,
  PredictionSource,
  MarketStatus,
} from '@/types';

// ═══════════════════════════════════════════════════════════════════════════════
// API CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const KALSHI_API_BASE = 'https://api.elections.kalshi.com/trade-api/v2';
const DFLOW_METADATA_API = 'https://dev-prediction-markets-api.dflow.net/api/v1';
const DFLOW_QUOTE_API = 'https://dev-quote-api.dflow.net';

// Token mints
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

// Cache configuration
const CACHE_DURATION_MS = 30_000; // 30 seconds

// ═══════════════════════════════════════════════════════════════════════════════
// INTERNAL TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface KalshiMarket {
  ticker: string;
  event_ticker: string;
  title: string;
  subtitle?: string;
  status: 'open' | 'closed' | 'settled';
  yes_bid: number;
  yes_ask: number;
  no_bid: number;
  no_ask: number;
  last_price: number;
  volume: number;
  volume_24h?: number;
  open_interest?: number;
  open_time: string;
  close_time: string;
  expiration_time: string;
  category?: string;
  result?: 'yes' | 'no' | null;
}

interface DFlowEvent {
  ticker: string;
  title: string;
  subtitle?: string;
  category?: string;
  status: 'active' | 'settled' | 'initialized';
  markets: DFlowMarket[];
  liquidity?: number;
  openInterest?: number;
  volume24h?: number;
}

interface DFlowMarket {
  ticker: string;
  title: string;
  eventTicker: string;
  status: 'active' | 'settled' | 'initialized';
  isInitialized: boolean;
  yesMint: string;
  noMint: string;
  marketLedger: string;
  yesPrice?: number;
  noPrice?: number;
  volume?: number;
  lastTradePrice?: number;
}

// Cache store
const marketsCache: {
  data: UnifiedMarket[] | null;
  timestamp: number;
} = { data: null, timestamp: 0 };

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate time remaining in human readable format
 */
function getTimeRemaining(closeTime: string): string {
  const now = new Date();
  const close = new Date(closeTime);
  const diff = close.getTime() - now.getTime();

  if (diff <= 0) return 'Ended';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 30) return `${Math.floor(days / 30)}mo`;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * Calculate potential payout for $100 bet
 */
function calculatePayout(priceInCents: number): number {
  if (priceInCents <= 0 || priceInCents >= 100) return 100;
  return Math.round((100 / priceInCents) * 100);
}

/**
 * Detect category from ticker/title
 */
function detectCategory(ticker: string, title: string): string {
  const t = ticker.toLowerCase();
  const tl = title.toLowerCase();

  if (t.includes('btc') || t.includes('eth') || t.includes('sol') ||
      tl.includes('bitcoin') || tl.includes('ethereum') || tl.includes('solana') ||
      tl.includes('crypto') || tl.includes('doge')) {
    return 'crypto';
  }
  if (t.includes('trump') || t.includes('biden') || t.includes('pres') ||
      tl.includes('election') || tl.includes('president') || tl.includes('congress')) {
    return 'politics';
  }
  if (t.includes('fed') || tl.includes('fed') || tl.includes('rate') ||
      tl.includes('inflation') || tl.includes('recession') || tl.includes('gdp') ||
      tl.includes('s&p') || tl.includes('unemployment')) {
    return 'economics';
  }
  if (tl.includes('openai') || tl.includes('gpt') || tl.includes('ai ') ||
      tl.includes('nvidia') || tl.includes('tesla') || tl.includes('spacex') ||
      tl.includes('apple') || tl.includes('google') || tl.includes('meta')) {
    return 'tech';
  }
  if (tl.includes('climate') || tl.includes('temperature') || tl.includes('hurricane') ||
      tl.includes('carbon') || tl.includes('environment')) {
    return 'climate';
  }
  return 'general';
}

// ═══════════════════════════════════════════════════════════════════════════════
// KALSHI API
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Fetch markets from Kalshi API
 */
async function fetchKalshiMarkets(params?: {
  status?: 'open' | 'closed' | 'settled';
  limit?: number;
}): Promise<KalshiMarket[]> {
  try {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const query = searchParams.toString();
    const url = `${KALSHI_API_BASE}/markets${query ? `?${query}` : ''}`;

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 30 },
    });

    if (!response.ok) {
      console.error(`Kalshi API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.markets || [];
  } catch (error) {
    console.error('Kalshi fetch error:', error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DFLOW API
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Fetch events from DFlow API (tokenized Kalshi markets)
 */
async function fetchDFlowEvents(params?: {
  status?: 'active' | 'initialized';
  limit?: number;
}): Promise<DFlowEvent[]> {
  try {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    searchParams.set('withNestedMarkets', 'true');

    const query = searchParams.toString();
    const url = `${DFLOW_METADATA_API}/events${query ? `?${query}` : ''}`;

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 30 },
    });

    if (!response.ok) {
      console.error(`DFlow API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.events || [];
  } catch (error) {
    console.error('DFlow fetch error:', error);
    return [];
  }
}

/**
 * Get DFlow orderbook for a market
 */
async function fetchDFlowOrderbook(marketTicker: string): Promise<{
  yesBid?: number;
  yesAsk?: number;
  noBid?: number;
  noAsk?: number;
} | null> {
  try {
    const response = await fetch(
      `${DFLOW_METADATA_API}/orderbook/${marketTicker}`,
      {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 5 },
      }
    );

    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

/**
 * Get a trade quote from DFlow
 */
async function getDFlowQuote(params: {
  inputMint: string;
  outputMint: string;
  amount: string;
  userPublicKey: string;
  slippageBps?: number;
}): Promise<{
  transaction: string;
  inputAmount: string;
  outputAmount: string;
  priceImpact: number;
  fee: number;
} | null> {
  try {
    const searchParams = new URLSearchParams({
      inputMint: params.inputMint,
      outputMint: params.outputMint,
      amount: params.amount,
      userPublicKey: params.userPublicKey,
      slippageBps: (params.slippageBps || 100).toString(),
    });

    const response = await fetch(
      `${DFLOW_QUOTE_API}/order?${searchParams}`,
      {
        headers: { 'Accept': 'application/json' },
      }
    );

    if (!response.ok) {
      console.error('DFlow quote error:', response.status);
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('DFlow quote error:', error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// UNIFIED SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Convert Kalshi market to unified format
 */
function kalshiToUnified(market: KalshiMarket, dflowData?: DFlowMarket): UnifiedMarket {
  const yesPrice = market.yes_bid || market.last_price || 50;
  const noPrice = 100 - yesPrice;

  const unified: UnifiedMarket = {
    ticker: market.ticker,
    eventTicker: market.event_ticker,
    title: market.title,
    subtitle: market.subtitle,
    status: market.status as MarketStatus,
    isLive: market.status === 'open',
    yesPrice,
    noPrice,
    yesBid: market.yes_bid || yesPrice,
    yesAsk: market.yes_ask || yesPrice,
    noBid: market.no_bid || noPrice,
    noAsk: market.no_ask || noPrice,
    lastPrice: market.last_price || yesPrice,
    volume: market.volume || 0,
    volume24h: market.volume_24h || 0,
    openInterest: market.open_interest,
    openTime: market.open_time,
    closeTime: market.close_time,
    expirationTime: market.expiration_time,
    category: market.category || detectCategory(market.ticker, market.title),
    source: 'kalshi' as PredictionSource,
    kalshiTicker: market.ticker,
    impliedProbability: yesPrice,
    potentialPayoutYes: calculatePayout(yesPrice),
    potentialPayoutNo: calculatePayout(noPrice),
    timeRemaining: getTimeRemaining(market.close_time),
  };

  // Add DFlow data if available (for Solana trading)
  if (dflowData && dflowData.isInitialized) {
    unified.source = 'dflow';
    unified.dflow = {
      yesMint: dflowData.yesMint,
      noMint: dflowData.noMint,
      marketLedger: dflowData.marketLedger,
      isInitialized: dflowData.isInitialized,
    };

    // Check for arbitrage opportunity
    if (dflowData.yesPrice !== undefined) {
      const dflowYes = dflowData.yesPrice;
      const kalshiYes = yesPrice;
      const spread = Math.abs(dflowYes - kalshiYes);
      const spreadPercent = (spread / kalshiYes) * 100;

      if (spreadPercent > 2) {
        unified.arbitrage = {
          spreadPercent,
          direction: dflowYes < kalshiYes ? 'buy_dflow' : 'buy_kalshi',
          opportunity: true,
        };
      }
    }
  }

  return unified;
}

/**
 * Convert DFlow event to unified format (when no Kalshi match)
 */
function dflowToUnified(event: DFlowEvent, market: DFlowMarket): UnifiedMarket {
  const yesPrice = market.yesPrice || 50;
  const noPrice = market.noPrice || 50;

  return {
    ticker: market.ticker,
    eventTicker: event.ticker,
    title: market.title || event.title,
    subtitle: event.subtitle,
    status: market.status === 'active' ? 'open' : market.status === 'settled' ? 'settled' : 'closed',
    isLive: market.status === 'active',
    yesPrice,
    noPrice,
    yesBid: yesPrice,
    yesAsk: yesPrice,
    noBid: noPrice,
    noAsk: noPrice,
    lastPrice: market.lastTradePrice || yesPrice,
    volume: market.volume || 0,
    volume24h: event.volume24h || 0,
    openInterest: event.openInterest,
    liquidity: event.liquidity,
    openTime: new Date().toISOString(),
    closeTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    expirationTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    category: event.category || detectCategory(event.ticker, event.title),
    source: 'dflow',
    dflow: {
      yesMint: market.yesMint,
      noMint: market.noMint,
      marketLedger: market.marketLedger,
      isInitialized: market.isInitialized,
    },
    impliedProbability: yesPrice,
    potentialPayoutYes: calculatePayout(yesPrice),
    potentialPayoutNo: calculatePayout(noPrice),
    timeRemaining: '30d',
  };
}

/**
 * Merge Kalshi and DFlow markets
 */
function mergeMarkets(
  kalshiMarkets: KalshiMarket[],
  dflowEvents: DFlowEvent[]
): UnifiedMarket[] {
  const unified: UnifiedMarket[] = [];
  const processedTickers = new Set<string>();

  // Create a map of DFlow markets by ticker for quick lookup
  const dflowMap = new Map<string, DFlowMarket>();
  for (const event of dflowEvents) {
    for (const market of event.markets || []) {
      // DFlow tickers often have KALSHI- prefix
      const normalizedTicker = market.ticker.replace(/^KALSHI-/, '');
      dflowMap.set(normalizedTicker, market);
      dflowMap.set(market.ticker, market);
    }
  }

  // Process Kalshi markets first (primary source)
  for (const kalshiMarket of kalshiMarkets) {
    // Filter out garbage data (sports parlays, etc.)
    const title = kalshiMarket.title || '';
    const isGarbage = (
      (title.match(/yes /gi) || []).length > 2 ||
      (title.match(/\d+\+/g) || []).length > 1 ||
      (title.match(/:/g) || []).length > 2 ||
      title.toLowerCase().includes('parlay')
    );
    if (isGarbage) continue;

    // Check if DFlow has this market
    const dflowMarket = dflowMap.get(kalshiMarket.ticker) ||
                        dflowMap.get(`KALSHI-${kalshiMarket.ticker}`);

    unified.push(kalshiToUnified(kalshiMarket, dflowMarket));
    processedTickers.add(kalshiMarket.ticker);
  }

  // Add DFlow-only markets (not on Kalshi)
  for (const event of dflowEvents) {
    for (const market of event.markets || []) {
      const normalizedTicker = market.ticker.replace(/^KALSHI-/, '');
      if (!processedTickers.has(normalizedTicker) && !processedTickers.has(market.ticker)) {
        if (market.isInitialized) {
          unified.push(dflowToUnified(event, market));
          processedTickers.add(market.ticker);
        }
      }
    }
  }

  return unified;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get unified markets from Kalshi + DFlow
 */
export async function getUnifiedMarkets(
  filters?: MarketFilters
): Promise<UnifiedMarketsResponse> {
  // Check cache first
  if (marketsCache.data && Date.now() - marketsCache.timestamp < CACHE_DURATION_MS) {
    let filtered = marketsCache.data;

    // Apply filters
    if (filters) {
      filtered = applyFilters(filtered, filters);
    }

    return {
      markets: filtered,
      total: filtered.length,
      hasMore: false,
      sources: {
        kalshi: { count: filtered.filter(m => m.kalshiTicker).length, status: 'ok' },
        dflow: { count: filtered.filter(m => m.dflow).length, status: 'ok' },
      },
      lastUpdated: new Date(marketsCache.timestamp).toISOString(),
    };
  }

  // Fetch from both sources in parallel
  const [kalshiMarkets, dflowEvents] = await Promise.all([
    fetchKalshiMarkets({ status: 'open', limit: 200 }),
    fetchDFlowEvents({ status: 'active', limit: 100 }),
  ]);

  // Merge and normalize
  const unified = mergeMarkets(kalshiMarkets, dflowEvents);

  // Update cache
  marketsCache.data = unified;
  marketsCache.timestamp = Date.now();

  // Apply filters
  let filtered = unified;
  if (filters) {
    filtered = applyFilters(filtered, filters);
  }

  return {
    markets: filtered,
    total: filtered.length,
    hasMore: false,
    sources: {
      kalshi: { count: kalshiMarkets.length, status: kalshiMarkets.length > 0 ? 'ok' : 'error' },
      dflow: { count: dflowEvents.length, status: dflowEvents.length > 0 ? 'ok' : 'error' },
    },
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Apply filters to markets
 */
function applyFilters(markets: UnifiedMarket[], filters: MarketFilters): UnifiedMarket[] {
  let filtered = [...markets];

  // Category filter
  if (filters.category && filters.category !== 'all' && filters.category !== 'trending') {
    filtered = filtered.filter(m => m.category === filters.category);
  }

  // Status filter
  if (filters.status) {
    filtered = filtered.filter(m => m.status === filters.status);
  }

  // Source filter
  if (filters.source) {
    filtered = filtered.filter(m => m.source === filters.source);
  }

  // Search filter
  if (filters.search) {
    const search = filters.search.toLowerCase();
    filtered = filtered.filter(m =>
      m.title.toLowerCase().includes(search) ||
      m.ticker.toLowerCase().includes(search)
    );
  }

  // Volume filter
  if (filters.minVolume) {
    filtered = filtered.filter(m => m.volume >= filters.minVolume!);
  }

  // Arbitrage filter
  if (filters.hasArbitrage) {
    filtered = filtered.filter(m => m.arbitrage?.opportunity);
  }

  // Ending soon filter (within 24 hours)
  if (filters.endingSoon) {
    const tomorrow = Date.now() + 24 * 60 * 60 * 1000;
    filtered = filtered.filter(m => new Date(m.closeTime).getTime() < tomorrow);
  }

  // Sorting
  const sortBy = filters.sortBy || 'volume';
  const sortOrder = filters.sortOrder || 'desc';

  filtered.sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'volume':
        comparison = (b.volume || 0) - (a.volume || 0);
        break;
      case 'newest':
        comparison = new Date(b.openTime).getTime() - new Date(a.openTime).getTime();
        break;
      case 'closing':
        comparison = new Date(a.closeTime).getTime() - new Date(b.closeTime).getTime();
        break;
      case 'probability':
        comparison = Math.abs(50 - a.yesPrice) - Math.abs(50 - b.yesPrice);
        break;
    }
    return sortOrder === 'asc' ? -comparison : comparison;
  });

  // Pagination
  if (filters.offset) {
    filtered = filtered.slice(filters.offset);
  }
  if (filters.limit) {
    filtered = filtered.slice(0, filters.limit);
  }

  return filtered;
}

/**
 * Get a single market by ticker
 */
export async function getMarket(ticker: string): Promise<UnifiedMarket | null> {
  // Try cache first
  if (marketsCache.data) {
    const cached = marketsCache.data.find(m => m.ticker === ticker);
    if (cached) return cached;
  }

  // Fetch fresh
  const response = await getUnifiedMarkets();
  return response.markets.find(m => m.ticker === ticker) || null;
}

/**
 * Get a trade quote for a prediction market
 */
export async function getTradeQuote(
  request: PredictionTradeRequest
): Promise<PredictionTradeResponse> {
  // Get market details
  const market = await getMarket(request.marketTicker);
  if (!market) {
    return { success: false, error: 'Market not found' };
  }

  // Check if DFlow trading is available
  if (!market.dflow || !market.dflow.isInitialized) {
    return { success: false, error: 'Market not available for Solana trading yet' };
  }

  // Get the correct token mint
  const outputMint = request.side === 'yes' ? market.dflow.yesMint : market.dflow.noMint;

  // Convert USDC amount to micro units (6 decimals)
  const amountMicroUsdc = Math.floor(request.amountUsdc * 1_000_000).toString();

  // Get quote from DFlow
  const quote = await getDFlowQuote({
    inputMint: USDC_MINT,
    outputMint,
    amount: amountMicroUsdc,
    userPublicKey: request.userPublicKey,
    slippageBps: request.slippageBps || 100,
  });

  if (!quote) {
    return { success: false, error: 'Failed to get trade quote from DFlow' };
  }

  // Calculate price per token and estimated payout
  const outputTokens = parseFloat(quote.outputAmount) / 1_000_000;
  const pricePerToken = request.amountUsdc / outputTokens;
  const estimatedPayout = outputTokens * 1; // Each token worth $1 if prediction wins

  return {
    success: true,
    trade: {
      transaction: quote.transaction,
      inputAmount: quote.inputAmount,
      outputAmount: quote.outputAmount,
      pricePerToken: Math.round(pricePerToken * 100), // In cents
      priceImpact: quote.priceImpact,
      fee: quote.fee,
      estimatedPayout: Math.round(estimatedPayout * 100) / 100,
    },
  };
}

/**
 * Deserialize a DFlow transaction for signing
 */
export function deserializeTransaction(base64Transaction: string): VersionedTransaction {
  const buffer = Buffer.from(base64Transaction, 'base64');
  return VersionedTransaction.deserialize(buffer);
}

/**
 * Check order status after submission
 */
export async function checkOrderStatus(signature: string): Promise<{
  status: 'pending' | 'confirmed' | 'failed';
  error?: string;
}> {
  try {
    const response = await fetch(
      `${DFLOW_QUOTE_API}/order-status?signature=${signature}`,
      { headers: { 'Accept': 'application/json' } }
    );

    if (!response.ok) {
      return { status: 'pending' };
    }

    return response.json();
  } catch {
    return { status: 'pending' };
  }
}

/**
 * Get markets with arbitrage opportunities
 */
export async function getArbitrageOpportunities(): Promise<UnifiedMarket[]> {
  const response = await getUnifiedMarkets({ hasArbitrage: true });
  return response.markets;
}

/**
 * Get trending markets (high volume + recent activity)
 */
export async function getTrendingMarkets(limit = 20): Promise<UnifiedMarket[]> {
  const response = await getUnifiedMarkets({
    status: 'open',
    sortBy: 'volume',
    limit,
  });
  return response.markets;
}

/**
 * Get markets ending soon
 */
export async function getEndingSoonMarkets(limit = 20): Promise<UnifiedMarket[]> {
  const response = await getUnifiedMarkets({
    status: 'open',
    sortBy: 'closing',
    endingSoon: true,
    limit,
  });
  return response.markets;
}

/**
 * Search markets
 */
export async function searchMarkets(query: string, limit = 20): Promise<UnifiedMarket[]> {
  const response = await getUnifiedMarkets({
    search: query,
    limit,
  });
  return response.markets;
}

/**
 * Clear the markets cache
 */
export function clearMarketsCache(): void {
  marketsCache.data = null;
  marketsCache.timestamp = 0;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA (Fallback when APIs are unavailable)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get curated mock markets for demo/fallback
 */
export function getMockMarkets(): UnifiedMarket[] {
  const mockData: Array<{
    ticker: string;
    eventTicker: string;
    title: string;
    yesPrice: number;
    volume: number;
    category: string;
    daysToClose: number;
  }> = [
    { ticker: 'BTC-150K-2026', eventTicker: 'CRYPTO', title: 'Will Bitcoin exceed $150,000 in 2026?', yesPrice: 67, volume: 12500000, category: 'crypto', daysToClose: 330 },
    { ticker: 'ETH-10K-2026', eventTicker: 'CRYPTO', title: 'Will Ethereum reach $10,000 by end of 2026?', yesPrice: 41, volume: 8750000, category: 'crypto', daysToClose: 330 },
    { ticker: 'SOL-500-2026', eventTicker: 'CRYPTO', title: 'Will Solana hit $500 in 2026?', yesPrice: 38, volume: 6200000, category: 'crypto', daysToClose: 330 },
    { ticker: 'AGI-2026', eventTicker: 'TECH', title: 'Will a major AI lab claim AGI breakthrough in 2026?', yesPrice: 23, volume: 9800000, category: 'tech', daysToClose: 330 },
    { ticker: 'GPT5-Q1-2026', eventTicker: 'TECH', title: 'Will OpenAI release GPT-5 before April 2026?', yesPrice: 81, volume: 7600000, category: 'tech', daysToClose: 60 },
    { ticker: 'FED-RATE-3PCT', eventTicker: 'ECONOMICS', title: 'Will the Fed Funds Rate be below 3% by end of 2026?', yesPrice: 48, volume: 8200000, category: 'economics', daysToClose: 330 },
    { ticker: 'SP500-7000', eventTicker: 'ECONOMICS', title: 'Will S&P 500 close above 7,000 in 2026?', yesPrice: 58, volume: 6500000, category: 'economics', daysToClose: 330 },
    { ticker: 'TRUMP-2028', eventTicker: 'POLITICS', title: 'Will Trump run for president in 2028?', yesPrice: 15, volume: 7200000, category: 'politics', daysToClose: 900 },
    { ticker: 'UKRAINE-CEASEFIRE', eventTicker: 'POLITICS', title: 'Will there be a Russia-Ukraine ceasefire by mid-2026?', yesPrice: 44, volume: 5800000, category: 'politics', daysToClose: 150 },
    { ticker: 'TSLA-1T-2026', eventTicker: 'TECH', title: 'Will Tesla reach $1 trillion market cap in 2026?', yesPrice: 55, volume: 5400000, category: 'tech', daysToClose: 330 },
  ];

  return mockData.map(m => {
    const noPrice = 100 - m.yesPrice;
    const closeTime = new Date(Date.now() + m.daysToClose * 24 * 60 * 60 * 1000).toISOString();

    return {
      ticker: m.ticker,
      eventTicker: m.eventTicker,
      title: m.title,
      status: 'open' as MarketStatus,
      isLive: true,
      yesPrice: m.yesPrice,
      noPrice,
      yesBid: m.yesPrice - 1,
      yesAsk: m.yesPrice + 1,
      noBid: noPrice - 1,
      noAsk: noPrice + 1,
      lastPrice: m.yesPrice,
      volume: m.volume,
      volume24h: Math.floor(m.volume * 0.1),
      openTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      closeTime,
      expirationTime: closeTime,
      category: m.category,
      source: 'kalshi' as PredictionSource,
      kalshiTicker: m.ticker,
      impliedProbability: m.yesPrice,
      potentialPayoutYes: calculatePayout(m.yesPrice),
      potentialPayoutNo: calculatePayout(noPrice),
      timeRemaining: getTimeRemaining(closeTime),
    };
  });
}
