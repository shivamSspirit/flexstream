'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/hooks/useWalletCompat';
import { AppLayout } from '@/components/layout/AppLayout';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { generateMockLeaderboard, generateUserMockPosition, MockTrader } from '@/lib/mock-data/leaderboard-mock';
import { cn } from '@/lib/utils';
import {
  TrophyIcon,
  FireIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  CheckBadgeIcon,
  BoltIcon,
  SparklesIcon,
  ShareIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';
import {
  FireIcon as FireIconSolid,
  BoltIcon as BoltIconSolid
} from '@heroicons/react/24/solid';
import { TrendingUp, Zap, Activity, Crown, Medal } from 'lucide-react';

export default function LeaderboardPage() {
  const router = useRouter();
  const { publicKey } = useWallet();

  const [leaderboard, setLeaderboard] = useState<MockTrader[]>([]);
  const [userPosition, setUserPosition] = useState<ReturnType<typeof generateUserMockPosition> | null>(null);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'24h' | '7d' | '30d' | 'all'>('7d');
  const [visibleCount, setVisibleCount] = useState(20);
  const [pulseRank, setPulseRank] = useState<number | null>(null);

  useEffect(() => {
    const mockData = generateMockLeaderboard(100);
    setLeaderboard(mockData);
    const position = generateUserMockPosition(47);
    setUserPosition(position);

    const interval = setInterval(() => {
      if (position && position.user) {
        const nearbyRanks = [position.user.rank - 1, position.user.rank + 1];
        setPulseRank(nearbyRanks[Math.floor(Math.random() * nearbyRanks.length)]);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const timeframes = [
    { id: '24h', label: '24H', icon: ClockIcon, suffix: 'today' },
    { id: '7d', label: '7D', icon: FireIcon, suffix: 'this week' },
    { id: '30d', label: '30D', icon: TrophyIcon, suffix: 'this month' },
    { id: 'all', label: 'ALL', icon: ArrowTrendingUpIcon, suffix: 'all time' },
  ];

  const getTierConfig = (tier: string) => {
    const configs: Record<string, { color: string; badge: string; label: string; glowClass: string }> = {
      legend: { color: 'text-neon-lime', badge: '★', label: 'LEGEND', glowClass: 'shadow-glow-lime' },
      diamond: { color: 'text-cyan-400', badge: '◆', label: 'DIAMOND', glowClass: 'shadow-glow-cyan' },
      gold: { color: 'text-gold', badge: '●', label: 'GOLD', glowClass: 'shadow-glow-gold' },
      silver: { color: 'text-slate-300', badge: '○', label: 'SILVER', glowClass: '' },
      bronze: { color: 'text-coral-400', badge: '▲', label: 'BRONZE', glowClass: '' },
    };
    return configs[tier] || configs.bronze;
  };

  const loadMore = () => setVisibleCount(prev => Math.min(prev + 20, leaderboard.length));

  const getNearMissMessage = () => {
    if (!userPosition || !userPosition.user) return null;
    const rank = userPosition.user.rank;
    if (rank === 51) return "1 SPOT FROM TOP 50!";
    if (rank > 50 && rank <= 55) return `${rank - 50} SPOTS FROM TOP 50`;
    if (rank === 101) return "1 SPOT FROM TOP 100";
    if (rank > 100 && rank <= 110) return `${rank - 100} TO TOP 100`;
    if (rank <= 50) return "TOP 50 TRADER";
    if (rank <= 100) return "TOP 100 TRADER";
    return null;
  };

  const getDailyChallenge = () => ({
    title: "DAILY CHALLENGE",
    description: "Make 3 winning trades",
    progress: 1,
    total: 3,
    reward: "+5 RANKS"
  });

  const challenge = getDailyChallenge();
  const nearMissMsg = getNearMissMessage();
  const currentTimeframe = timeframes.find(tf => tf.id === selectedTimeframe);

  return (
    <AppLayout showWallet={true} showSearch={true}>
      {/* Trading Terminal Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-trading-screen" />
        <div className="absolute inset-0 bg-grid-glow opacity-20" />
      </div>

      <div className="relative pb-20 md:pb-6 -mx-4 sm:mx-0">
        {/* Header */}
        <div className="px-4 sm:px-0 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gold/10 rounded-lg border border-gold/30">
                <TrophyIcon className="w-6 h-6 text-gold" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white font-display uppercase tracking-wide">
                  Leaderboard
                </h1>
                <p className="text-white/40 text-sm font-mono">
                  <span className="text-neon-lime font-bold">{leaderboard.length}</span> traders {currentTimeframe?.suffix}
                </p>
              </div>
            </div>
            <div className="live-indicator text-[10px]">LIVE</div>
          </div>

          {/* FOMO Banner */}
          {userPosition && userPosition.user && nearMissMsg && (
            <div className={cn(
              'mb-4 p-3 trading-card border-gain/30',
              'animate-pulse'
            )}>
              <p className="text-center font-bold text-gain text-sm uppercase tracking-wider font-mono">
                {nearMissMsg}
              </p>
            </div>
          )}

          {/* User Rank + Challenge Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* YOUR RANK */}
            {userPosition && userPosition.user && (
              <div className="trading-card p-4 border-neon-lime/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn(
                    'px-4 py-2 rounded-lg font-mono font-bold text-lg',
                    'bg-gain text-black'
                  )}>
                    #{userPosition.user.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white font-bold truncate">{userPosition.user.displayName}</p>
                      {userPosition.user.verified && (
                        <CheckBadgeIcon className="w-4 h-4 text-cyan-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-gain font-mono text-sm">{userPosition.user.volume}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-black/50 rounded-lg p-2 text-center border border-white/5">
                    <p className="text-gain font-mono font-bold">{userPosition.user.winRate.toFixed(0)}%</p>
                    <p className="text-white/30 text-[10px] uppercase font-mono">WIN</p>
                  </div>
                  <div className="bg-black/50 rounded-lg p-2 text-center border border-white/5">
                    <p className="text-white font-mono font-bold">{userPosition.user.trades}</p>
                    <p className="text-white/30 text-[10px] uppercase font-mono">TRADES</p>
                  </div>
                  <div className="bg-black/50 rounded-lg p-2 text-center border border-white/5">
                    <div className="flex items-center justify-center gap-1">
                      <FireIconSolid className="w-3 h-3 text-loss" />
                      <p className="text-loss font-mono font-bold">{userPosition.user.streak}</p>
                    </div>
                    <p className="text-white/30 text-[10px] uppercase font-mono">STREAK</p>
                  </div>
                </div>
              </div>
            )}

            {/* DAILY CHALLENGE */}
            <div className="trading-card p-4 border-cyan-400/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-cyan-400/10 rounded-lg border border-cyan-400/30">
                  <BoltIconSolid className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white/40 text-[10px] uppercase tracking-wider font-mono">DAILY CHALLENGE</p>
                  <p className="text-white font-bold text-sm">{challenge.description}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="h-3 bg-black/50 rounded-full overflow-hidden border border-white/5">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-gain transition-all"
                    style={{ width: `${(challenge.progress / challenge.total) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/30 text-xs font-mono">Progress</span>
                  <span className="text-cyan-400 font-mono font-bold text-sm">{challenge.progress}/{challenge.total}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Timeframe Tabs */}
        <div className="px-4 sm:px-0 mb-6">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            {timeframes.map((tf) => (
              <button
                key={tf.id}
                onClick={() => setSelectedTimeframe(tf.id as '24h' | '7d' | '30d' | 'all')}
                className={cn(
                  'px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider font-mono',
                  'border transition-all duration-150 whitespace-nowrap',
                  selectedTimeframe === tf.id
                    ? 'bg-gain/10 text-gain border-gain/30'
                    : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20 hover:text-white'
                )}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <>
            {/* Top 3 Podium */}
            <div className="px-4 sm:px-0 mb-6">
              <div className="grid grid-cols-3 gap-2 sm:gap-3 items-end">
                {/* 2nd Place */}
                {leaderboard[1] && (
                  <div
                    onClick={() => router.push(`/profile/${leaderboard[1].walletAddress}`)}
                    className="trading-card p-3 cursor-pointer group border-slate-400/20 hover:border-slate-400/40"
                  >
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-2">
                        <Medal size={16} className="text-slate-300" />
                        <span className="text-2xl font-mono font-bold text-slate-300">#2</span>
                      </div>
                      <Avatar className="w-10 h-10 mx-auto mb-2 border-2 border-slate-400/30 group-hover:border-slate-400/50 transition-colors">
                        <AvatarImage src={leaderboard[1].avatar} />
                        <AvatarFallback className="bg-slate-800 text-slate-300 font-bold text-sm">
                          {leaderboard[1].displayName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-white font-bold text-sm mb-1 truncate group-hover:text-neon-lime transition-colors">
                        {leaderboard[1].displayName}
                      </p>
                      <p className="text-cyan-400 font-mono text-xs">{leaderboard[1].volume}</p>
                    </div>
                  </div>
                )}

                {/* 1st Place */}
                {leaderboard[0] && (
                  <div
                    onClick={() => router.push(`/profile/${leaderboard[0].walletAddress}`)}
                    className="relative trading-card p-4 cursor-pointer group border-gold/30 hover:border-gold/50 hover:shadow-glow-gold"
                  >
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
                      <div className="bg-gold rounded-full p-1.5 animate-pulse">
                        <Crown size={12} className="text-black" />
                      </div>
                    </div>
                    <div className="text-center pt-2">
                      <div className="flex items-center justify-center gap-1 mb-2">
                        <TrophyIcon className="w-5 h-5 text-gold" />
                        <span className="text-3xl font-mono font-black text-gold">#1</span>
                      </div>
                      <Avatar className="w-12 h-12 mx-auto mb-2 border-2 border-gold/50 group-hover:border-gold/80 transition-colors">
                        <AvatarImage src={leaderboard[0].avatar} />
                        <AvatarFallback className="bg-gold/20 text-gold font-bold">
                          {leaderboard[0].displayName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-white font-bold text-base mb-1 truncate group-hover:text-gold transition-colors">
                        {leaderboard[0].displayName}
                      </p>
                      <p className="text-gain font-mono text-sm font-bold">{leaderboard[0].volume}</p>
                    </div>
                  </div>
                )}

                {/* 3rd Place */}
                {leaderboard[2] && (
                  <div
                    onClick={() => router.push(`/profile/${leaderboard[2].walletAddress}`)}
                    className="trading-card p-3 cursor-pointer group border-amber-600/20 hover:border-amber-600/40"
                  >
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-2">
                        <Medal size={16} className="text-amber-600" />
                        <span className="text-2xl font-mono font-bold text-amber-600">#3</span>
                      </div>
                      <Avatar className="w-10 h-10 mx-auto mb-2 border-2 border-amber-600/30 group-hover:border-amber-600/50 transition-colors">
                        <AvatarImage src={leaderboard[2].avatar} />
                        <AvatarFallback className="bg-amber-900/50 text-amber-500 font-bold text-sm">
                          {leaderboard[2].displayName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-white font-bold text-sm mb-1 truncate group-hover:text-neon-lime transition-colors">
                        {leaderboard[2].displayName}
                      </p>
                      <p className="text-coral-400 font-mono text-xs">{leaderboard[2].volume}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Rest of Leaderboard - Table Style */}
            <div className="px-4 sm:px-0">
              <div className="trading-card overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-white/5 bg-terminal/50">
                  <div className="col-span-1 text-[10px] font-bold text-white/40 uppercase tracking-wider font-mono">#</div>
                  <div className="col-span-5 text-[10px] font-bold text-white/40 uppercase tracking-wider font-mono">Trader</div>
                  <div className="col-span-3 text-[10px] font-bold text-white/40 uppercase tracking-wider font-mono text-right">Volume</div>
                  <div className="col-span-3 text-[10px] font-bold text-white/40 uppercase tracking-wider font-mono text-right hidden sm:block">Win Rate</div>
                </div>

                {/* Table Rows */}
                <div className="divide-y divide-white/5">
                  {leaderboard.slice(3, visibleCount).map((trader) => {
                    const tierConfig = getTierConfig(trader.tier);
                    const isPulsing = pulseRank === trader.rank;
                    const isTopTen = trader.rank <= 10;

                    return (
                      <div
                        key={trader.rank}
                        onClick={() => router.push(`/profile/${trader.walletAddress}`)}
                        className={cn(
                          'grid grid-cols-12 gap-2 px-4 py-3 items-center cursor-pointer group',
                          'hover:bg-white/[0.02] transition-all',
                          isPulsing && 'bg-neon-lime/5'
                        )}
                      >
                        {/* Rank */}
                        <div className="col-span-1">
                          <span className={cn(
                            'font-bold text-sm font-mono',
                            isTopTen ? 'text-purple-400' : 'text-white/30'
                          )}>
                            {trader.rank}
                          </span>
                        </div>

                        {/* Trader Info */}
                        <div className="col-span-5 flex items-center gap-2 min-w-0">
                          <Avatar className="w-8 h-8 shrink-0 border border-white/10 group-hover:border-neon-lime/30 transition-colors">
                            <AvatarImage src={trader.avatar} alt={trader.displayName} />
                            <AvatarFallback className="bg-white/5 text-white/40 text-xs font-bold">
                              {trader.displayName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-white font-semibold text-sm truncate group-hover:text-neon-lime transition-colors">
                                {trader.displayName}
                              </p>
                              {trader.verified && (
                                <CheckBadgeIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                              )}
                            </div>
                            <span className={cn('text-[10px] font-mono', tierConfig.color)}>
                              {tierConfig.badge} {tierConfig.label}
                            </span>
                          </div>
                        </div>

                        {/* Volume */}
                        <div className="col-span-3 text-right">
                          <span className="text-white font-mono font-bold text-sm">{trader.volume}</span>
                        </div>

                        {/* Win Rate & Streak */}
                        <div className="col-span-3 text-right hidden sm:flex items-center justify-end gap-3">
                          <span className={cn(
                            "font-mono text-xs font-bold",
                            trader.winRate >= 70 ? "text-gain" :
                            trader.winRate >= 50 ? "text-gold" :
                            "text-loss"
                          )}>
                            {trader.winRate.toFixed(0)}%
                          </span>
                          {trader.streak > 0 && (
                            <div className="flex items-center gap-0.5">
                              <FireIconSolid className="w-3 h-3 text-loss" />
                              <span className="font-mono text-[10px] font-bold text-loss">{trader.streak}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Load More */}
            {visibleCount < leaderboard.length && (
              <div className="px-4 sm:px-0 mt-6 text-center">
                <p className="text-white/30 text-sm mb-3 font-mono">
                  <span className="text-neon-lime font-bold">+{leaderboard.length - visibleCount}</span> more traders
                </p>
                <button
                  onClick={loadMore}
                  className={cn(
                    'px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider font-mono',
                    'bg-white/5 text-white/60 border border-white/10',
                    'hover:bg-white/10 hover:text-white hover:border-white/20 transition-all'
                  )}
                >
                  Load More
                </button>
              </div>
            )}

            {/* Share to Unlock */}
            {visibleCount >= 50 && !showUnlockModal && (
              <div className="px-4 sm:px-0 mt-8">
                <div className="trading-card border-purple-400/30 p-6 text-center">
                  <LockClosedIcon className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                  <p className="text-white font-bold text-lg mb-2 font-display uppercase">
                    Unlock Ranks #51-100
                  </p>
                  <p className="text-white/40 text-sm mb-4 font-mono">
                    Share to see full leaderboard
                  </p>
                  <button
                    onClick={() => setShowUnlockModal(true)}
                    className={cn(
                      'inline-flex items-center gap-2 px-6 py-2.5 rounded-lg',
                      'bg-purple-400/10 text-purple-400 border border-purple-400/30',
                      'hover:bg-purple-400/20 hover:border-purple-400/50',
                      'font-bold text-xs uppercase tracking-wider font-mono transition-all'
                    )}
                  >
                    <ShareIcon className="w-4 h-4" />
                    SHARE NOW
                  </button>
                </div>
              </div>
            )}

            {/* Bottom CTA */}
            <div className="px-4 sm:px-0 mt-8 mb-6">
              <div className="trading-card border-gain/30 p-6 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-gain/5 to-transparent" />
                <div className="relative">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-gain/10 border border-gain/30 flex items-center justify-center">
                    <Zap size={20} className="text-gain" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 font-display uppercase">
                    Start <span className="text-gain">Trading</span>
                  </h3>
                  <p className="text-white/40 mb-4 text-sm font-mono">
                    Climb the ranks and earn your spot
                  </p>
                  <button
                    onClick={() => router.push('/create')}
                    className="btn-trade-buy px-8 py-3 text-sm"
                  >
                    <Zap size={14} />
                    TRADE NOW
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
