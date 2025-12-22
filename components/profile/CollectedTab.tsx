'use client';

import { useHoldings } from '@/hooks/useHoldings';
import { LoadingSpinner } from '@/components/ui/loading';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/solid';

interface CollectedTabProps {
  userId?: string;
  walletAddress?: string;
}

export function CollectedTab({ userId, walletAddress }: CollectedTabProps) {
  const { data, isLoading, error } = useHoldings(userId, walletAddress);

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
          <p className="text-red-400">Failed to load holdings</p>
          <p className="text-white/60 text-sm mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!data || data.holdings.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-0">
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-12 sm:p-16 border-2 border-white/20 text-center">
          <div className="text-6xl mb-4">📂</div>
          <p className="text-white/90 text-lg font-bold mb-2">No Tokens Collected Yet</p>
          <p className="text-white/60 text-sm">
            Buy tokens from other creators to see them here
          </p>
        </div>
      </div>
    );
  }

  const { holdings, summary } = data;

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <div className="bg-gradient-to-br from-accent-purple/20 to-accent-blue/20 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
        <h3 className="text-white/60 text-sm mb-4">Portfolio Value</h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div>
            <p className="text-white/60 text-xs mb-1">Total Value</p>
            <p className="text-white text-3xl font-bold">
              {summary.total_value_sol.toFixed(2)} SOL
            </p>
            <p className="text-white/60 text-sm">
              ${summary.total_value_usd.toFixed(2)}
            </p>
          </div>

          <div>
            <p className="text-white/60 text-xs mb-1">Total Invested</p>
            <p className="text-white text-3xl font-bold">
              {summary.total_invested.toFixed(2)} SOL
            </p>
          </div>

          <div>
            <p className="text-white/60 text-xs mb-1">Total P&L</p>
            <div className="flex items-baseline gap-2">
              <p className={`text-3xl font-bold ${
                summary.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {summary.total_pnl >= 0 ? '+' : ''}{summary.total_pnl.toFixed(2)} SOL
              </p>
              {summary.total_pnl_percentage !== 0 && (
                <span className={`flex items-center gap-1 text-sm ${
                  summary.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {summary.total_pnl >= 0 ? (
                    <ArrowTrendingUpIcon className="w-4 h-4" />
                  ) : (
                    <ArrowTrendingDownIcon className="w-4 h-4" />
                  )}
                  {Math.abs(summary.total_pnl_percentage).toFixed(1)}%
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-white/40 text-xs">Holdings</p>
              <p className="text-white/90 font-medium">{summary.total_holdings}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs">Unrealized P&L</p>
              <p className={`font-medium ${
                summary.total_unrealized_pnl >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {summary.total_unrealized_pnl >= 0 ? '+' : ''}{summary.total_unrealized_pnl.toFixed(2)} SOL
              </p>
            </div>
            <div>
              <p className="text-white/40 text-xs">Realized P&L</p>
              <p className={`font-medium ${
                summary.total_realized_pnl >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {summary.total_realized_pnl >= 0 ? '+' : ''}{summary.total_realized_pnl.toFixed(2)} SOL
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Holdings List */}
      <div className="space-y-3">
        {holdings.map((holding) => (
          <div
            key={holding.token_id}
            className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all group"
          >
            <div className="flex items-start gap-4">
              {/* Token Image */}
              <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                {holding.image_uri ? (
                  <Image
                    src={holding.image_uri}
                    alt={holding.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-accent-purple/20 to-accent-blue/20 flex items-center justify-center">
                    <span className="text-2xl">{holding.symbol.charAt(0)}</span>
                  </div>
                )}
              </div>

              {/* Holding Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-white font-bold truncate">{holding.display_name || holding.name}</h3>
                  {holding.is_verified && (
                    <CheckBadgeIcon className="w-4 h-4 text-accent-blue flex-shrink-0" />
                  )}
                  <span className="text-white/60 text-sm">${holding.symbol}</span>
                </div>

                {/* Creator Info */}
                {holding.creator_username && (
                  <Link
                    href={`/profile/${holding.creator_username}`}
                    className="text-white/60 text-xs hover:text-accent-blue transition-colors mb-2 inline-block"
                  >
                    by @{holding.creator_username}
                  </Link>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-x-4 gap-y-2 text-sm mt-2">
                  <div>
                    <p className="text-white/40 text-xs">Quantity</p>
                    <p className="text-white/90 font-medium">
                      {(holding.quantity_owned / 1e6).toFixed(2)}
                    </p>
                  </div>

                  <div>
                    <p className="text-white/40 text-xs">Avg Cost</p>
                    <p className="text-white/90 font-medium">
                      {holding.average_cost_basis.toFixed(6)} SOL
                    </p>
                  </div>

                  <div>
                    <p className="text-white/40 text-xs">Current Price</p>
                    <p className="text-white/90 font-medium">
                      {holding.current_price_sol.toFixed(6)} SOL
                    </p>
                  </div>

                  <div>
                    <p className="text-white/40 text-xs">Value</p>
                    <p className="text-white/90 font-medium">
                      {holding.current_value_sol.toFixed(2)} SOL
                    </p>
                  </div>

                  <div>
                    <p className="text-white/40 text-xs">P&L</p>
                    <div className="flex items-center gap-1">
                      <p className={`font-bold ${
                        holding.unrealized_pnl_sol >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {holding.unrealized_pnl_sol >= 0 ? '+' : ''}{holding.unrealized_pnl_sol.toFixed(2)}
                      </p>
                      {holding.unrealized_pnl_percentage !== 0 && (
                        <span className={`text-xs ${
                          holding.unrealized_pnl_sol >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          ({holding.unrealized_pnl_percentage >= 0 ? '+' : ''}
                          {holding.unrealized_pnl_percentage.toFixed(1)}%)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Metadata */}
                <div className="flex items-center gap-3 mt-2 text-xs text-white/60">
                  <span>
                    Acquired {formatDistanceToNow(new Date(holding.first_acquired_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
