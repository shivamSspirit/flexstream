'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  TrendingUp,
  Users,
  FileText,
  DollarSign,
  Shield,
  Sparkles,
  Copy,
  ExternalLink,
  Share2
} from 'lucide-react';

export function ProfileStatsMockup() {
  return (
    <Card className="w-full max-w-3xl mx-auto bg-gradient-to-br from-card-bg to-card-bg/80 border border-white/10 shadow-2xl overflow-hidden">
      {/* Cover Image */}
      <div className="h-32 sm:h-48 bg-gradient-to-br from-accent-purple via-accent-blue to-accent-cyan relative">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute top-4 right-4 flex gap-2">
          <Badge className="bg-accent-green/90 backdrop-blur-sm text-black font-bold border-0">
            ✅ Verified Creator
          </Badge>
        </div>
      </div>

      {/* Profile Header */}
      <CardContent className="px-4 sm:px-6 pb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12 sm:-mt-16 mb-6">
          <Avatar className="h-24 w-24 sm:h-32 sm:w-32 ring-4 ring-black shadow-2xl">
            <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=CryptoQueen" alt="CryptoQueen" />
            <AvatarFallback className="bg-gradient-to-br from-accent-purple to-accent-pink text-white font-black text-3xl">
              CQ
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 sm:ml-4 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-white">Crypto Queen</h1>
              <Badge className="bg-gradient-to-r from-amber-400 to-amber-600 text-black text-xs font-bold border-0">
                💎 Diamond
              </Badge>
              <div className="flex items-center gap-1 text-accent-green">
                <Shield className="h-4 w-4" fill="currentColor" />
              </div>
            </div>
            <p className="text-text-muted font-medium">@CryptoQueen</p>
            <p className="text-text-secondary text-sm sm:text-base max-w-xl">
              Top 1% trader on Solana 📈 | Building wealth through verified trades |
              Exclusive alpha for $QUEEN holders 👑
            </p>
          </div>

          <div className="flex gap-2 self-start sm:self-auto">
            <Button className="bg-gradient-to-r from-accent-green to-accent-cyan hover:from-accent-green/90 hover:to-accent-cyan/90 text-black font-bold">
              Follow
            </Button>
            <Button variant="outline" className="bg-white/5 border-white/20 hover:bg-white/10">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-gradient-to-br from-accent-green/10 to-accent-green/5 border border-accent-green/30 rounded-xl p-4 hover:border-accent-green/50 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-accent-green" />
              <span className="text-white/60 text-xs font-medium uppercase">Earnings</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-accent-green">$24.8K</div>
            <div className="flex items-center gap-1 text-accent-green/70 text-xs mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>+47% this month</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-accent-cyan/10 to-accent-cyan/5 border border-accent-cyan/30 rounded-xl p-4 hover:border-accent-cyan/50 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-accent-cyan" />
              <span className="text-white/60 text-xs font-medium uppercase">Holders</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-accent-cyan">1,247</div>
            <div className="flex items-center gap-1 text-accent-cyan/70 text-xs mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>+89 this week</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-accent-purple/10 to-accent-purple/5 border border-accent-purple/30 rounded-xl p-4 hover:border-accent-purple/50 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-accent-purple" />
              <span className="text-white/60 text-xs font-medium uppercase">Posts</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-accent-purple">89</div>
            <div className="text-white/50 text-xs mt-1">12 this month</div>
          </div>

          <div className="bg-gradient-to-br from-accent-pink/10 to-accent-pink/5 border border-accent-pink/30 rounded-xl p-4 hover:border-accent-pink/50 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-accent-pink" />
              <span className="text-white/60 text-xs font-medium uppercase">Followers</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-accent-pink">3.4K</div>
            <div className="text-white/50 text-xs mt-1">245 following</div>
          </div>
        </div>

        {/* Creator Token Card */}
        <div className="bg-gradient-to-br from-accent-purple/10 to-accent-blue/10 border border-accent-purple/30 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center shadow-lg">
                <span className="text-white font-black text-lg">👑</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-white text-lg">$QUEEN</h3>
                  <Badge className="bg-accent-green/20 text-accent-green border-accent-green/30 text-xs font-bold">
                    Active
                  </Badge>
                </div>
                <p className="text-white/50 text-xs font-mono">7xKXtg...9Qm2</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-white">$2.47</div>
              <div className="flex items-center gap-1 text-accent-green text-sm font-bold">
                <TrendingUp className="h-3 w-3" />
                <span>+156%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/10">
            <div className="text-center">
              <div className="text-white font-bold text-lg">$47.2K</div>
              <div className="text-white/50 text-xs">Market Cap</div>
            </div>
            <div className="text-center">
              <div className="text-white font-bold text-lg">$8.9K</div>
              <div className="text-white/50 text-xs">24h Volume</div>
            </div>
            <div className="text-center">
              <div className="text-white font-bold text-lg">1.2K</div>
              <div className="text-white/50 text-xs">Holders</div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button className="flex-1 bg-gradient-to-r from-accent-purple to-accent-pink hover:from-accent-purple/90 hover:to-accent-pink/90 text-white font-bold h-10">
              <Sparkles className="h-4 w-4 mr-2" />
              Buy $QUEEN
            </Button>
            <Button variant="outline" className="bg-white/5 border-white/20 hover:bg-white/10 text-white h-10 px-4">
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="bg-white/5 border-white/20 hover:bg-white/10 text-white h-10 px-4">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Achievement Badges */}
        <div className="mt-6 space-y-3">
          <h4 className="text-sm font-bold text-white/60 uppercase tracking-wide">Achievements</h4>
          <div className="flex flex-wrap gap-2">
            {[
              { emoji: '🚀', label: 'Early Adopter', color: 'from-accent-blue to-accent-cyan' },
              { emoji: '💎', label: 'Diamond Hands', color: 'from-accent-purple to-accent-pink' },
              { emoji: '🏆', label: 'Top 1% Trader', color: 'from-amber-400 to-amber-600' },
              { emoji: '👑', label: 'Token Creator', color: 'from-accent-green to-accent-cyan' },
              { emoji: '✨', label: 'Verified', color: 'from-accent-cyan to-accent-blue' },
            ].map((badge, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-2 bg-gradient-to-r ${badge.color} text-black px-3 py-1.5 rounded-full text-xs font-bold shadow-lg`}
              >
                <span>{badge.emoji}</span>
                <span>{badge.label}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
