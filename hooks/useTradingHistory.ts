import { useQuery } from '@tanstack/react-query';
import { useWallet } from '@solana/wallet-adapter-react';

interface TradeSummary {
  total_trades: number;
  total_buys: number;
  total_sells: number;
  total_volume_sol: number;
  total_fees_paid: number;
}

interface Trade {
  id: string;
  user_id: string;
  wallet_address: string;
  token_id: string;
  token_mint: string;
  trade_type: 'buy' | 'sell' | 'swap';
  quantity: number;
  price_per_token: number;
  total_sol_amount: number;
  total_usd_value: number;
  fee_amount: number;
  signature: string;
  block_time: string;
  status: 'pending' | 'confirmed' | 'failed';
  created_at: string;
  tokens: {
    symbol: string;
    name: string;
    display_name: string;
    image_uri: string;
    is_verified: boolean;
  };
}

interface Pagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

interface TradingHistoryData {
  history: Trade[];
  summary: TradeSummary;
  pagination: Pagination;
}

/**
 * Hook to fetch trading history for the current user
 * For "Activity" tab - shows all trades with pagination
 */
export function useTradingHistory(
  userId?: string,
  walletAddress?: string,
  limit = 50,
  offset = 0
) {
  const wallet = useWallet();
  const effectiveWallet = walletAddress || wallet.publicKey?.toBase58();

  return useQuery<TradingHistoryData>({
    queryKey: ['trading-history', userId, effectiveWallet, limit, offset],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (effectiveWallet) params.append('walletAddress', effectiveWallet);
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());

      const response = await fetch(`/api/users/trading-history?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch trading history');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch trading history');
      }

      return result.data;
    },
    enabled: !!(userId || effectiveWallet),
    staleTime: 60000, // 1 minute
  });
}
