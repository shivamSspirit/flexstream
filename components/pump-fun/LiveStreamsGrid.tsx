'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { LiveStreamCard } from './LiveStreamCard';
import { LiveStreamSorting } from './LiveStreamSorting';
import { usePumpFunLiveStreams } from '@/lib/hooks/usePumpFunLiveStreams';
import { PumpFunStreamFilter, PumpFunLiveStream } from '@/types';
import { SortOption, sortLiveStreams, getDefaultSortOption } from '@/lib/sorting';
import { 
  SignalIcon, 
  ExclamationTriangleIcon,
  ArrowPathIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

interface LiveStreamsGridProps {
  onWatchStream?: (stream: PumpFunLiveStream) => void;
  onViewToken?: (mint: string) => void;
}

export function LiveStreamsGrid({ onWatchStream, onViewToken }: LiveStreamsGridProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const [filters, setFilters] = useState<PumpFunStreamFilter>({});
  const [sortOption, setSortOption] = useState<SortOption>(getDefaultSortOption());
  const { ToastContainer } = useToast();

  const {
    liveStreams,
    realTimeData,
    isLoading,
    error,
    isConnected,
    isAuthenticated,
    refetch,
  } = usePumpFunLiveStreams(filters);

  // Sort streams based on selected criteria
  const sortedStreams = sortLiveStreams(liveStreams || [], sortOption);

  // Show loading state while checking authentication
  if (!isLoaded || isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <SignalIcon className="w-6 h-6 text-green-400" />
            <h2 className="text-2xl font-bold text-white">Live Streams</h2>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-sm">Loading...</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white/5 backdrop-blur-md border-white/10 rounded-lg p-6 animate-pulse">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                <div className="space-y-2">
                  <div className="w-24 h-4 bg-gray-700 rounded"></div>
                  <div className="w-16 h-3 bg-gray-700 rounded"></div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="w-full h-4 bg-gray-700 rounded"></div>
                <div className="w-3/4 h-4 bg-gray-700 rounded"></div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-8 bg-gray-700 rounded"></div>
                  <div className="h-8 bg-gray-700 rounded"></div>
                  <div className="h-8 bg-gray-700 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show authentication required state
  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <LockClosedIcon className="w-16 h-16 text-gray-600 mx-auto mb-6" />
        <h3 className="text-2xl font-bold text-white mb-4">
          Authentication Required
        </h3>
        <p className="text-gray-400 mb-6 max-w-md mx-auto">
          Please sign in to access live Pump.fun trading streams and real-time market data.
        </p>
        <Button
          onClick={() => window.location.href = '/auth/signin'}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3"
        >
          Sign In to Continue
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">
          Failed to load live streams
        </h3>
        <p className="text-gray-400 mb-4">
          {error instanceof Error ? error.message : 'An unknown error occurred'}
        </p>
        <button
          onClick={() => refetch()}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 mx-auto"
        >
          <ArrowPathIcon className="w-4 h-4" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <SignalIcon className="w-6 h-6 text-green-400" />
          <h2 className="text-2xl font-bold text-white">Live Streams</h2>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className={`text-sm ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
              {isConnected ? 'Real-time' : 'Disconnected'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-gray-400 text-sm">
            {sortedStreams.length} active streams
          </div>
          <button
            onClick={() => refetch()}
            className="text-gray-400 hover:text-white transition-colors"
            title="Refresh data"
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Sorting */}
      <LiveStreamSorting 
        currentSort={sortOption}
        onSortChange={setSortOption}
        totalStreams={sortedStreams.length}
      />

      {/* Quick Stats */}
      {sortedStreams.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">
              {sortedStreams.length}
            </div>
            <div className="text-gray-400 text-sm">Total Streams</div>
          </div>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">
              ${(sortedStreams.reduce((sum, stream) => sum + (stream.trading_activity?.market_cap || 0), 0) / 1000000).toFixed(1)}M
            </div>
            <div className="text-gray-400 text-sm">Total Market Cap</div>
          </div>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">
              ${(sortedStreams.reduce((sum, stream) => sum + (stream.trading_activity?.total_volume_24h || 0), 0) / 1000000).toFixed(1)}M
            </div>
            <div className="text-gray-400 text-sm">Total 24h Volume</div>
          </div>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">
              {sortedStreams.reduce((sum, stream) => sum + (stream.stream_info?.viewer_count || 0), 0).toLocaleString()}
            </div>
            <div className="text-gray-400 text-sm">Total Viewers</div>
          </div>
        </div>
      )}

      {/* Live Streams Grid */}
      {sortedStreams.length === 0 ? (
        <div className="text-center py-12">
          <SignalIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            No live streams found
          </h3>
          <p className="text-gray-400">
            Try adjusting your filters or check back later for new streams.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedStreams.map((stream) => (
            <LiveStreamCard
              key={`${stream.token.mint}-${stream.streamer.wallet_address}`}
              stream={stream}
              onWatchStream={onWatchStream}
              onViewToken={onViewToken}
            />
          ))}
        </div>
      )}

      {/* Real-time data indicator */}
      {realTimeData.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-green-500/20 backdrop-blur-md border border-green-500/30 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-300 text-sm font-medium">
              {realTimeData.length} real-time updates
            </span>
          </div>
        </div>
      )}
      
      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
}
