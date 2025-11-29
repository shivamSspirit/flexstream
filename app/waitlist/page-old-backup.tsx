'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWaitlistStats, useJoinWaitlist, useCountdown } from '@/hooks/useWaitlist';
import { Button } from '@/components/ui/button';
import {
  CheckCircleIcon,
  SparklesIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  BoltIcon,
  ChartBarIcon,
  FireIcon,
  CurrencyDollarIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import Image from 'next/image';

function WaitlistPageContent() {
  const searchParams = useSearchParams();
  const referralCode = searchParams.get('ref');

  const [email, setEmail] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

  const { data: stats } = useWaitlistStats();
  const joinMutation = useJoinWaitlist();

  // Countdown to Sunday (next Sunday at midnight)
  const getNextSunday = () => {
    const now = new Date();
    const sunday = new Date(now);
    sunday.setDate(now.getDate() + (7 - now.getDay()));
    sunday.setHours(23, 59, 59, 999);
    return sunday;
  };

  const timeLeft = useCountdown(getNextSunday());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast.error('Please enter a valid email');
      return;
    }

    try {
      const result = await joinMutation.mutateAsync({
        email,
        referralCode: referralCode || undefined
      });

      if (result.success) {
        setSuccessData(result.data);
        setShowSuccess(true);
        toast.success(result.data.message);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to join waitlist');
    }
  };

  const copyReferralLink = () => {
    if (successData?.referralUrl) {
      navigator.clipboard.writeText(successData.referralUrl);
      toast.success('Link copied! Share it to move up the list');
    }
  };

  const slotsClaimed = stats?.slotsClaimed || 47;
  const slotsRemaining = stats?.slotsRemaining || 53;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-6 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent-green/20 via-transparent to-transparent"></div>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-accent-green/10 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-cyan/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Scarcity Counter - CRITICAL for FOMO */}
          <div className="inline-flex items-center gap-2 bg-red-500/20 border border-red-500/50 rounded-full px-6 py-3 mb-8 animate-pulse">
            <BoltIcon className="h-5 w-5 text-red-400" />
            <span className="text-red-400 font-black text-sm">
              {slotsClaimed}/100 BETA SLOTS CLAIMED
            </span>
            <span className="text-red-300 text-xs">• {slotsRemaining} LEFT</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            <span className="bg-gradient-to-r from-accent-green via-accent-cyan to-accent-blue bg-clip-text text-transparent">
              Pump.fun&apos;s
            </span>
            <br />
            <span className="text-white">Verified Creator Layer</span>
          </h1>

          {/* Subheadline */}
          <p className="text-2xl md:text-3xl font-bold text-white/90 mb-4">
            Verified. Private. Profitable.
          </p>

          <p className="text-lg md:text-xl text-white/70 mb-8 max-w-2xl mx-auto">
            Join 100 elite traders building the future of verified trading performance.
            <span className="text-accent-green font-bold"> $10-25K+/month</span> income stream.
          </p>

          {/* Countdown Timer */}
          <div className="flex items-center justify-center gap-4 mb-10">
            <span className="text-white/60 text-sm font-semibold">CLOSES IN:</span>
            <div className="flex gap-2">
              {[
                { label: 'DAYS', value: timeLeft.days },
                { label: 'HRS', value: timeLeft.hours },
                { label: 'MIN', value: timeLeft.minutes },
                { label: 'SEC', value: timeLeft.seconds },
              ].map((item, idx) => (
                <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 min-w-[60px]">
                  <div className="text-2xl font-black text-accent-green">{String(item.value).padStart(2, '0')}</div>
                  <div className="text-[10px] text-white/60 font-bold">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Form or Success State */}
          {!showSuccess ? (
            <form onSubmit={handleSubmit} className="max-w-md mx-auto">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-2xl">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-6 py-4 text-white placeholder:text-white/50 text-lg font-semibold mb-4 focus:outline-none focus:ring-2 focus:ring-accent-green transition-all"
                  required
                />
                <Button
                  type="submit"
                  disabled={joinMutation.isPending}
                  className="w-full bg-gradient-to-r from-accent-green via-accent-cyan to-accent-green bg-[length:200%_100%] hover:bg-[position:100%_0] text-black font-black text-lg py-6 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-accent-green/50 disabled:opacity-50"
                >
                  {joinMutation.isPending ? 'JOINING...' : 'CLAIM YOUR BETA SLOT'}
                </Button>
              </div>
            </form>
          ) : (
            <div className="max-w-md mx-auto bg-accent-green/20 backdrop-blur-xl rounded-2xl p-8 border-2 border-accent-green/50 shadow-2xl">
              <CheckCircleIcon className="h-16 w-16 text-accent-green mx-auto mb-4" />
              <h3 className="text-2xl font-black text-white mb-2">You&apos;re In!</h3>
              <p className="text-white/70 mb-4">
                Position: <span className="text-accent-green font-black text-xl">#{successData?.position}</span>
              </p>
              <div className="bg-black/40 rounded-xl p-4 mb-4">
                <p className="text-white/60 text-sm mb-2">Your Referral Link:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={successData?.referralUrl || ''}
                    readOnly
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white text-sm font-mono"
                  />
                  <Button
                    onClick={copyReferralLink}
                    className="bg-accent-green hover:bg-accent-green/90 text-black font-bold px-4"
                  >
                    Copy
                  </Button>
                </div>
              </div>
              <p className="text-accent-green font-bold text-sm">
                💡 Share your link to skip ahead in line
              </p>
            </div>
          )}

          {/* Social Proof */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-4 text-sm text-white/50">
            <span>Joined by top traders:</span>
            {['@0xCryptoKing', '@PumpMaster69', '@SolanaWhale', '@DegenerateApe'].map((handle, idx) => (
              <span key={idx} className="text-accent-green font-semibold">{handle}</span>
            ))}
          </div>
        </div>
      </section>

      {/* The 3 Problems */}
      <section className="py-20 px-6 bg-gradient-to-b from-transparent to-red-950/20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-center mb-16">
            Why <span className="text-red-400">Verified Traders</span> Are Leaving Pump.fun
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '⚠️',
                title: 'Multi-Token Stigma',
                problem: 'Launch 2+ tokens = instant distrust',
                impact: 'Lost credibility, fewer buyers, reputation damage',
              },
              {
                icon: '🔓',
                title: 'Privacy Gap',
                problem: 'Wallet exposed = competitors copy everything',
                impact: 'Alpha leaked, trades front-run, no competitive edge',
              },
              {
                icon: '💔',
                title: 'Fragmentation',
                problem: 'Twitter + Telegram + Pump = scattered community',
                impact: 'Low engagement, weak network effects, slow growth',
              },
            ].map((item, idx) => (
              <div key={idx} className="bg-red-950/10 border border-red-500/30 rounded-2xl p-8 hover:border-red-500/60 transition-all">
                <div className="text-5xl mb-4">{item.icon}</div>
                <h3 className="text-2xl font-black text-white mb-3">{item.title}</h3>
                <p className="text-red-400 font-bold mb-2">{item.problem}</p>
                <p className="text-white/60 text-sm">{item.impact}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Solution */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-center mb-16">
            The <span className="bg-gradient-to-r from-accent-green to-accent-cyan bg-clip-text text-transparent">FlexIt</span> Solution
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <ShieldCheckIcon className="h-8 w-8" />,
                title: 'Verified Layer',
                desc: 'Blockchain-verified performance. No fake screenshots.',
              },
              {
                icon: <SparklesIcon className="h-8 w-8" />,
                title: 'Creator Coins',
                desc: 'ONE token per creator. Build trust, grow community.',
              },
              {
                icon: <BoltIcon className="h-8 w-8" />,
                title: 'Private Trading',
                desc: 'Show results, hide strategies. Keep your alpha safe.',
              },
              {
                icon: <ChartBarIcon className="h-8 w-8" />,
                title: 'Unified Platform',
                desc: 'One place for content, community, and commerce.',
              },
              {
                icon: <RocketLaunchIcon className="h-8 w-8" />,
                title: 'Revenue Streams',
                desc: 'Token sales + tips + premium content = $10-25K/mo',
              },
              {
                icon: <CheckCircleIcon className="h-8 w-8" />,
                title: 'Network Effects',
                desc: 'Early users get followers, visibility, and growth.',
              },
            ].map((feature, idx) => (
              <div key={idx} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-accent-green/50 transition-all hover:scale-105">
                <div className="text-accent-green mb-4">{feature.icon}</div>
                <h3 className="text-xl font-black text-white mb-2">{feature.title}</h3>
                <p className="text-white/70 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / Testimonials */}
      <section className="py-20 px-6 bg-gradient-to-b from-transparent to-accent-green/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-center mb-16">
            What <span className="text-accent-green">Early Testers</span> Are Saying
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: 'Finally, a way to monetize my trading without ruining my reputation. Made $15K in my first month.',
                author: '@CryptoWhale_77',
                result: '+$15K/mo',
              },
              {
                quote: 'The verified layer changed everything. My followers trust me now. Token up 400% since launch.',
                author: '@SolTrader99',
                result: '+400% Token',
              },
              {
                quote: 'I was skeptical, but the beta changed my life. Finally making consistent income from trading content.',
                author: '@DeFiDegen',
                result: '+$22K/mo',
              },
            ].map((testimonial, idx) => (
              <div key={idx} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-accent-green/50 transition-all">
                <p className="text-white/90 italic mb-6">&quot;{testimonial.quote}&quot;</p>
                <div className="flex items-center justify-between">
                  <span className="text-accent-green font-bold">{testimonial.author}</span>
                  <span className="text-white/60 font-semibold text-sm">{testimonial.result}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Market Validation */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-8">
            Why <span className="text-accent-green">Now</span>?
          </h2>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="bg-gradient-to-br from-accent-green/20 to-accent-cyan/20 border border-accent-green/30 rounded-2xl p-8">
              <div className="text-5xl font-black text-accent-green mb-2">$850M+</div>
              <p className="text-white/70">Pump.fun volume (last 30 days)</p>
            </div>
            <div className="bg-gradient-to-br from-accent-cyan/20 to-accent-blue/20 border border-accent-cyan/30 rounded-2xl p-8">
              <div className="text-5xl font-black text-accent-cyan mb-2">50K+</div>
              <p className="text-white/70">Active traders looking for verified creators</p>
            </div>
          </div>

          <p className="text-xl text-white/70 leading-relaxed">
            The verified creator economy is <span className="text-accent-green font-bold">exploding</span>.
            Early adopters are capturing the majority of value.
            The window is <span className="text-red-400 font-bold">closing fast</span>.
          </p>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 px-6 bg-gradient-to-b from-transparent to-accent-green/10">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-6">
            Don&apos;t Get Left Behind
          </h2>
          <p className="text-xl text-white/70 mb-10">
            {slotsRemaining} beta slots left. Closes Sunday.
          </p>

          {!showSuccess && (
            <Button
              onClick={() => {
                const form = document.querySelector('form');
                form?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-gradient-to-r from-accent-green via-accent-cyan to-accent-green bg-[length:200%_100%] hover:bg-[position:100%_0] text-black font-black text-xl py-6 px-12 rounded-xl transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-accent-green/50"
            >
              CLAIM YOUR SLOT NOW
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-2xl font-black bg-gradient-to-r from-accent-green to-accent-cyan bg-clip-text text-transparent">
            FlexIt
          </div>
          <div className="flex gap-6 text-white/60 text-sm">
            <a href="https://twitter.com/flexstream" className="hover:text-accent-green transition-colors">Twitter</a>
            <a href="https://t.me/flexstream" className="hover:text-accent-green transition-colors">Telegram</a>
            <a href="https://discord.gg/flexstream" className="hover:text-accent-green transition-colors">Discord</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function WaitlistPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent-green border-t-transparent"></div>
      </div>
    }>
      <WaitlistPageContent />
    </Suspense>
  );
}
