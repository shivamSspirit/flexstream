'use client';

import { useRouter } from 'next/navigation';
import { SimpleFeed } from '@/components/feed/SimpleFeed';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { FloatingWalletCTA } from '@/components/layout/FloatingWalletCTA';

export default function HomePage() {
  const router = useRouter();

  // Suggested follows - Zora style
  const suggestedFollows = [
    {
      id: '1',
      name: 'alabamabarker',
      username: 'alabamabarker',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop',
      verified: false
    },
    {
      id: '2',
      name: 'gabrielhaines',
      username: 'gabrielhaines',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      verified: false
    },
    {
      id: '3',
      name: 'goldenheartenergy',
      username: 'goldenheartenergy',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
      verified: false
    }
  ];

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

          {/* Right Sidebar - Suggested Follows - Hidden on mobile/tablet */}
          <aside className="hidden xl:block sticky top-20 h-fit space-y-6">
            {/* Suggested Follows Card */}
            <div className="card-base p-6">
              {/* Header */}
              <h3 className="text-white text-lg font-bold mb-6">
                Top Creators 🔥
              </h3>

              {/* Suggested Users List */}
              <div className="space-y-4">
                {suggestedFollows.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between group"
                  >
                    {/* User Info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar
                        className="h-12 w-12 cursor-pointer ring-2 ring-transparent hover:ring-accent-green/30 transition-all shrink-0"
                        onClick={() => router.push(`/profile/${user.username}`)}
                      >
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="bg-gradient-to-br from-accent-purple to-accent-pink text-white font-bold">
                          {user.name[0]}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => router.push(`/profile/${user.username}`)}
                          className="text-white text-sm font-bold hover:text-accent-green transition-colors truncate block text-left w-full"
                        >
                          {user.name}
                        </button>
                        <p className="text-text-muted text-xs">@{user.username}</p>
                      </div>
                    </div>

                    {/* Follow Button */}
                    <Button
                      className="bg-accent-green hover:bg-accent-green/90 text-black text-xs font-bold px-4 py-2 h-8 rounded-full transition-all hover:scale-105 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('Follow:', user.username);
                      }}
                    >
                      Follow
                    </Button>
                  </div>
                ))}
              </div>
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
