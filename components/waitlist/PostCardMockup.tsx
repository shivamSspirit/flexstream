'use client';

import { MessageCircle, Share2, TrendingUp } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function PostCardMockup() {
  return (
    <Card className="w-full max-w-2xl mx-auto bg-gradient-to-br from-card-bg to-card-bg/80 border border-white/10 shadow-2xl">
      <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <Avatar className="h-12 w-12 ring-2 ring-accent-purple/50 shadow-lg shrink-0">
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=SolanaKing" alt="SolanaKing" />
              <AvatarFallback className="bg-gradient-to-br from-accent-purple to-accent-pink text-white font-bold">
                SK
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-text-primary text-base">
                  Solana King
                </span>
                <span className="text-text-muted text-sm font-medium">
                  @SolanaKing
                </span>
                <Badge className="bg-gradient-to-r from-amber-400 to-amber-600 text-black text-xs font-bold border-0">
                  💎 Diamond
                </Badge>
                <div className="flex items-center gap-1 text-accent-green">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs font-semibold">Verified</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-text-muted text-sm">
                <span className="font-medium">2 hours ago</span>
                <span className="text-white/20">•</span>
                <span className="text-base">💰</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 sm:px-6 space-y-4">
        {/* Post Content */}
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
            Just hit my first $1K week! 🚀
          </h3>
          <p className="text-text-secondary text-base leading-relaxed">
            Started with $500, now sitting at $1,847. My strategy is finally paying off.
            Token is live and trading - holders get exclusive alpha drops 👀
          </p>
        </div>

        {/* Token Stats Card */}
        <div className="bg-gradient-to-br from-accent-green/10 to-accent-cyan/5 border border-accent-green/30 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-accent-green to-accent-cyan flex items-center justify-center text-black font-black text-sm">
                SK
              </div>
              <div>
                <div className="font-bold text-white text-sm">$SOLAKING</div>
                <div className="text-xs text-white/50">Token Address: 7xKXt...9Qm2</div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-accent-green font-bold">
                <TrendingUp className="h-4 w-4" />
                <span className="text-lg">+284%</span>
              </div>
              <div className="text-xs text-white/50">24h change</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/10">
            <div>
              <div className="text-accent-green font-bold text-lg">$1,247</div>
              <div className="text-white/50 text-xs">Earned</div>
            </div>
            <div>
              <div className="text-accent-cyan font-bold text-lg">89</div>
              <div className="text-white/50 text-xs">Holders</div>
            </div>
            <div>
              <div className="text-accent-purple font-bold text-lg">$0.89</div>
              <div className="text-white/50 text-xs">Price</div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button className="flex-1 bg-gradient-to-r from-accent-green to-accent-cyan hover:from-accent-green/90 hover:to-accent-cyan/90 text-black font-bold text-sm h-9">
              🚀 Buy Token
            </Button>
            <Button variant="outline" className="px-4 bg-white/5 border-white/20 hover:bg-white/10 text-white text-sm h-9">
              Chart
            </Button>
          </div>
        </div>

        {/* Post Verification Badge */}
        <div className="flex items-center gap-2 px-3 py-2 bg-accent-green/10 border border-accent-green/30 rounded-lg">
          <svg className="h-4 w-4 text-accent-green" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-accent-green text-xs font-semibold">
            Wallet verified on-chain • All earnings confirmed
          </span>
        </div>

        {/* Engagement Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <div className="flex items-center gap-6">
            <button className="flex items-center gap-1.5 text-text-muted hover:text-accent-pink transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-accent-pink/10 transition-colors">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <span className="font-semibold text-sm">156</span>
            </button>

            <button className="flex items-center gap-1.5 text-text-muted hover:text-accent-blue transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-accent-blue/10 transition-colors">
                <MessageCircle className="h-5 w-5" />
              </div>
              <span className="font-semibold text-sm">32</span>
            </button>

            <button className="flex items-center gap-1.5 text-text-muted hover:text-accent-cyan transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-accent-cyan/10 transition-colors">
                <Share2 className="h-5 w-5" />
              </div>
              <span className="font-semibold text-sm">24</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-white/40 text-xs">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="font-medium">847 views</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
