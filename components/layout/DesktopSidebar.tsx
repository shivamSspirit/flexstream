'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useWallet } from '@/hooks/useWalletCompat';
import { useUser } from '@/contexts/UserContext';
import {
  Home,
  Search,
  Plus,
  User,
  TrendingUp,
  Settings,
  Zap,
  Activity,
  Trophy,
  Flame,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Logo } from './Logo';

export function DesktopSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { publicKey } = useWallet();

  // Use global user context instead of independent fetch
  const { user: currentUser } = useUser();

  // Get the correct profile URL - always use wallet address as the source of truth
  const getProfileUrl = () => {
    if (!publicKey) return '/profile';
    return `/profile/${publicKey.toBase58()}`;
  };

  const navItems = [
    { icon: Home, label: 'Home', path: '/', active: pathname === '/' },
    { icon: Search, label: 'Explore', path: '/explore', active: pathname === '/explore' },
    { icon: Plus, label: 'Create', path: '/create', active: pathname === '/create', highlight: true },
    { icon: Trophy, label: 'Leaderboard', path: '/leaderboard', active: pathname === '/leaderboard', badge: 'HOT' },
    { icon: BarChart3, label: 'Dashboard', path: '/dashboard', active: pathname === '/dashboard' },
    { icon: User, label: 'Profile', path: getProfileUrl(), active: pathname.startsWith('/profile') },
    { icon: Settings, label: 'Settings', path: '/settings', active: pathname === '/settings' },
  ];

  // Mock trending data - replace with real data
  const trendingTokens = [
    { symbol: 'BONK', price: '$0.000034', change: '+12.5%', isUp: true },
    { symbol: 'WIF', price: '$1.234', change: '-3.1%', isUp: false },
    { symbol: 'PEPE', price: '$0.000012', change: '+8.2%', isUp: true },
  ];

  const trendingHashtags = [
    { tag: '#solana', count: '2.4K' },
    { tag: '#trading', count: '1.8K' },
    { tag: '#pumpfun', count: '1.2K' },
    { tag: '#crypto', count: '956' },
  ];

  // Mock quick stats - replace with real data
  const quickStats = {
    activeUsers: 1247,
    postsToday: 456,
    totalVolume: 2.3,
  };

  return (
    <aside className={cn(
      'hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-64',
      'bg-terminal border-r border-white/10',
      'overflow-hidden'
    )}>
      {/* Logo Section */}
      <div className="p-4 border-b border-white/10">
        <Logo size="lg" showText={true} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => (
          <Button
            key={item.path}
            variant="ghost"
            onClick={() => router.push(item.path)}
            className={cn(
              'w-full justify-start gap-3 h-10 px-3 rounded-lg',
              'font-medium text-sm transition-all duration-150',
              item.active
                ? 'bg-neon-lime/10 text-neon-lime border border-neon-lime/30'
                : 'text-white/60 hover:text-white hover:bg-white/5',
              item.highlight && !item.active && 'text-gain hover:text-gain'
            )}
          >
            <item.icon className={cn(
              'h-4 w-4',
              item.active && 'text-neon-lime',
              item.highlight && !item.active && 'text-gain'
            )} />
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge && (
              <span className={cn(
                'px-1.5 py-0.5 text-[9px] font-bold font-mono rounded',
                'bg-coral-400/20 text-coral-400 border border-coral-400/30',
                'animate-pulse'
              )}>
                {item.badge}
              </span>
            )}
          </Button>
        ))}
      </nav>

      {/* Trending Tokens Section */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1 bg-gain/10 rounded border border-gain/30">
            <TrendingUp size={10} className="text-gain" />
          </div>
          <h3 className="text-white/60 text-[10px] uppercase tracking-wider font-bold">
            Trending Tokens
          </h3>
          <div className="live-indicator text-[8px] py-0 px-1.5 ml-auto">
            LIVE
          </div>
        </div>

        <div className="space-y-1.5">
          {trendingTokens.map((token, idx) => (
            <div
              key={token.symbol}
              className={cn(
                'flex items-center justify-between p-2 rounded-lg cursor-pointer',
                'bg-white/[0.02] hover:bg-white/[0.05]',
                'border border-transparent hover:border-white/10',
                'transition-all duration-150 group'
              )}
              onClick={() => router.push(`/explore?token=${token.symbol}`)}
            >
              <div className="flex items-center gap-2">
                <div className={cn(
                  'w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold',
                  idx === 0 && 'bg-gradient-to-br from-gold to-amber-600 text-black',
                  idx === 1 && 'bg-gradient-to-br from-purple-500 to-pink-500 text-white',
                  idx === 2 && 'bg-gradient-to-br from-cyan-400 to-blue-500 text-black'
                )}>
                  {token.symbol[0]}
                </div>
                <div>
                  <p className="text-white text-xs font-semibold group-hover:text-neon-lime transition-colors">
                    {token.symbol}
                  </p>
                  <p className="text-white/30 text-[10px] font-mono">{token.price}</p>
                </div>
              </div>
              <span className={cn(
                'text-[10px] font-bold font-mono px-1.5 py-0.5 rounded',
                token.isUp
                  ? 'bg-gain/10 text-gain'
                  : 'bg-loss/10 text-loss'
              )}>
                {token.change}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Trending Hashtags */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1 bg-purple-400/10 rounded border border-purple-400/30">
            <Flame size={10} className="text-purple-400" />
          </div>
          <h3 className="text-white/60 text-[10px] uppercase tracking-wider font-bold">
            Hot Tags
          </h3>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {trendingHashtags.map((hashtag) => (
            <button
              key={hashtag.tag}
              onClick={() => router.push(`/explore?q=${hashtag.tag}`)}
              className={cn(
                'px-2 py-1 rounded text-[10px] font-mono',
                'bg-white/5 hover:bg-purple-400/10',
                'text-white/50 hover:text-purple-400',
                'border border-transparent hover:border-purple-400/30',
                'transition-all duration-150'
              )}
            >
              {hashtag.tag}
              <span className="ml-1 text-white/30">{hashtag.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1 bg-cyan-400/10 rounded border border-cyan-400/30">
            <Activity size={10} className="text-cyan-400" />
          </div>
          <h3 className="text-white/60 text-[10px] uppercase tracking-wider font-bold">
            Platform Stats
          </h3>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-white/[0.02] rounded-lg border border-white/5">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <div className="w-1 h-1 rounded-full bg-gain animate-pulse" />
              <span className="text-gain text-sm font-bold font-mono">
                {quickStats.activeUsers.toLocaleString()}
              </span>
            </div>
            <p className="text-white/30 text-[8px] uppercase tracking-wider">Active</p>
          </div>

          <div className="text-center p-2 bg-white/[0.02] rounded-lg border border-white/5">
            <span className="text-cyan-400 text-sm font-bold font-mono block mb-0.5">
              {quickStats.postsToday}
            </span>
            <p className="text-white/30 text-[8px] uppercase tracking-wider">Posts</p>
          </div>

          <div className="text-center p-2 bg-white/[0.02] rounded-lg border border-white/5">
            <span className="text-gold text-sm font-bold font-mono block mb-0.5">
              ${quickStats.totalVolume}M
            </span>
            <p className="text-white/30 text-[8px] uppercase tracking-wider">Vol</p>
          </div>
        </div>
      </div>

      {/* Create CTA - Sticky at bottom */}
      <div className="p-3 border-t border-white/10 bg-terminal">
        <Button
          onClick={() => router.push('/create')}
          className="btn-trade-buy w-full gap-2"
        >
          <Zap size={14} />
          CREATE POST
        </Button>
      </div>
    </aside>
  );
}
