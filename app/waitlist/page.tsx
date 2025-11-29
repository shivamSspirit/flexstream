'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWaitlistStats, useJoinWaitlist, useCountdown } from '@/hooks/useWaitlist';
import { Button } from '@/components/ui/button';
import {
  CheckCircleIcon,
  SparklesIcon,
  ShieldCheckIcon,
  BoltIcon,
  ChartBarIcon,
  FireIcon,
  CurrencyDollarIcon,
  LockClosedIcon,
  UserGroupIcon,
  EyeSlashIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { Logo } from '@/components/layout/Logo';

function WaitlistPageContent() {
  const searchParams = useSearchParams();
  const referralCode = searchParams.get('ref');

  const [email, setEmail] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

  const { data: stats } = useWaitlistStats();
  const joinMutation = useJoinWaitlist();

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
    <div className="min-h-screen bg-black">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-black/80 backdrop-blur-xl border-b border-white/10 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-4">
            <span className="text-white/60 text-sm hidden sm:inline">Beta Access</span>
            <div className="px-3 sm:px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-full animate-pulse">
              <span className="text-red-400 font-bold text-xs sm:text-sm">{slotsRemaining}/100 LEFT</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Beta Badge */}
          <div className="inline-flex items-center gap-2 bg-accent-green/10 border border-accent-green/30 rounded-full px-4 py-2 mb-6">
            <SparklesIcon className="h-4 w-4 text-accent-green" />
            <span className="text-accent-green text-sm font-semibold">BETA TESTING NOW • 100 SPOTS ONLY</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-[1.1]">
            <span className="bg-gradient-to-r from-accent-green via-accent-cyan to-accent-blue bg-clip-text text-transparent">
              Share. Flex. Socialize.
            </span>
            <br />
            <span className="text-white">Create to Earn.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-white/70 mb-4 font-semibold max-w-3xl">
            The social app where <span className="text-accent-green">crypto creators get paid</span>.
            Post your wins, launch tokens, build your tribe—<span className="text-accent-cyan">stack income</span> while you vibe.
          </p>
          <p className="text-lg text-white/50 mb-10 max-w-2xl">
            No fake screenshots. No trust issues. Just verified on-chain flex + real money from your content.
          </p>

          {/* CTA Form */}
          {!showSuccess ? (
            <div className="max-w-2xl mb-8">
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mb-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 bg-white/10 border border-white/20 rounded-xl px-6 py-4 text-white placeholder:text-white/40 text-lg focus:outline-none focus:border-accent-green focus:ring-2 focus:ring-accent-green/20 transition-all"
                  required
                />
                <Button
                  type="submit"
                  disabled={joinMutation.isPending}
                  className="bg-gradient-to-r from-accent-green to-accent-cyan text-black font-black text-lg px-8 py-4 rounded-xl hover:scale-105 transition-all disabled:opacity-50 h-auto whitespace-nowrap"
                >
                  {joinMutation.isPending ? 'JOINING THE VIBE...' : 'JOIN THE BETA 🚀'}
                </Button>
              </form>

              {/* Social Proof + Countdown */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2 text-white/40">
                  <UserGroupIcon className="h-4 w-4" />
                  <span>Join @SolanaGod, @CryptoKing, @DeFiWhale + {slotsClaimed} others</span>
                </div>
                <div className="flex items-center gap-2 text-white/40">
                  <span>Closes in:</span>
                  <span className="text-accent-green font-bold">
                    {String(timeLeft.days).padStart(2, '0')}d {String(timeLeft.hours).padStart(2, '0')}h {String(timeLeft.minutes).padStart(2, '0')}m
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mb-8 bg-accent-green/10 border-2 border-accent-green/50 rounded-2xl p-8">
              <CheckCircleIcon className="h-16 w-16 text-accent-green mx-auto mb-4" />
              <h3 className="text-2xl font-black text-white mb-2 text-center">You&apos;re on the list!</h3>
              <p className="text-white/60 mb-6 text-center">
                Position <span className="text-accent-green font-black text-xl">#{successData?.position}</span>
              </p>

              <div className="bg-black/40 rounded-xl p-4 mb-4">
                <p className="text-white/40 text-xs mb-2">Your referral link:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={successData?.referralUrl || ''}
                    readOnly
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm font-mono"
                  />
                  <Button
                    onClick={copyReferralLink}
                    className="bg-accent-green hover:bg-accent-green/90 text-black font-bold px-4 whitespace-nowrap"
                  >
                    Copy Link
                  </Button>
                </div>
              </div>

              <p className="text-accent-green text-sm font-semibold text-center">
                💡 Share your link to skip ahead • Each referral = +3 positions
              </p>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl">
            {[
              { value: '$5B+', label: 'Solana DEX Volume', sublabel: 'Last 30 Days' },
              { value: '100K+', label: 'Active Traders', sublabel: 'On Solana Daily' },
              { value: slotsClaimed, label: 'Beta Signups', sublabel: `${slotsRemaining} Spots Left` },
              { value: '$10-25K', label: 'Monthly Income', sublabel: 'Top Creators' },
            ].map((stat, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-accent-green/30 transition-all">
                <div className="text-2xl md:text-3xl font-black text-accent-green mb-1">{stat.value}</div>
                <div className="text-white/70 text-sm font-semibold mb-1">{stat.label}</div>
                <div className="text-white/40 text-xs">{stat.sublabel}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The 3 Problems - With Visual Examples */}
      <section className="py-20 px-6 bg-gradient-to-b from-transparent via-red-950/10 to-transparent">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-black mb-4">
              The Problem: <span className="text-red-400">Crypto Clout Doesn&apos;t Pay Bills</span>
            </h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              You&apos;re crushing it on-chain but can&apos;t turn followers into income. Here&apos;s why 👇
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <FireIcon className="h-12 w-12" />,
                problem: 'Multi-Token = Instant Distrust',
                impact: 'Launch 2+ tokens, buyers label you a scammer',
                pain: [
                  'Lost credibility overnight',
                  'Followers unfollow after 2nd token',
                  'Cannot build sustainable brand',
                  'Forced to create new wallets'
                ],
                stat: '78%',
                statLabel: 'of traders lose followers after 2nd token'
              },
              {
                icon: <EyeSlashIcon className="h-12 w-12" />,
                problem: 'Your Wallet = Your Competitors Edge',
                impact: 'Public wallet means competitors copy everything',
                pain: [
                  'Alpha leaked to everyone',
                  'Trades get front-run',
                  'Strategies copied instantly',
                  'No competitive advantage'
                ],
                stat: '$2.4M',
                statLabel: 'avg value leaked per successful trader'
              },
              {
                icon: <CurrencyDollarIcon className="h-12 w-12" />,
                problem: 'Scattered = No Monetization',
                impact: 'Twitter + Telegram + Pump = fragmented audience',
                pain: [
                  'Cannot charge for premium content',
                  'No recurring revenue streams',
                  'Community growth is slow',
                  'One-time token sales only'
                ],
                stat: '91%',
                statLabel: 'of traders make <$5K/month from content'
              },
            ].map((item, idx) => (
              <div key={idx} className="bg-gradient-to-br from-red-950/20 to-red-900/10 border border-red-500/30 rounded-2xl p-8 hover:border-red-500/50 transition-all group">
                <div className="text-red-400 mb-6 group-hover:scale-110 transition-transform">{item.icon}</div>

                <div className="mb-4">
                  <div className="text-4xl font-black text-red-400 mb-1">{item.stat}</div>
                  <div className="text-red-400/60 text-xs font-medium uppercase">{item.statLabel}</div>
                </div>

                <h3 className="text-xl font-black text-white mb-2">{item.problem}</h3>
                <p className="text-red-400 font-semibold mb-4 text-sm">{item.impact}</p>

                <ul className="space-y-2">
                  {item.pain.map((point, i) => (
                    <li key={i} className="text-white/50 text-sm flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Solution - Feature Showcase */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-black mb-4">
              <span className="bg-gradient-to-r from-accent-green to-accent-cyan bg-clip-text text-transparent">FlexIt:</span> Where Your <span className="text-white">Vibe = Your Income</span>
            </h2>
            <p className="text-white/60 text-lg max-w-3xl mx-auto">
              Post. Launch tokens. Build community. Get paid. All in one app. It&apos;s giving main character energy 💅
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Feature 1: Verified Profiles */}
            <div className="bg-gradient-to-br from-accent-green/10 to-accent-green/5 border border-accent-green/30 rounded-2xl p-8 hover:border-accent-green/50 transition-all">
              <ShieldCheckIcon className="h-10 w-10 text-accent-green mb-4" />
              <h3 className="text-2xl font-black text-white mb-3">Verified Creator Profiles</h3>
              <p className="text-white/70 mb-4 leading-relaxed">
                On-chain verification proves your trading history. No fake screenshots. Full transparency builds real trust.
              </p>
              <ul className="space-y-2 mb-4">
                {[
                  'Blockchain-verified performance history',
                  'Achievement badges from real trades',
                  'Complete token launch portfolio',
                  'Twitter + wallet verification'
                ].map((feature, i) => (
                  <li key={i} className="text-accent-green text-sm flex items-center gap-2">
                    <CheckCircleIcon className="h-4 w-4 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Feature 2: Private Token Launches */}
            <div className="bg-gradient-to-br from-accent-cyan/10 to-accent-cyan/5 border border-accent-cyan/30 rounded-2xl p-8 hover:border-accent-cyan/50 transition-all">
              <LockClosedIcon className="h-10 w-10 text-accent-cyan mb-4" />
              <h3 className="text-2xl font-black text-white mb-3">Private Token Launches</h3>
              <p className="text-white/70 mb-4 leading-relaxed">
                Launch tokens to your holders only. Protect your alpha. Keep competitors in the dark.
              </p>
              <ul className="space-y-2 mb-4">
                {[
                  'Token holders-only access',
                  'Private signals & trades',
                  'Protected strategies',
                  'Community-first launches'
                ].map((feature, i) => (
                  <li key={i} className="text-accent-cyan text-sm flex items-center gap-2">
                    <CheckCircleIcon className="h-4 w-4 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Feature 3: Dual Token System */}
            <div className="bg-gradient-to-br from-accent-blue/10 to-accent-blue/5 border border-accent-blue/30 rounded-2xl p-8 hover:border-accent-blue/50 transition-all">
              <SparklesIcon className="h-10 w-10 text-accent-blue mb-4" />
              <h3 className="text-2xl font-black text-white mb-3">One Creator Coin</h3>
              <p className="text-white/70 mb-4 leading-relaxed">
                Your profile gets ONE personal brand token. Launch unlimited post-level tokens without stigma.
              </p>
              <ul className="space-y-2 mb-4">
                {[
                  'Profile token: Your personal brand',
                  'Post tokens: Monetize each update',
                  'No "multi-token scammer" label',
                  'Build portfolio credibility'
                ].map((feature, i) => (
                  <li key={i} className="text-accent-blue text-sm flex items-center gap-2">
                    <CheckCircleIcon className="h-4 w-4 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Feature 4: Multiple Revenue Streams */}
            <div className="bg-gradient-to-br from-accent-purple/10 to-accent-purple/5 border border-accent-purple/30 rounded-2xl p-8 hover:border-accent-purple/50 transition-all">
              <CurrencyDollarIcon className="h-10 w-10 text-accent-purple mb-4" />
              <h3 className="text-2xl font-black text-white mb-3">Recurring Income</h3>
              <p className="text-white/70 mb-4 leading-relaxed">
                Turn one-time followers into recurring revenue. Build sustainable creator business.
              </p>
              <ul className="space-y-2 mb-4">
                {[
                  'Premium subscriptions ($20-100/mo)',
                  'Direct tips in SOL or tokens',
                  'Token trading fees',
                  'Copy trading commissions'
                ].map((feature, i) => (
                  <li key={i} className="text-accent-purple text-sm flex items-center gap-2">
                    <CheckCircleIcon className="h-4 w-4 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Additional Features Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <ChartBarIcon className="h-8 w-8" />,
                title: 'Social Feed & Engagement',
                desc: 'Post, like, comment, share. Build your audience organically.'
              },
              {
                icon: <BoltIcon className="h-8 w-8" />,
                title: 'Instant Token Creation',
                desc: 'Free token launches. Instant liquidity pools. Trade immediately.'
              },
              {
                icon: <RocketLaunchIcon className="h-8 w-8" />,
                title: 'Network Effects',
                desc: 'Early creators get maximum visibility and follower growth.'
              },
            ].map((feature, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-accent-green/30 hover:bg-white/10 transition-all group">
                <div className="text-accent-green mb-3 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h4 className="text-lg font-black text-white mb-2">{feature.title}</h4>
                <p className="text-white/60 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Simple Steps */}
      <section className="py-20 px-6 bg-gradient-to-b from-transparent to-accent-green/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-black mb-4">
              Three Steps to <span className="text-accent-green">Start Earning</span>
            </h2>
            <p className="text-white/60 text-lg">Setup takes less time than a coffee break ☕</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Connect & Flex',
                desc: 'Link your Solana wallet + Twitter. We verify your on-chain history automatically. No cap.',
                icon: <ShieldCheckIcon className="h-8 w-8" />
              },
              {
                step: '02',
                title: 'Launch Your Coin',
                desc: 'Drop your creator token. You get 50%, liquidity gets 50%. Your personal brand is now tradeable.',
                icon: <SparklesIcon className="h-8 w-8" />
              },
              {
                step: '03',
                title: 'Post. Vibe. Get Paid.',
                desc: 'Share alpha, launch post tokens, charge for premium content. Stack multiple income streams daily.',
                icon: <CurrencyDollarIcon className="h-8 w-8" />
              },
            ].map((step, idx) => (
              <div key={idx} className="relative">
                {idx < 2 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-accent-green to-accent-cyan"></div>
                )}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-accent-green/50 transition-all relative z-10">
                  <div className="text-accent-green mb-4">{step.icon}</div>
                  <div className="text-6xl font-black text-white/10 mb-4">{step.step}</div>
                  <h3 className="text-xl font-black text-white mb-3">{step.title}</h3>
                  <p className="text-white/60 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials - Beta Results */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-black mb-4">
              Early Users Are <span className="text-accent-green">Eating Good</span> 🍽️
            </h2>
            <p className="text-white/60 text-lg">The receipts speak for themselves 📈</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: 'ngl this app lowkey changed my life. dropped 15 post tokens in a month, nobody called me a scammer, and i made $15K. im never going back to regular twitter.',
                author: '@CryptoWhale_77',
                role: 'Solana Degen',
                result: '+$15K',
                metric: 'First Month',
                avatar: '🐋'
              },
              {
                quote: 'finally an app that gets it. everything on-chain so no cap allowed. my community actually trusts me now. token up 400% just vibing.',
                author: '@SolTrader99',
                role: 'Token Launcher',
                result: '+400%',
                metric: 'Token Growth',
                avatar: '⚡'
              },
              {
                quote: 'the private launches hit different. i share alpha with my holders only, competitors stay mad, and im stacking $22K/mo from subscriptions. this is the way.',
                author: '@DeFiDegen',
                role: 'Alpha Caller',
                result: '+$22K',
                metric: 'Monthly Recurring',
                avatar: '🎯'
              },
            ].map((testimonial, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-accent-green/30 transition-all">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-accent-green to-accent-cyan rounded-full flex items-center justify-center text-2xl">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="text-accent-green font-bold">{testimonial.author}</div>
                    <div className="text-white/40 text-xs">{testimonial.role}</div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-4xl font-black text-accent-green mb-1">{testimonial.result}</div>
                  <div className="text-white/40 text-xs">{testimonial.metric}</div>
                </div>

                <p className="text-white/70 leading-relaxed italic">&quot;{testimonial.quote}&quot;</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA - Urgent */}
      <section className="py-32 px-6 bg-gradient-to-b from-transparent to-accent-green/10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-red-500/20 border border-red-500/50 rounded-full px-6 py-3 mb-8 animate-pulse">
            <BoltIcon className="h-5 w-5 text-red-400" />
            <span className="text-red-400 font-black">{slotsRemaining} BETA SLOTS LEFT</span>
          </div>

          <h2 className="text-5xl md:text-7xl font-black mb-6">
            <span className="text-white">Don&apos;t Sleep On This</span>
            <br />
            <span className="text-accent-green">Limited Spots Only</span>
          </h2>

          <p className="text-2xl text-white/70 mb-4">
            First 100 creators get the VIP treatment fr fr 💎
          </p>
          <p className="text-lg text-white/50 mb-12 max-w-2xl mx-auto">
            Beta perks: Priority support • Early features • Founder badge • Free premium forever • Boosted visibility • Direct line to our team
          </p>

          {!showSuccess && (
            <Button
              onClick={() => {
                document.querySelector('form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              className="bg-gradient-to-r from-accent-green to-accent-cyan text-black font-black text-xl px-12 py-6 rounded-xl hover:scale-110 transition-all shadow-lg hover:shadow-accent-green/50 mb-6"
            >
              SECURE YOUR SPOT 🔐
            </Button>
          )}

          <p className="text-white/40 text-sm">
            Closes in {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m • No credit card required
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <div className="flex flex-col items-center md:items-start">
              <Logo size="sm" className="mb-3" />
              <p className="text-white/40 text-sm text-center md:text-left">Where crypto creators get paid</p>
            </div>
            <div className="flex gap-6 text-white/40 text-sm">
              <a href="https://twitter.com/flexit" className="hover:text-accent-green transition-colors">
                Twitter
              </a>
              <a href="https://t.me/flexit" className="hover:text-accent-green transition-colors">
                Telegram
              </a>
              <a href="https://discord.gg/flexit" className="hover:text-accent-green transition-colors">
                Discord
              </a>
            </div>
          </div>
          <div className="text-center text-white/30 text-xs">
            © 2025 FlexIt. Built for verified creators. Powered by Solana.
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
