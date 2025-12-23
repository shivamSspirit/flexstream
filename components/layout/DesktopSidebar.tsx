'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useWallet } from '@jup-ag/wallet-adapter';
import { useQuery } from '@tanstack/react-query';
import { Home, Search, Plus, User, TrendingUp, Users, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function DesktopSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { publicKey, connected } = useWallet();

  // Fetch current user data
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser', publicKey?.toBase58()],
    queryFn: async () => {
      if (!publicKey) return null;
      const response = await fetch(`/api/users/by-wallet?wallet=${publicKey.toBase58()}`);
      if (!response.ok) return null;
      const result = await response.json();
      return result.success ? result.data : null;
    },
    enabled: !!publicKey && connected,
    refetchOnWindowFocus: true,
    staleTime: 1000,
  });

  const navItems = [
    { icon: Home, label: 'Home', path: '/', active: pathname === '/' },
    { icon: Search, label: 'Explore', path: '/explore', active: pathname === '/explore' },
    { icon: Plus, label: 'Create', path: '/create', active: pathname === '/create' },
    { icon: TrendingUp, label: 'Leaderboard', path: '/leaderboard', active: pathname === '/leaderboard' },
    { icon: Users, label: 'Discover', path: '/discover', active: pathname === '/discover' },
    { icon: User, label: 'Profile', path: currentUser?.username ? `/profile/${currentUser.username}` : '/profile/edit', active: pathname.startsWith('/profile') },
    { icon: Settings, label: 'Settings', path: '/settings', active: pathname === '/settings' },
  ];

  return (
    <aside className="hidden lg:block fixed left-0 top-16 bottom-0 w-64 bg-app-bg border-r border-white/10 overflow-y-auto">
      <div className="p-4 space-y-2">
        {navItems.map((item) => (
          <Button
            key={item.path}
            variant="ghost"
            onClick={() => router.push(item.path)}
            className={`w-full justify-start ${
              item.active
                ? 'bg-purple-600/20 text-purple-400 border-l-2 border-purple-400'
                : 'text-secondary hover:text-primary hover:bg-card-bg transition-colors'
            }`}
          >
            <item.icon className="h-5 w-5 mr-3" />
            {item.label}
            {item.label === 'Leaderboard' && (
              <Badge variant="secondary" className="ml-auto text-xs">
                Hot
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Trending Hashtags */}
      <div className="p-4 border-t border-white/10">
        <h3 className="text-sm font-semibold text-primary mb-3">Trending</h3>
        <div className="space-y-2">
          {['#pumpfun', '#solana', '#trading', '#earnings', '#crypto'].map((hashtag) => (
            <button
              key={hashtag}
              onClick={() => router.push(`/search?q=${hashtag}`)}
              className="block w-full text-left text-sm text-secondary hover:text-link-blue transition-colors"
            >
              {hashtag}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="p-4 border-t border-white/10">
        <h3 className="text-sm font-semibold text-primary mb-3">Quick Stats</h3>
        <div className="space-y-2 text-sm text-secondary">
          <div className="flex justify-between">
            <span>Active Users</span>
            <span className="text-metric-green">1.2K</span>
          </div>
          <div className="flex justify-between">
            <span>Posts Today</span>
            <span className="text-link-blue">456</span>
          </div>
          <div className="flex justify-between">
            <span>Total Earnings</span>
            <span className="text-purple-400">$2.3M</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
