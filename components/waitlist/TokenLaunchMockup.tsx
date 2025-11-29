'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Image as ImageIcon,
  Lock,
  Globe,
  Sparkles,
  Info,
  TrendingUp,
  Users,
  Shield
} from 'lucide-react';

export function TokenLaunchMockup() {
  const [privacy, setPrivacy] = useState<'public' | 'holders'>('public');

  return (
    <Card className="w-full max-w-2xl mx-auto bg-gradient-to-br from-card-bg to-card-bg/80 border border-white/10 shadow-2xl">
      <CardHeader className="border-b border-white/10 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-accent-green to-accent-cyan flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-black" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Create Post + Launch Token</h3>
              <p className="text-text-muted text-sm">Share your wins and monetize instantly</p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-5">
        {/* Post Content */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-white/80">What&apos;s on your mind?</label>
          <div className="bg-white/5 border border-white/20 rounded-xl p-4 min-h-[120px] focus-within:border-accent-green transition-colors">
            <p className="text-white/90 text-base leading-relaxed">
              Just made $2.4K in my first week on FlexStream! 🚀
              <br /><br />
              My trading strategy is finally paying off. Launching my creator token so my community can get exclusive alpha drops 💎
            </p>
          </div>
        </div>

        {/* Media Upload */}
        <div className="flex gap-3">
          <button className="flex-1 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-accent-blue/50 rounded-xl p-4 transition-all group">
            <div className="flex flex-col items-center gap-2">
              <div className="h-12 w-12 rounded-full bg-accent-blue/20 group-hover:bg-accent-blue/30 flex items-center justify-center transition-colors">
                <ImageIcon className="h-6 w-6 text-accent-blue" />
              </div>
              <span className="text-sm font-semibold text-white/70 group-hover:text-white transition-colors">
                Add Screenshot
              </span>
            </div>
          </button>
          <div className="flex-1 bg-gradient-to-br from-accent-green/10 to-accent-green/5 border border-accent-green/30 rounded-xl p-3 flex items-center gap-3">
            <div className="h-16 w-16 rounded-lg bg-accent-green/20 flex items-center justify-center shrink-0">
              <TrendingUp className="h-8 w-8 text-accent-green" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white mb-1">Chart Preview</div>
              <div className="text-xs text-white/50">Trading performance graph</div>
            </div>
          </div>
        </div>

        {/* Token Launch Toggle */}
        <div className="bg-gradient-to-br from-accent-purple/10 to-accent-pink/10 border border-accent-purple/30 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Launch Token with Post</h4>
                <p className="text-white/50 text-xs">Monetize this content instantly</p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-accent-green to-accent-cyan h-7 w-12 rounded-full p-0.5 shadow-lg cursor-pointer">
              <div className="h-full w-full bg-black rounded-full flex items-center justify-end pr-0.5">
                <div className="h-5 w-5 rounded-full bg-gradient-to-r from-accent-green to-accent-cyan" />
              </div>
            </div>
          </div>

          {/* Token Details */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/30 rounded-lg p-3">
                <label className="text-xs text-white/50 mb-1 block">Token Name</label>
                <input
                  type="text"
                  value="FLEX2K"
                  readOnly
                  className="bg-transparent text-white font-bold text-sm w-full focus:outline-none"
                />
              </div>
              <div className="bg-black/30 rounded-lg p-3">
                <label className="text-xs text-white/50 mb-1 block">Initial Price</label>
                <input
                  type="text"
                  value="$0.10"
                  readOnly
                  className="bg-transparent text-white font-bold text-sm w-full focus:outline-none"
                />
              </div>
            </div>

            <div className="bg-accent-blue/10 border border-accent-blue/30 rounded-lg p-3 flex items-start gap-3">
              <Info className="h-5 w-5 text-accent-blue shrink-0 mt-0.5" />
              <div className="flex-1 text-xs text-white/80 leading-relaxed">
                <span className="font-semibold text-white">Auto-setup:</span> 50% tokens to you, 50% to liquidity pool. Trading starts immediately after post.
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-white/80">Post Visibility</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPrivacy('public')}
              className={`relative p-4 rounded-xl border-2 transition-all ${
                privacy === 'public'
                  ? 'bg-accent-green/10 border-accent-green shadow-lg shadow-accent-green/20'
                  : 'bg-white/5 border-white/20 hover:border-white/40'
              }`}
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  privacy === 'public' ? 'bg-accent-green text-black' : 'bg-white/10 text-white/60'
                }`}>
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <div className={`font-bold text-sm ${privacy === 'public' ? 'text-white' : 'text-white/70'}`}>
                    Public
                  </div>
                  <div className="text-xs text-white/50 mt-1">Everyone can see</div>
                </div>
              </div>
              {privacy === 'public' && (
                <div className="absolute top-2 right-2">
                  <div className="h-5 w-5 rounded-full bg-accent-green flex items-center justify-center">
                    <svg className="h-3 w-3 text-black" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              )}
            </button>

            <button
              onClick={() => setPrivacy('holders')}
              className={`relative p-4 rounded-xl border-2 transition-all ${
                privacy === 'holders'
                  ? 'bg-accent-purple/10 border-accent-purple shadow-lg shadow-accent-purple/20'
                  : 'bg-white/5 border-white/20 hover:border-white/40'
              }`}
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  privacy === 'holders' ? 'bg-accent-purple text-white' : 'bg-white/10 text-white/60'
                }`}>
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <div className={`font-bold text-sm ${privacy === 'holders' ? 'text-white' : 'text-white/70'}`}>
                    Token Holders
                  </div>
                  <div className="text-xs text-white/50 mt-1">Exclusive alpha</div>
                </div>
              </div>
              {privacy === 'holders' && (
                <div className="absolute top-2 right-2">
                  <div className="h-5 w-5 rounded-full bg-accent-purple flex items-center justify-center">
                    <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              )}
            </button>
          </div>

          {privacy === 'holders' && (
            <div className="bg-accent-purple/10 border border-accent-purple/30 rounded-lg p-3 flex items-start gap-3">
              <Shield className="h-5 w-5 text-accent-purple shrink-0 mt-0.5" />
              <div className="flex-1 text-xs text-white/80 leading-relaxed">
                Only your <span className="font-semibold text-accent-purple">1,247 token holders</span> can view this post. Keep your alpha private from competitors.
              </div>
            </div>
          )}
        </div>

        {/* Projected Earnings */}
        <div className="bg-gradient-to-br from-accent-green/10 to-accent-cyan/10 border border-accent-green/30 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-full bg-accent-green/20 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-accent-green" />
            </div>
            <h4 className="font-bold text-white text-sm">Projected Earnings</h4>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-black/30 rounded-lg p-3 text-center">
              <div className="text-accent-green font-black text-xl">$120</div>
              <div className="text-white/50 text-xs mt-1">Initial Sale</div>
            </div>
            <div className="bg-black/30 rounded-lg p-3 text-center">
              <div className="text-accent-cyan font-black text-xl">$45</div>
              <div className="text-white/50 text-xs mt-1">Trading Fees</div>
            </div>
            <div className="bg-black/30 rounded-lg p-3 text-center">
              <div className="text-accent-blue font-black text-xl">$89</div>
              <div className="text-white/50 text-xs mt-1">24h Volume</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1 bg-white/5 border-white/20 hover:bg-white/10 text-white font-semibold h-12"
          >
            Save Draft
          </Button>
          <Button className="flex-1 bg-gradient-to-r from-accent-green via-accent-cyan to-accent-blue hover:from-accent-green/90 hover:via-accent-cyan/90 hover:to-accent-blue/90 text-black font-black text-base h-12 shadow-lg shadow-accent-green/30 animate-gradient-x">
            🚀 Post & Launch Token
          </Button>
        </div>

        {/* Bottom Info */}
        <div className="flex items-center justify-center gap-2 text-xs text-white/40 pt-2">
          <Users className="h-3 w-3" />
          <span>Your 3.4K followers will be notified</span>
        </div>
      </CardContent>
    </Card>
  );
}
