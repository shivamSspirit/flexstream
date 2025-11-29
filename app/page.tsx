'use client';

import { useRouter } from 'next/navigation';
import { SimpleFeed } from '@/components/feed/SimpleFeed';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { FloatingWalletCTA } from '@/components/layout/FloatingWalletCTA';
import { useTopCreators } from '@/hooks/useTopCreators';
import { useWallet } from '@jup-ag/wallet-adapter';

export default function HomePage() {
  const router = useRouter();
  const { connected } = useWallet();

  // Fetch real top creators from Supabase
  const { data: creatorsData, isLoading: creatorsLoading } = useTopCreators(5);

  return (
    <AppLayout showWallet={true} showSearch={true}>
      {/* Floating Wallet CTA for anonymous users */}
      <FloatingWalletCTA />

      {/* Mobile-First Responsive Layout */}
      <div className="w-full max-w-[1600px] mx-auto pb-20 md:pb-6 lg:pb-8">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_600px_340px] gap-0 xl:gap-12">
          {/* Left spacer - Desktop only */}
          <div className="hidden xl:block"></div>

          {/* Main Feed - Mobile-first, then fixed width on XL */}
          <div className="w-full">
            <SimpleFeed />
          </div>

          {/* Right Sidebar - Top Creators - Hidden on mobile/tablet */}
          <aside className="hidden xl:block sticky top-20 h-fit space-y-6">
            {/* Top Creators Card */}
            <div className="card-base p-6">
              {/* Header */}
              <h3 className="text-white text-lg font-bold mb-6">
                Top Creators 🔥
              </h3>

              {/* Loading State */}
              {creatorsLoading && (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="h-12 w-12 bg-white/10 rounded-full shrink-0"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-24 bg-white/10 rounded"></div>
                        <div className="h-3 w-16 bg-white/10 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Real Creators List */}
              {!creatorsLoading && creatorsData?.data?.creators && creatorsData.data.creators.length > 0 && (
                <div className="space-y-4">
                  {creatorsData.data.creators.map((creator) => (
                    <div
                      key={creator.id}
                      className="flex items-center justify-between group"
                    >
                      {/* User Info */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar
                          className="h-12 w-12 cursor-pointer ring-2 ring-transparent hover:ring-accent-green/30 transition-all shrink-0"
                          onClick={() => router.push(`/profile/${creator.username}`)}
                        >
                          {creator.avatar_url && <AvatarImage src={creator.avatar_url} alt={creator.display_name} />}
                          <AvatarFallback className="bg-gradient-to-br from-accent-purple to-accent-pink text-white font-bold">
                            {creator.display_name[0]?.toUpperCase() || creator.username[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <button
                            onClick={() => router.push(`/profile/${creator.username}`)}
                            className="text-white text-sm font-bold hover:text-accent-green transition-colors truncate block text-left w-full"
                          >
                            {creator.display_name}
                          </button>
                          <p className="text-text-muted text-xs">
                            {creator.post_count} post{creator.post_count !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>

                      {/* View Profile Button */}
                      <Button
                        className="bg-accent-green hover:bg-accent-green/90 text-black text-xs font-bold px-4 py-2 h-8 rounded-full transition-all hover:scale-105 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/profile/${creator.username}`);
                        }}
                      >
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty State with Viral CTA - Nikita Bier Strategy */}
              {!creatorsLoading && (!creatorsData?.data?.creators || creatorsData.data.creators.length === 0) && (
                <div className="text-center py-6">
                  <div className="text-4xl mb-3">👻</div>
                  <p className="text-white text-sm font-semibold mb-2">
                    No one&apos;s here yet
                  </p>
                  <p className="text-text-muted text-xs mb-4">
                    Be the first to create and get featured
                  </p>
                  {connected && (
                    <Button
                      onClick={() => router.push('/create')}
                      className="w-full bg-accent-green hover:bg-accent-green/90 text-black font-bold text-xs py-2 rounded-full transition-all hover:scale-105"
                    >
                      Create First Post
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Earnings Promo Card */}
            <div className="relative overflow-hidden rounded-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-accent-green via-accent-cyan to-accent-blue blur-xl opacity-30"></div>
              <div className="relative card-base p-6 text-center">
                <div className="text-3xl font-black mb-3 bg-gradient-to-r from-accent-green via-accent-cyan to-accent-blue bg-clip-text text-transparent">
                  Start Earning
                </div>
                <p className="text-text-muted text-sm mb-4 leading-relaxed">
                  Share your flexes and get paid when people buy your coins
                </p>
                <Button
                  onClick={() => router.push('/create')}
                  className="w-full bg-gradient-to-r from-accent-green via-accent-cyan to-accent-blue hover:from-accent-green/90 hover:via-accent-cyan/90 hover:to-accent-blue/90 text-black font-black py-3 text-sm rounded-xl transition-all hover:scale-105 shadow-lg"
                >
                  Create Your First Post
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}
