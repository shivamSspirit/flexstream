'use client';

import { usePortfolio } from '@/hooks/usePortfolio';
import { LoadingSpinner } from '@/components/ui/loading';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

interface WalletTabProps {
  userId?: string;
  walletAddress?: string;
}

export function WalletTab({ userId, walletAddress }: WalletTabProps) {
  const { data, isLoading, error } = usePortfolio(userId, walletAddress);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-0">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
          <p className="text-red-400">Failed to load portfolio</p>
          <p className="text-white/60 text-sm mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!data || data.tokens.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-0">
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-12 sm:p-16 border-2 border-white/20 text-center">
          <div className="text-6xl mb-4">👛</div>
          <p className="text-white/90 text-lg font-bold mb-2">No Tokens Created Yet</p>
          <p className="text-white/60 text-sm">
            Create your first post with a token to see it here
          </p>
        </div>
      </div>
    );
  }

  const { tokens, summary } = data;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <p className="text-white/60 text-xs mb-1">Tokens Created</p>
          <p className="text-white text-2xl font-bold">{summary.total_tokens_created}</p>
        </div>

        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <p className="text-white/60 text-xs mb-1">Total Market Cap</p>
          <p className="text-white text-2xl font-bold">
            ${summary.total_market_cap > 1000000
              ? `${(summary.total_market_cap / 1000000).toFixed(1)}M`
              : `${(summary.total_market_cap / 1000).toFixed(1)}K`}
          </p>
        </div>

        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <p className="text-white/60 text-xs mb-1">Total Volume</p>
          <p className="text-white text-2xl font-bold">
            ${summary.total_volume > 1000000
              ? `${(summary.total_volume / 1000000).toFixed(1)}M`
              : `${(summary.total_volume / 1000).toFixed(1)}K`}
          </p>
        </div>

        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <p className="text-white/60 text-xs mb-1">Total Holders</p>
          <p className="text-white text-2xl font-bold">{summary.total_holders}</p>
        </div>
      </div>

      {/* Tokens List */}
      <div className="space-y-3">
        {tokens.map((token) => (
          <div
            key={token.token_id}
            className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all group"
          >
            <div className="flex items-start gap-4">
              {/* Token Image */}
              <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                {token.image_uri ? (
                  <Image
                    src={token.image_uri}
                    alt={token.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-accent-purple/20 to-accent-blue/20 flex items-center justify-center">
                    <span className="text-2xl">{token.symbol.charAt(0)}</span>
                  </div>
                )}
              </div>

              {/* Token Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-white font-bold truncate">{token.display_name || token.name}</h3>
                  {token.is_verified && (
                    <CheckBadgeIcon className="w-4 h-4 text-accent-blue flex-shrink-0" />
                  )}
                  <span className="text-white/60 text-sm">${token.symbol}</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <p className="text-white/40 text-xs">Price</p>
                    <p className="text-white/90 font-medium">
                      ${token.price_usd?.toFixed(6) || '0.00'}
                    </p>
                  </div>

                  <div>
                    <p className="text-white/40 text-xs">Market Cap</p>
                    <p className="text-white/90 font-medium">
                      ${token.market_cap > 1000000
                        ? `${(token.market_cap / 1000000).toFixed(2)}M`
                        : `${(token.market_cap / 1000).toFixed(1)}K`}
                    </p>
                  </div>

                  <div>
                    <p className="text-white/40 text-xs">24h Volume</p>
                    <p className="text-white/90 font-medium">
                      ${token.volume_24h > 1000
                        ? `${(token.volume_24h / 1000).toFixed(1)}K`
                        : token.volume_24h.toFixed(0)}
                    </p>
                  </div>

                  <div>
                    <p className="text-white/40 text-xs">Holders</p>
                    <p className="text-white/90 font-medium">{token.holders_count}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-2 text-xs text-white/60">
                  <span>Created {formatDistanceToNow(new Date(token.created_at), { addSuffix: true })}</span>

                  {token.post_id && (
                    <Link
                      href={`/post/${token.post_id}`}
                      className="flex items-center gap-1 hover:text-accent-blue transition-colors"
                    >
                      View Post <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
