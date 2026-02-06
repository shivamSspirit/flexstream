/**
 * Unified Prediction Markets Hook
 *
 * React Query hooks for fetching markets and executing trades
 * via the unified Kalshi + DFlow integration.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePrivy } from '@privy-io/react-auth';
import { useWallets as useSolanaWallets } from '@privy-io/react-auth/solana';
import { Connection, VersionedTransaction } from '@solana/web3.js';
import type {
  UnifiedMarket,
  UnifiedMarketsResponse,
  MarketFilters,
  PredictionSide,
  PredictionPosition,
} from '@/types';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const HELIUS_RPC_URL = process.env.NEXT_PUBLIC_HELIUS_RPC_URL ||
  'https://devnet.helius-rpc.com/?api-key=YOUR_API_KEY';

// Query keys
const QUERY_KEYS = {
  markets: 'unified-markets',
  market: 'unified-market',
  positions: 'prediction-positions',
  portfolio: 'prediction-portfolio',
};

// ═══════════════════════════════════════════════════════════════════════════════
// FETCH FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

async function fetchUnifiedMarkets(filters?: MarketFilters): Promise<UnifiedMarketsResponse> {
  const params = new URLSearchParams();

  if (filters?.category) params.set('category', filters.category);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.source) params.set('source', filters.source);
  if (filters?.search) params.set('search', filters.search);
  if (filters?.sortBy) params.set('sortBy', filters.sortBy);
  if (filters?.sortOrder) params.set('sortOrder', filters.sortOrder);
  if (filters?.limit) params.set('limit', filters.limit.toString());
  if (filters?.offset) params.set('offset', filters.offset.toString());
  if (filters?.minVolume) params.set('minVolume', filters.minVolume.toString());
  if (filters?.hasArbitrage) params.set('hasArbitrage', 'true');
  if (filters?.endingSoon) params.set('endingSoon', 'true');

  const query = params.toString();
  const url = `/api/predictions/markets${query ? `?${query}` : ''}`;

  const response = await fetch(url);
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch markets');
  }

  return data.data;
}

async function fetchMarket(ticker: string): Promise<UnifiedMarket | null> {
  const response = await fetch(`/api/predictions/markets?search=${ticker}&limit=1`);
  const data = await response.json();

  if (!data.success || !data.data.markets.length) {
    return null;
  }

  return data.data.markets[0];
}

interface TradeQuoteParams {
  marketTicker: string;
  side: PredictionSide;
  amountUsdc: number;
  userPublicKey: string;
  slippageBps?: number;
}

interface TradeQuoteResult {
  transaction: string;
  inputAmount: string;
  outputAmount: string;
  pricePerToken: number;
  priceImpact: number;
  fee: number;
  estimatedPayout: number;
  market: {
    ticker: string;
    title: string;
    yesPrice: number;
    noPrice: number;
  } | null;
}

async function getTradeQuote(params: TradeQuoteParams): Promise<TradeQuoteResult> {
  const response = await fetch('/api/predictions/trade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to get trade quote');
  }

  return {
    ...data.data.trade,
    market: data.data.market,
  };
}

interface ConfirmTradeParams {
  marketTicker: string;
  side: PredictionSide;
  amountUsdc: number;
  userPublicKey: string;
  txSignature: string;
  outputAmount?: string;
  pricePerToken?: number;
}

interface ConfirmTradeResult {
  prediction: PredictionPosition;
  txSignature: string;
  status: 'pending' | 'confirmed' | 'failed';
  message: string;
}

async function confirmTrade(params: ConfirmTradeParams): Promise<ConfirmTradeResult> {
  const response = await fetch('/api/predictions/trade', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to confirm trade');
  }

  return data.data;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Fetch unified markets from Kalshi + DFlow
 */
export function useUnifiedMarkets(filters?: MarketFilters) {
  return useQuery({
    queryKey: [QUERY_KEYS.markets, filters],
    queryFn: () => fetchUnifiedMarkets(filters),
    staleTime: 30_000, // 30 seconds
    refetchInterval: 60_000, // Refetch every minute
  });
}

/**
 * Fetch a single market by ticker
 */
export function useMarket(ticker: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.market, ticker],
    queryFn: () => fetchMarket(ticker),
    staleTime: 30_000,
    enabled: !!ticker,
  });
}

/**
 * Fetch trending markets
 */
export function useTrendingMarkets(limit = 20) {
  return useUnifiedMarkets({
    status: 'open',
    sortBy: 'volume',
    limit,
  });
}

/**
 * Fetch markets ending soon
 */
export function useEndingSoonMarkets(limit = 20) {
  return useUnifiedMarkets({
    status: 'open',
    sortBy: 'closing',
    endingSoon: true,
    limit,
  });
}

/**
 * Fetch markets with arbitrage opportunities
 */
export function useArbitrageMarkets() {
  return useUnifiedMarkets({
    status: 'open',
    hasArbitrage: true,
  });
}

/**
 * Search markets
 */
export function useSearchMarkets(query: string) {
  return useUnifiedMarkets({
    search: query,
    limit: 20,
  });
}

/**
 * Execute a prediction trade
 */
export function usePlacePrediction() {
  const { authenticated, user } = usePrivy();
  const { wallets } = useSolanaWallets();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      market,
      side,
      amountUsdc,
    }: {
      market: UnifiedMarket;
      side: PredictionSide;
      amountUsdc: number;
    }) => {
      // Check authentication
      if (!authenticated || !user) {
        throw new Error('Please connect your wallet to place a prediction');
      }

      // Get Solana wallet
      const solanaWallet = wallets?.[0];
      if (!solanaWallet) {
        throw new Error('Please connect a Solana wallet');
      }

      const userPublicKey = solanaWallet.address;

      // Check if market supports DFlow trading
      if (!market.dflow || !market.dflow.isInitialized) {
        throw new Error('This market is not available for Solana trading yet');
      }

      // Step 1: Get trade quote
      const quote = await getTradeQuote({
        marketTicker: market.ticker,
        side,
        amountUsdc,
        userPublicKey,
        slippageBps: 100, // 1% slippage
      });

      // Step 2: Deserialize and sign transaction
      const connection = new Connection(HELIUS_RPC_URL);
      const txBuffer = Buffer.from(quote.transaction, 'base64');
      const transaction = VersionedTransaction.deserialize(txBuffer);

      // Get latest blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.message.recentBlockhash = blockhash;

      // Sign the transaction using Privy's Solana wallet
      // Cast to any to handle Privy SDK type differences
      const wallet = solanaWallet as unknown as { signTransaction: (tx: VersionedTransaction) => Promise<{ signedTransaction?: VersionedTransaction } | VersionedTransaction> };
      const signResult = await wallet.signTransaction(transaction);
      const signedTx = ('signedTransaction' in signResult && signResult.signedTransaction)
        ? signResult.signedTransaction
        : signResult as VersionedTransaction;

      // Step 3: Send transaction
      const signature = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false,
        maxRetries: 3,
      });

      // Step 4: Confirm transaction
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });

      // Step 5: Record in database
      const result = await confirmTrade({
        marketTicker: market.ticker,
        side,
        amountUsdc,
        userPublicKey,
        txSignature: signature,
        outputAmount: quote.outputAmount,
        pricePerToken: quote.pricePerToken,
      });

      return {
        ...result,
        quote,
      };
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.positions] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.portfolio] });
    },
  });
}

/**
 * Get user's prediction positions
 */
export function useUserPositions() {
  const { authenticated, user } = usePrivy();
  const { wallets } = useSolanaWallets();

  const solanaWallet = wallets?.[0];

  return useQuery({
    queryKey: [QUERY_KEYS.positions, solanaWallet?.address],
    queryFn: async () => {
      if (!solanaWallet?.address) return [];

      const response = await fetch(
        `/api/predictions/bet?wallet=${solanaWallet.address}`
      );
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch positions');
      }

      return data.data as PredictionPosition[];
    },
    enabled: authenticated && !!solanaWallet?.address,
    staleTime: 30_000,
  });
}

/**
 * Quick prediction placement (for swipe actions)
 * Returns the mutation but with simplified interface
 */
export function useQuickPredict() {
  const placePrediction = usePlacePrediction();

  const predict = async (
    market: UnifiedMarket,
    side: PredictionSide,
    amountUsdc: number
  ) => {
    return placePrediction.mutateAsync({ market, side, amountUsdc });
  };

  return {
    predict,
    isLoading: placePrediction.isPending,
    error: placePrediction.error,
    isSuccess: placePrediction.isSuccess,
    reset: placePrediction.reset,
  };
}

/**
 * Check if a market is tradeable via DFlow
 */
export function isMarketTradeable(market: UnifiedMarket): boolean {
  return !!market.dflow && market.dflow.isInitialized && market.status === 'open';
}

/**
 * Format prediction amount for display
 */
export function formatPredictionAmount(amountUsdc: number): string {
  if (amountUsdc >= 1000) {
    return `$${(amountUsdc / 1000).toFixed(1)}K`;
  }
  return `$${amountUsdc.toFixed(2)}`;
}

/**
 * Calculate estimated return for a prediction
 */
export function calculateEstimatedReturn(
  amountUsdc: number,
  side: PredictionSide,
  market: UnifiedMarket
): { payout: number; profit: number; multiplier: number } {
  const price = side === 'yes' ? market.yesPrice : market.noPrice;
  const payout = price > 0 ? (amountUsdc / price) * 100 : 0;
  const profit = payout - amountUsdc;
  const multiplier = price > 0 ? 100 / price : 1;

  return {
    payout: Math.round(payout * 100) / 100,
    profit: Math.round(profit * 100) / 100,
    multiplier: Math.round(multiplier * 100) / 100,
  };
}
