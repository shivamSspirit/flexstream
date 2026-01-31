/**
 * DFlow Prediction Market Service
 *
 * Provides trading on tokenized Kalshi markets via DFlow
 * - YES/NO tokens are SPL tokens on Solana
 * - Uses DFlow's Trading API for swaps
 * - Builder fees give us 0.5% revenue
 *
 * API Docs: https://pond.dflow.net/build/introduction
 */

import { Connection, PublicKey, VersionedTransaction } from '@solana/web3.js';

// API endpoints
const DFLOW_METADATA_API = 'https://dev-prediction-markets-api.dflow.net';
const DFLOW_QUOTE_API = 'https://dev-quote-api.dflow.net';

// Common token mints
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const SOL_MINT = 'So11111111111111111111111111111111111111112';

// ============================================================================
// TYPES
// ============================================================================

export interface DFlowEvent {
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

export interface DFlowMarket {
  ticker: string;
  title: string;
  eventTicker: string;
  status: 'active' | 'settled' | 'initialized';
  isInitialized: boolean;
  yesMint: string; // YES outcome token address
  noMint: string; // NO outcome token address
  marketLedger: string; // Settlement currency mint
  yesPrice?: number; // 0-100 (probability)
  noPrice?: number;
  volume?: number;
  lastTradePrice?: number;
}

export interface DFlowOrderbook {
  bids: Array<{ price: number; quantity: number }>;
  asks: Array<{ price: number; quantity: number }>;
  yesBestBid?: number;
  yesBestAsk?: number;
  noBestBid?: number;
  noBestAsk?: number;
}

export interface DFlowTradeRequest {
  inputMint: string; // Token to spend (e.g., USDC)
  outputMint: string; // Token to receive (YES or NO token)
  amount: string; // In smallest units (lamports/micro-units)
  userPublicKey: string;
  slippageBps?: number; // Slippage tolerance in basis points
}

export interface DFlowTradeResponse {
  transaction: string; // Base64 encoded versioned transaction
  inputAmount: string;
  outputAmount: string;
  priceImpact: number;
  fee: number;
}

export interface DFlowOrderStatus {
  status: 'pending' | 'confirmed' | 'failed';
  signature?: string;
  error?: string;
}

// ============================================================================
// METADATA API (Discovery)
// ============================================================================

/**
 * Get all prediction market events
 */
export async function getEvents(params?: {
  status?: 'active' | 'initialized';
  category?: string;
  limit?: number;
  withNestedMarkets?: boolean;
}): Promise<{ events: DFlowEvent[] }> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.withNestedMarkets !== false) searchParams.set('withNestedMarkets', 'true');

  const query = searchParams.toString();
  const url = `${DFLOW_METADATA_API}/api/v1/events${query ? `?${query}` : ''}`;

  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 30 },
    });

    if (!response.ok) {
      throw new Error(`DFlow API error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('DFlow getEvents error:', error);
    throw error;
  }
}

/**
 * Get a specific event by ticker
 */
export async function getEvent(eventTicker: string): Promise<{ event: DFlowEvent }> {
  const response = await fetch(
    `${DFLOW_METADATA_API}/api/v1/events/${eventTicker}?withNestedMarkets=true`,
    {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 30 },
    }
  );

  if (!response.ok) {
    throw new Error(`DFlow API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Get market by ticker
 */
export async function getMarket(marketTicker: string): Promise<{ market: DFlowMarket }> {
  const response = await fetch(
    `${DFLOW_METADATA_API}/api/v1/markets/${marketTicker}`,
    {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 30 },
    }
  );

  if (!response.ok) {
    throw new Error(`DFlow API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Get orderbook for a market
 */
export async function getOrderbook(marketTicker: string): Promise<DFlowOrderbook> {
  const response = await fetch(
    `${DFLOW_QUOTE_API}/api/v1/orderbook/${marketTicker}`,
    {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 5 }, // More frequent updates
    }
  );

  if (!response.ok) {
    throw new Error(`DFlow API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Get categories and tags
 */
export async function getCategories(): Promise<{ categories: Record<string, string[]> }> {
  const response = await fetch(
    `${DFLOW_METADATA_API}/api/v1/tags_by_categories`,
    {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 300 }, // 5 min cache
    }
  );

  if (!response.ok) {
    throw new Error(`DFlow API error: ${response.status}`);
  }

  return response.json();
}

// ============================================================================
// TRADING API
// ============================================================================

/**
 * Get a trade quote and transaction
 *
 * This returns a versioned transaction that the user must sign
 */
export async function getTradeQuote(params: DFlowTradeRequest): Promise<DFlowTradeResponse> {
  const searchParams = new URLSearchParams({
    inputMint: params.inputMint,
    outputMint: params.outputMint,
    amount: params.amount,
    userPublicKey: params.userPublicKey,
  });

  if (params.slippageBps) {
    searchParams.set('slippageBps', params.slippageBps.toString());
  }

  const response = await fetch(
    `${DFLOW_QUOTE_API}/order?${searchParams}`,
    {
      headers: { 'Accept': 'application/json' },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DFlow trade error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Buy YES tokens on a prediction market
 */
export async function buyYes(params: {
  marketTicker: string;
  yesMint: string;
  amountUsdc: number; // In USDC (e.g., 10 for $10)
  userPublicKey: string;
  slippageBps?: number;
}): Promise<DFlowTradeResponse> {
  // Convert USDC to micro-units (6 decimals)
  const amountMicroUsdc = Math.floor(params.amountUsdc * 1_000_000).toString();

  return getTradeQuote({
    inputMint: USDC_MINT,
    outputMint: params.yesMint,
    amount: amountMicroUsdc,
    userPublicKey: params.userPublicKey,
    slippageBps: params.slippageBps || 100, // 1% default
  });
}

/**
 * Buy NO tokens on a prediction market
 */
export async function buyNo(params: {
  marketTicker: string;
  noMint: string;
  amountUsdc: number;
  userPublicKey: string;
  slippageBps?: number;
}): Promise<DFlowTradeResponse> {
  const amountMicroUsdc = Math.floor(params.amountUsdc * 1_000_000).toString();

  return getTradeQuote({
    inputMint: USDC_MINT,
    outputMint: params.noMint,
    amount: amountMicroUsdc,
    userPublicKey: params.userPublicKey,
    slippageBps: params.slippageBps || 100,
  });
}

/**
 * Sell YES tokens back to USDC
 */
export async function sellYes(params: {
  marketTicker: string;
  yesMint: string;
  amount: number; // Number of YES tokens to sell
  userPublicKey: string;
  slippageBps?: number;
}): Promise<DFlowTradeResponse> {
  // YES tokens have 6 decimals
  const amountMicroTokens = Math.floor(params.amount * 1_000_000).toString();

  return getTradeQuote({
    inputMint: params.yesMint,
    outputMint: USDC_MINT,
    amount: amountMicroTokens,
    userPublicKey: params.userPublicKey,
    slippageBps: params.slippageBps || 100,
  });
}

/**
 * Sell NO tokens back to USDC
 */
export async function sellNo(params: {
  marketTicker: string;
  noMint: string;
  amount: number;
  userPublicKey: string;
  slippageBps?: number;
}): Promise<DFlowTradeResponse> {
  const amountMicroTokens = Math.floor(params.amount * 1_000_000).toString();

  return getTradeQuote({
    inputMint: params.noMint,
    outputMint: USDC_MINT,
    amount: amountMicroTokens,
    userPublicKey: params.userPublicKey,
    slippageBps: params.slippageBps || 100,
  });
}

/**
 * Deserialize and prepare transaction for signing
 */
export function deserializeTransaction(base64Transaction: string): VersionedTransaction {
  const buffer = Buffer.from(base64Transaction, 'base64');
  return VersionedTransaction.deserialize(buffer);
}

/**
 * Check order status
 */
export async function getOrderStatus(signature: string): Promise<DFlowOrderStatus> {
  const response = await fetch(
    `${DFLOW_QUOTE_API}/order-status?signature=${signature}`,
    {
      headers: { 'Accept': 'application/json' },
    }
  );

  if (!response.ok) {
    throw new Error(`DFlow order status error: ${response.status}`);
  }

  return response.json();
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert price to probability percentage
 * DFlow uses 0-10000 scale (basis points)
 */
export function priceToProbability(price: number): number {
  return price / 100; // Convert to 0-100
}

/**
 * Format probability as display string
 */
export function formatProbability(price: number): string {
  return `${priceToProbability(price).toFixed(1)}%`;
}

/**
 * Calculate potential payout for a YES/NO bet
 * If you bet $10 at 30% probability and win, you get ~$33.33
 */
export function calculatePayout(betAmount: number, probability: number): number {
  if (probability <= 0 || probability >= 100) return betAmount;
  return betAmount / (probability / 100);
}

/**
 * Calculate implied probability from YES/NO prices
 */
export function getImpliedProbability(yesPrice: number, noPrice: number): {
  yes: number;
  no: number;
  overround: number;
} {
  const yesProb = priceToProbability(yesPrice);
  const noProb = priceToProbability(noPrice);
  const overround = yesProb + noProb - 100; // Market maker's edge

  return {
    yes: yesProb,
    no: noProb,
    overround,
  };
}

/**
 * Get market by outcome token mint
 */
export async function getMarketByMint(mint: string): Promise<DFlowMarket | null> {
  try {
    const response = await fetch(
      `${DFLOW_QUOTE_API}/api/v1/orderbook/by-mint/${mint}`,
      {
        headers: { 'Accept': 'application/json' },
      }
    );

    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

// ============================================================================
// BUILDER CODES (Revenue)
// ============================================================================

/**
 * DFlow Builder Codes allow us to earn 0.5% on every trade
 * This should be included in all trade requests
 *
 * TODO: Get our builder code from DFlow dashboard
 * https://pond.dflow.net/build/api-key
 */
export const FLEXSTREAM_BUILDER_CODE = process.env.DFLOW_BUILDER_CODE || '';

/**
 * Add builder code to trade request headers
 */
export function getTradeHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Accept': 'application/json',
  };

  if (FLEXSTREAM_BUILDER_CODE) {
    headers['x-api-key'] = FLEXSTREAM_BUILDER_CODE;
  }

  return headers;
}
