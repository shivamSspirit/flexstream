'use client';

import { useState } from 'react';
import { useTradingHistory } from '@/hooks/useTradingHistory';
import { LoadingSpinner } from '@/components/ui/loading';
import { formatDistanceToNow, format } from 'date-fns';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowsRightLeftIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/solid';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

interface ActivityTabProps {
  userId?: string;
  walletAddress?: string;
}

export function ActivityTab({ userId, walletAddress }: ActivityTabProps) {
  const [page, setPage] = useState(0);
  const limit = 20;
  const offset = page * limit;

  const { data, isLoading, error } = useTradingHistory(userId, walletAddress, limit, offset);

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
          <p className="text-red-400">Failed to load trading history</p>
          <p className="text-white/60 text-sm mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!data || data.history.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-0">
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-12 sm:p-16 border-2 border-white/20 text-center">
          <div className="text-6xl mb-4">⚡</div>
          <p className="text-white/90 text-lg font-bold mb-2">No Activity Yet</p>
          <p className="text-white/60 text-sm">
            Your trades and transactions will appear here
          </p>
        </div>
      </div>
    );
  }

  const { history, summary, pagination } = data;

  const getTradeIcon = (type: string) => {
    switch (type) {
      case 'buy':
        return <ArrowUpIcon className="w-5 h-5 text-green-400" />;
      case 'sell':
        return <ArrowDownIcon className="w-5 h-5 text-red-400" />;
      case 'swap':
        return <ArrowsRightLeftIcon className="w-5 h-5 text-accent-blue" />;
      default:
        return null;
    }
  };

  const getTradeColor = (type: string) => {
    switch (type) {
      case 'buy':
        return 'text-green-400';
      case 'sell':
        return 'text-red-400';
      case 'swap':
        return 'text-accent-blue';
      default:
        return 'text-white/60';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
        <h3 className="text-white/60 text-sm mb-4">Trading Summary</h3>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <p className="text-white/40 text-xs mb-1">Total Trades</p>
            <p className="text-white text-2xl font-bold">{summary.total_trades}</p>
          </div>

          <div>
            <p className="text-white/40 text-xs mb-1">Buys</p>
            <p className="text-green-400 text-2xl font-bold">{summary.total_buys}</p>
          </div>

          <div>
            <p className="text-white/40 text-xs mb-1">Sells</p>
            <p className="text-red-400 text-2xl font-bold">{summary.total_sells}</p>
          </div>

          <div>
            <p className="text-white/40 text-xs mb-1">Total Volume</p>
            <p className="text-white text-2xl font-bold">
              {summary.total_volume_sol.toFixed(2)} SOL
            </p>
          </div>

          <div>
            <p className="text-white/40 text-xs mb-1">Fees Paid</p>
            <p className="text-white/60 text-2xl font-bold">
              {summary.total_fees_paid.toFixed(3)} SOL
            </p>
          </div>
        </div>
      </div>

      {/* Trade History */}
      <div className="space-y-2">
        {history.map((trade) => (
          <div
            key={trade.id}
            className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all"
          >
            <div className="flex items-start gap-4">
              {/* Trade Type Icon */}
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                {getTradeIcon(trade.trade_type)}
              </div>

              {/* Trade Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {/* Token Image if available */}
                    {trade.tokens?.image_uri && (
                      <div className="relative w-6 h-6 rounded overflow-hidden flex-shrink-0">
                        <Image
                          src={trade.tokens.image_uri}
                          alt={trade.tokens.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold capitalize ${getTradeColor(trade.trade_type)}`}>
                          {trade.trade_type}
                        </span>
                        <span className="text-white font-medium">
                          {trade.tokens?.display_name || trade.tokens?.name}
                        </span>
                        {trade.tokens?.is_verified && (
                          <CheckBadgeIcon className="w-4 h-4 text-accent-blue flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-white/60 text-xs">
                        ${trade.tokens?.symbol}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-white font-bold">
                      {trade.total_sol_amount.toFixed(4)} SOL
                    </p>
                    {trade.total_usd_value && (
                      <p className="text-white/60 text-xs">
                        ${trade.total_usd_value.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Trade Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-xs mb-2">
                  <div>
                    <span className="text-white/40">Quantity: </span>
                    <span className="text-white/90">{(trade.quantity / 1e6).toFixed(2)}</span>
                  </div>

                  <div>
                    <span className="text-white/40">Price: </span>
                    <span className="text-white/90">{trade.price_per_token.toFixed(6)} SOL</span>
                  </div>

                  <div>
                    <span className="text-white/40">Fee: </span>
                    <span className="text-white/90">{trade.fee_amount.toFixed(4)} SOL</span>
                  </div>

                  <div>
                    <span className="text-white/40">Status: </span>
                    <span className={`capitalize ${
                      trade.status === 'confirmed'
                        ? 'text-green-400'
                        : trade.status === 'failed'
                        ? 'text-red-400'
                        : 'text-yellow-400'
                    }`}>
                      {trade.status}
                    </span>
                  </div>
                </div>

                {/* Timestamp & Signature */}
                <div className="flex items-center gap-3 text-xs text-white/60">
                  <span>
                    {trade.block_time
                      ? formatDistanceToNow(new Date(trade.block_time), { addSuffix: true })
                      : formatDistanceToNow(new Date(trade.created_at), { addSuffix: true })}
                  </span>

                  <a
                    href={`https://solscan.io/tx/${trade.signature}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-accent-blue transition-colors"
                  >
                    View on Solscan <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination.total > limit && (
        <div className="flex items-center justify-between pt-4">
          <Button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            variant="outline"
            size="sm"
          >
            Previous
          </Button>

          <p className="text-white/60 text-sm">
            Showing {offset + 1}-{Math.min(offset + limit, pagination.total)} of {pagination.total}
          </p>

          <Button
            onClick={() => setPage(p => p + 1)}
            disabled={!pagination.hasMore}
            variant="outline"
            size="sm"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
