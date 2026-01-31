'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UniversalHeader } from '@/components/layout/UniversalHeader';
import { MinimalSidebar } from '@/components/layout/MinimalSidebar';
import { Button } from '@/components/ui/button';
import { StatCard, StatsGrid } from '@/components/ui/StatCard';
import { cn } from '@/lib/utils';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  UsersIcon,
  FireIcon,
  Bars3Icon,
  BoltIcon
} from '@heroicons/react/24/outline';
import { TrendingUp, TrendingDown, Activity, Zap, DollarSign, Users, BarChart3 } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const stats = [
    {
      label: '24h Volume',
      value: 2300000,
      change: 12.5,
      trend: 'up' as const,
      icon: DollarSign,
      glowColor: 'lime' as const,
    },
    {
      label: 'Active Traders',
      value: 15200,
      change: 8.2,
      trend: 'up' as const,
      icon: Users,
      glowColor: 'cyan' as const,
    },
    {
      label: 'Total Trades',
      value: 45800,
      change: 5.7,
      trend: 'up' as const,
      icon: BarChart3,
      glowColor: 'purple' as const,
    },
    {
      label: 'Hot Tokens',
      value: 128,
      change: -2.3,
      trend: 'down' as const,
      icon: Zap,
      glowColor: 'coral' as const,
    },
  ];

  const recentTrades = [
    { token: 'BONK', price: 0.000034, change: 12.5, volume: 2400000, time: '2m ago', isGain: true },
    { token: 'PEPE', price: 0.000012, change: 8.2, volume: 1800000, time: '5m ago', isGain: true },
    { token: 'WIF', price: 1.234, change: -3.1, volume: 3200000, time: '12m ago', isGain: false },
    { token: 'SAMO', price: 0.056, change: 15.7, volume: 890000, time: '18m ago', isGain: true },
    { token: 'POPCAT', price: 0.89, change: 22.4, volume: 1500000, time: '25m ago', isGain: true },
  ];

  const formatVolume = (vol: number) => {
    if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `$${(vol / 1000).toFixed(0)}K`;
    return `$${vol}`;
  };

  const formatPrice = (price: number) => {
    if (price < 0.001) return `$${price.toFixed(6)}`;
    if (price < 1) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-trading-screen" />
        <div className="absolute inset-0 bg-grid-glow opacity-20" />
      </div>

      {/* Minimal Sidebar */}
      <MinimalSidebar />

      {/* Main Content with Universal Header */}
      <div className="relative sm:pl-16 md:pl-20">
        {/* Universal Header */}
        <UniversalHeader
          onMenuClick={() => setMenuOpen(!menuOpen)}
          showWallet={true}
          showSearch={true}
        />

        {/* Dashboard Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Page Title with Live Indicator */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white font-display uppercase tracking-wide">
                Trading Dashboard
              </h1>
              <p className="text-white/40 text-sm font-mono mt-1">Real-time market overview</p>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <div className="live-indicator">
                LIVE
              </div>
              <Button
                onClick={() => router.push('/create')}
                className="btn-trade-buy"
              >
                <Zap size={14} />
                CREATE POST
              </Button>
            </div>
          </div>

          {/* Stats Grid - Bloomberg Style */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat) => (
              <StatCard
                key={stat.label}
                label={stat.label}
                value={stat.value}
                trendValue={stat.change}
                trend={stat.trend}
                icon={stat.icon}
                format={stat.label.includes('Volume') ? 'currency' : 'compact'}
                glowColor={stat.glowColor}
                animated={true}
              />
            ))}
          </div>

          {/* Recent Trades Table - Terminal Style */}
          <div className="trading-card overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-400/10 rounded-lg border border-cyan-400/30">
                  <Activity size={16} className="text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-white font-bold font-display uppercase tracking-wide">
                    Recent Trades
                  </h2>
                  <p className="text-white/40 text-xs font-mono">Live activity feed</p>
                </div>
              </div>
              <Button
                variant="ghost"
                className="text-xs text-white/40 hover:text-neon-lime font-mono uppercase"
              >
                View All →
              </Button>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-5 gap-4 px-4 py-3 border-b border-white/5 bg-terminal/50">
              <div className="text-white/40 text-xs uppercase tracking-wider font-display">Token</div>
              <div className="text-white/40 text-xs uppercase tracking-wider font-display text-right">Price</div>
              <div className="text-white/40 text-xs uppercase tracking-wider font-display text-right">24h</div>
              <div className="text-white/40 text-xs uppercase tracking-wider font-display text-right">Volume</div>
              <div className="text-white/40 text-xs uppercase tracking-wider font-display text-right">Action</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-white/5">
              {recentTrades.map((trade, index) => (
                <div
                  key={index}
                  className={cn(
                    'grid grid-cols-5 gap-4 px-4 py-3 items-center',
                    'hover:bg-white/[0.02] transition-colors cursor-pointer group'
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Token */}
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm',
                      'bg-gradient-to-br',
                      index === 0 && 'from-gold to-amber-600 text-black',
                      index === 1 && 'from-purple-500 to-pink-500 text-white',
                      index === 2 && 'from-cyan-400 to-blue-500 text-black',
                      index === 3 && 'from-neon-lime to-green-500 text-black',
                      index === 4 && 'from-coral-400 to-red-500 text-white',
                    )}>
                      {trade.token[0]}
                    </div>
                    <div>
                      <div className="text-white font-semibold text-sm group-hover:text-neon-lime transition-colors">
                        {trade.token}
                      </div>
                      <div className="text-white/30 text-xs font-mono">{trade.time}</div>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-right">
                    <div className="text-white font-mono font-semibold text-sm">
                      {formatPrice(trade.price)}
                    </div>
                  </div>

                  {/* 24h Change */}
                  <div className="text-right">
                    <div className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold font-mono',
                      trade.isGain
                        ? 'bg-gain/10 text-gain'
                        : 'bg-loss/10 text-loss'
                    )}>
                      {trade.isGain ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {trade.isGain ? '+' : ''}{trade.change.toFixed(1)}%
                    </div>
                  </div>

                  {/* Volume */}
                  <div className="text-right">
                    <div className="text-cyan-400 font-mono font-semibold text-sm">
                      {formatVolume(trade.volume)}
                    </div>
                  </div>

                  {/* Action */}
                  <div className="text-right">
                    <Button
                      className={cn(
                        'h-7 px-3 text-[10px] font-bold font-mono',
                        'bg-gain/10 text-gain border border-gain/30',
                        'hover:bg-gain/20 hover:border-gain/50',
                        'opacity-0 group-hover:opacity-100 transition-all'
                      )}
                    >
                      TRADE
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div
              className="trading-card p-5 cursor-pointer group hover:border-neon-lime/30"
              onClick={() => router.push('/explore')}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-neon-lime/10 rounded-lg border border-neon-lime/30 group-hover:shadow-glow-lime transition-all">
                  <FireIcon className="w-5 h-5 text-neon-lime" />
                </div>
                <h3 className="text-white font-bold font-display uppercase tracking-wide">
                  Explore
                </h3>
              </div>
              <p className="text-white/40 text-sm">Discover trending tokens and creators</p>
            </div>

            <div
              className="trading-card p-5 cursor-pointer group hover:border-cyan-400/30"
              onClick={() => router.push('/leaderboard')}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-cyan-400/10 rounded-lg border border-cyan-400/30 group-hover:shadow-glow-cyan transition-all">
                  <ChartBarIcon className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-white font-bold font-display uppercase tracking-wide">
                  Leaderboard
                </h3>
              </div>
              <p className="text-white/40 text-sm">See top traders and creators</p>
            </div>

            <div
              className="trading-card p-5 cursor-pointer group hover:border-gold/30"
              onClick={() => router.push('/profile')}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-gold/10 rounded-lg border border-gold/30 group-hover:shadow-glow-gold transition-all">
                  <UsersIcon className="w-5 h-5 text-gold" />
                </div>
                <h3 className="text-white font-bold font-display uppercase tracking-wide">
                  Profile
                </h3>
              </div>
              <p className="text-white/40 text-sm">View your stats and holdings</p>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 md:hidden"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="absolute right-0 top-0 bottom-0 w-72 bg-terminal border-l border-white/10 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-white font-bold text-lg font-display uppercase">Menu</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMenuOpen(false)}
                className="text-white/40 hover:text-white"
              >
                <Bars3Icon className="w-6 h-6" />
              </Button>
            </div>

            <nav className="space-y-2">
              {[
                { label: 'Dashboard', path: '/dashboard', icon: BarChart3 },
                { label: 'Explore', path: '/explore', icon: FireIcon },
                { label: 'Leaderboard', path: '/leaderboard', icon: ChartBarIcon },
                { label: 'Profile', path: '/profile', icon: UsersIcon },
                { label: 'Settings', path: '/settings', icon: BoltIcon },
              ].map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    router.push(item.path);
                    setMenuOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg',
                    'text-white/60 hover:text-neon-lime hover:bg-neon-lime/10',
                    'transition-all font-medium'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
