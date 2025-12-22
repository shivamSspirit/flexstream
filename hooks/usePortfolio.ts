import { useQuery } from '@tanstack/react-query';
import { useWallet } from '@solana/wallet-adapter-react';

interface TokenSummary {
  total_tokens_created: number;
  total_market_cap: number;
  total_volume: number;
  total_holders: number;
}

interface CreatedToken {
  token_id: string;
  mint_address: string;
  symbol: string;
  name: string;
  display_name: string;
  is_verified: boolean;
  image_uri: string;
  market_cap: number;
  price_sol: number;
  price_usd: number;
  volume_24h: number;
  volume_total: number;
  holders_count: number;
  trades_count: number;
  is_tradable: boolean;
  created_at: string;
  post_id: string;
  post_content: string;
  post_media: string[];
  post_created_at: string;
}

interface PortfolioData {
  tokens: CreatedToken[];
  summary: TokenSummary;
}

/**
 * Hook to fetch tokens created by the current user
 * For "Wallet" tab - shows creator's perspective
 */
export function usePortfolio(userId?: string, walletAddress?: string) {
  const wallet = useWallet();
  const effectiveWallet = walletAddress || wallet.publicKey?.toBase58();

  return useQuery<PortfolioData>({
    queryKey: ['portfolio', userId, effectiveWallet],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (effectiveWallet) params.append('walletAddress', effectiveWallet);

      const response = await fetch(`/api/users/portfolio?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch portfolio');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch portfolio');
      }

      return result.data;
    },
    enabled: !!(userId || effectiveWallet),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refresh every minute
  });
}
