'use client';

import { useRouter } from 'next/navigation';
import { SimpleFeed } from '@/components/feed/SimpleFeed';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

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
      {/* Zora Exact Layout: Three column grid */}
      <div className="grid grid-cols-[1fr_600px_340px] gap-12 max-w-[1600px] mx-auto px-8 pb-20 md:pb-0">
        {/* Left spacer */}
        <div className="hidden xl:block"></div>

        {/* Main Feed - 600px fixed width like Zora */}
        <div className="w-full">
          <SimpleFeed />
        </div>

        {/* Right Sidebar - Suggested Follows - 340px fixed */}
        <aside className="hidden xl:block sticky top-24 h-fit">
          <div className="bg-transparent">
            {/* Header */}
            <h3 className="text-white/70 text-base font-normal mb-6">
              Suggested follows
            </h3>

            {/* Suggested Users List */}
            <div className="space-y-5">
              {suggestedFollows.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between group"
                >
                  {/* User Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar
                      className="h-12 w-12 cursor-pointer ring-0 transition-opacity hover:opacity-80"
                      onClick={() => router.push(`/profile/${user.username}`)}
                    >
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white font-semibold">
                        {user.name[0]}
                      </AvatarFallback>
                    </Avatar>

                    <button
                      onClick={() => router.push(`/profile/${user.username}`)}
                      className="text-white text-base font-normal hover:opacity-70 transition-opacity truncate text-left"
                    >
                      {user.name}
                    </button>
                  </div>

                  {/* Follow Button - Zora Style */}
                  <Button
                    className="bg-white hover:bg-white/90 text-black text-sm font-semibold px-6 py-2 h-9 rounded-full transition-all"
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

            {/* Trader Rewards Card - Zora Style Promo */}
            <div className="mt-8 rounded-2xl overflow-hidden bg-gradient-to-br from-pink-500 via-lime-400 to-pink-500 p-[2px]">
              <div className="bg-black rounded-2xl p-6 text-center">
                <div className="text-4xl font-black mb-3 bg-gradient-to-r from-pink-400 via-lime-300 to-pink-400 bg-clip-text text-transparent">
                  Token Rewards
                </div>
                <p className="text-white/80 text-sm mb-4">
                  Trade tokens and earn rewards
                </p>
                <Button
                  onClick={() => router.push('/leaderboard')}
                  className="w-full bg-white hover:bg-white/90 text-black font-bold py-3 rounded-xl transition-all"
                >
                  View Leaderboard
                </Button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </AppLayout>
  );
}
