import { useQuery } from '@tanstack/react-query';
import { useWallet } from '@solana/wallet-adapter-react';

interface HoldingSummary {
  total_holdings: number;
  total_value_sol: number;
  total_value_usd: number;
  total_invested: number;
  total_unrealized_pnl: number;
  total_realized_pnl: number;
  total_pnl: number;
  total_pnl_percentage: number;
}

interface Holding {
  wallet_address: string;
  token_mint: string;
  token_id: string;
  symbol: string;
  name: string;
  display_name: string;
  image_uri: string;
  is_verified: boolean;

  // Holdings
  quantity_owned: number;
  average_cost_basis: number;
  total_invested: number;

  // Current market data
  current_price_sol: number;
  current_price_usd: number;

  // Portfolio value
  current_value_sol: number;
  current_value_usd: number;

  // P&L
  unrealized_pnl_sol: number;
  unrealized_pnl_percentage: number;
  realized_pnl: number;
  total_pnl: number;

  // Metadata
  first_acquired_at: string;
  last_updated_at: string;
  token_created_at: string;

  // Post info
  post_id: string;
  post_content: string;
  post_media: string[];

  // Creator info
  creator_username: string;
  creator_display_name: string;
  creator_avatar: string;
}

interface HoldingsData {
  holdings: Holding[];
  summary: HoldingSummary;
}

/**
 * Hook to fetch tokens held/collected by the current user
 * For "Collected" tab - shows investor's perspective with P&L
 */
export function useHoldings(userId?: string, walletAddress?: string) {
  const wallet = useWallet();
  const effectiveWallet = walletAddress || wallet.publicKey?.toBase58();

  return useQuery<HoldingsData>({
    queryKey: ['holdings', userId, effectiveWallet],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (effectiveWallet) params.append('walletAddress', effectiveWallet);

      const response = await fetch(`/api/users/holdings?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch holdings');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch holdings');
      }

      return result.data;
    },
    enabled: !!(userId || effectiveWallet),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refresh every minute for price updates
  });
}
