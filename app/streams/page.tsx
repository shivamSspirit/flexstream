'use client';

import React from 'react';
import { PumpFunLiveStream } from '@/types';
import { EnhancedLiveStreamCard } from '@/components/pump-fun/EnhancedLiveStreamCard';
import { PaginationControls } from '@/components/pump-fun/PaginationControls';
import { usePaginatedLiveStreams } from '@/lib/hooks/usePaginatedLiveStreams';

export default function StreamsPage() {
  const {
    streams,
    pagination,
    loading,
    error,
    goToPage,
    nextPage,
    prevPage,
    refresh
  } = usePaginatedLiveStreams(1, 10, true, true);

  // Console log the first coin data for debugging
  React.useEffect(() => {
    if (streams.length > 0) {
      console.log('🔍 [BROWSER] Complete first coin data structure:');
      console.log('📊 [BROWSER] Token:', streams[0].token);
      console.log('👤 [BROWSER] Streamer:', streams[0].streamer);
      console.log('📺 [BROWSER] Stream Info:', streams[0].stream_info);
      console.log('📈 [BROWSER] Trading Activity:', streams[0].trading_activity);
      console.log('🏷️ [BROWSER] Metadata:', streams[0].metadata);
      console.log('🔗 [BROWSER] Social Links:', streams[0].social_links);
      console.log('📊 [BROWSER] All streams count:', streams.length);
      console.log('📄 [BROWSER] Pagination info:', pagination);
    }
  }, [streams, pagination]);

  const handleWatchStream = (stream: PumpFunLiveStream) => {
    console.log('Watching stream:', stream);
    // Implement stream watching logic here
  };

  const handleViewToken = (mint: string) => {
    window.open(`https://pump.fun/coin/${mint}`, '_blank');
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Live Streams</h1>
            <p className="text-gray-400">Real-time Pump.fun trading streams with live market data</p>
          </div>
          <div className="text-red-400 text-xl">Error: {error}</div>
          <button 
            onClick={refresh}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Live Streams</h1>
          <p className="text-gray-400">Real-time Pump.fun trading streams with live market data</p>
          
          {/* Pagination Info */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-green-400">
              ✅ Showing {streams.length} streams (Page {pagination.currentPage} of {pagination.totalPages})
            </div>
            <div className="text-gray-400 text-sm">
              Total: {pagination.totalCoins} streams available
            </div>
          </div>
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
              <div className="text-white">Loading streams...</div>
            </div>
          </div>
        )}
        
        {/* Streams Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {streams.map((stream) => (
            <EnhancedLiveStreamCard
              key={stream.token.mint}
              stream={stream}
              onWatchStream={handleWatchStream}
              onViewToken={handleViewToken}
            />
          ))}
        </div>

        {/* Pagination Controls */}
        <PaginationControls
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          hasNextPage={pagination.hasNextPage}
          hasPrevPage={pagination.hasPrevPage}
          onPageChange={goToPage}
          isLoading={loading}
        />

        {/* Quick Navigation */}
        <div className="mt-6 flex items-center justify-center space-x-4">
          <button
            onClick={prevPage}
            disabled={!pagination.hasPrevPage || loading}
            className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous Page
          </button>
          
          <span className="text-gray-400">
            {pagination.currentPage} / {pagination.totalPages}
          </span>
          
          <button
            onClick={nextPage}
            disabled={!pagination.hasNextPage || loading}
            className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next Page
          </button>
        </div>
      </div>
    </div>
  );
}
