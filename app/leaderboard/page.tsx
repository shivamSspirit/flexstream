'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { 
  TrophyIcon,
  FireIcon,
  ClockIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

export default function LeaderboardPage() {
  const router = useRouter();
  const [timeframe, setTimeframe] = useState('week');

  const timeframes = [
    { id: 'day', label: '24H', icon: ClockIcon },
    { id: 'week', label: '7D', icon: FireIcon },
    { id: 'month', label: '30D', icon: TrophyIcon },
    { id: 'all', label: 'All Time', icon: ArrowTrendingUpIcon },
  ];

  const leaderboard = [
    {
      id: '1',
      rank: 1,
      name: 'CryptoKing',
      username: 'cryptoking',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
      volume: '$2.3M',
      trades: 1847,
      winRate: '89%',
      change: '+45%',
      verified: true
    },
    {
      id: '2',
      rank: 2,
      name: 'SolanaWhale',
      username: 'solanawhale',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      volume: '$1.8M',
      trades: 1456,
      winRate: '85%',
      change: '+38%',
      verified: true
    },
    {
      id: '3',
      rank: 3,
      name: 'TokenMaster',
      username: 'tokenmaster',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop',
      volume: '$1.5M',
      trades: 1234,
      winRate: '82%',
      change: '+32%',
      verified: true
    },
    {
      id: '4',
      rank: 4,
      name: 'NFT Queen',
      username: 'nftqueen',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop',
      volume: '$1.2M',
      trades: 1089,
      winRate: '80%',
      change: '+28%',
      verified: true
    },
    {
      id: '5',
      rank: 5,
      name: 'DeFi Pro',
      username: 'defipro',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
      volume: '$980K',
      trades: 892,
      winRate: '78%',
      change: '+25%',
      verified: false
    },
    {
      id: '6',
      rank: 6,
      name: 'Blockchain Betty',
      username: 'blockchainbetty',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
      volume: '$850K',
      trades: 756,
      winRate: '76%',
      change: '+22%',
      verified: false
    },
    {
      id: '7',
      rank: 7,
      name: 'Web3 Wizard',
      username: 'web3wizard',
      avatar: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=100&h=100&fit=crop',
      volume: '$720K',
      trades: 654,
      winRate: '74%',
      change: '+18%',
      verified: false
    },
    {
      id: '8',
      rank: 8,
      name: 'Metaverse Mike',
      username: 'metaversemike',
      avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=100&h=100&fit=crop',
      volume: '$650K',
      trades: 589,
      winRate: '72%',
      change: '+15%',
      verified: false
    },
  ];

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-br from-yellow-500 to-yellow-600';
      case 2:
        return 'bg-gradient-to-br from-gray-400 to-gray-500';
      case 3:
        return 'bg-gradient-to-br from-orange-600 to-orange-700';
      default:
        return 'bg-card-bg border border-white/20';
    }
  };

  return (
    <AppLayout showWallet={true} showSearch={true}>
      <div className="pb-20 md:pb-6 -mx-4 sm:mx-0">
        {/* Header */}
        <div className="px-4 sm:px-0 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 flexstream-gradient rounded-2xl flex items-center justify-center">
              <TrophyIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-primary">Leaderboard</h1>
              <p className="text-sm text-secondary">Top traders this week</p>
            </div>
          </div>

          {/* Prize Pool Banner */}
          <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-2xl p-4 sm:p-6 border border-purple-500/20">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-secondary text-sm mb-1">Weekly Prize Pool</p>
                <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  $200,000
                </p>
              </div>
              <Button 
                className="flexstream-gradient text-white px-6 py-3 font-semibold hover:scale-105 transition-transform"
                onClick={() => router.push('/create')}
              >
                Start Trading
              </Button>
            </div>
          </div>
        </div>

        {/* Timeframe Tabs */}
        <div className="px-4 sm:px-0 mb-6">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
            {timeframes.map((tf) => (
              <Button
                key={tf.id}
                onClick={() => setTimeframe(tf.id)}
                variant={timeframe === tf.id ? 'default' : 'outline'}
                className={cn(
                  'flex items-center gap-2 whitespace-nowrap transition-all',
                  timeframe === tf.id
                    ? 'flexstream-gradient text-white border-0'
                    : 'bg-card-bg border-white/20 text-secondary hover:text-primary hover:bg-card-bg/80'
                )}
              >
                <tf.icon className="w-4 h-4" />
                <span>{tf.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Leaderboard List */}
        <div className="space-y-3 px-4 sm:px-0">
          {leaderboard.map((trader) => (
            <button
              key={trader.id}
              onClick={() => router.push(`/profile/${trader.username}`)}
              className={cn(
                "bg-card-bg rounded-2xl p-4 border transition-all cursor-pointer group relative overflow-hidden w-full text-left",
                trader.rank <= 3 ? "border-white/10 hover:border-white/20" : "border-white/5 hover:border-white/10"
              )}
            >
              {/* Rank Badge Glow for Top 3 */}
              {trader.rank <= 3 && (
                <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-pink-500/10 blur-3xl" />
              )}

              <div className="relative flex items-center gap-3 sm:gap-4">
                {/* Rank */}
                <div className={cn(
                  "w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center font-bold text-lg flex-shrink-0",
                  getRankBadgeColor(trader.rank),
                  trader.rank > 3 && "text-secondary"
                )}>
                  {trader.rank <= 3 ? (
                    <span className="text-white">#{trader.rank}</span>
                  ) : (
                    `#${trader.rank}`
                  )}
                </div>

                {/* Avatar */}
                <Avatar className="h-12 w-12 sm:h-14 sm:w-14 ring-2 ring-white/10 group-hover:ring-white/20 transition-all flex-shrink-0">
                  <AvatarImage src={trader.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white font-semibold">
                    {trader.name[0]}
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-primary font-semibold truncate group-hover:text-purple-400 transition-colors text-sm sm:text-base">
                      {trader.name}
                    </h3>
                    {trader.verified && (
                      <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-[10px] font-bold">✓</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs sm:text-sm text-secondary">
                    <span>{trader.trades} trades</span>
                    <span>•</span>
                    <span>{trader.winRate} win</span>
                  </div>
                </div>

                {/* Volume & Change */}
                <div className="text-right flex-shrink-0">
                  <p className="text-primary font-bold text-sm sm:text-lg mb-1">{trader.volume}</p>
                  <Badge className="bg-metric-green/20 text-metric-green border-metric-green/30 text-xs">
                    <ArrowTrendingUpIcon className="w-3 h-3 inline mr-1" />
                    {trader.change}
                  </Badge>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Load More */}
        <div className="mt-6 text-center px-4 sm:px-0">
          <Button 
            variant="outline" 
            className="bg-card-bg border-white/20 text-primary hover:bg-card-bg/80 w-full sm:w-auto"
            onClick={() => console.log('Load more traders')}
          >
            Load More Traders
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
