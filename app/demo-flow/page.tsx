'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CurrencyDollarIcon, 
  FireIcon, 
  UserGroupIcon, 
  ChartBarIcon,
  PlayIcon,
  ShareIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  ArrowTrendingUpIcon,
  StarIcon,
  ShieldCheckIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

const CREATOR_JOURNEY = [
  {
    step: 1,
    title: "Sign Up & Connect Wallet",
    description: "Creators connect their Solana wallet and set up their profile",
    icon: UserGroupIcon,
    benefits: ["Instant verification", "Secure wallet connection", "Profile customization"]
  },
  {
    step: 2,
    title: "Share Earnings Flexes",
    description: "Post verified trading profits and pump.fun success stories",
    icon: CurrencyDollarIcon,
    benefits: ["Build credibility", "Attract followers", "Showcase expertise"]
  },
  {
    step: 3,
    title: "Stream Highlights",
    description: "Share clips from live trading streams and calls",
    icon: PlayIcon,
    benefits: ["Engage audience", "Drive traffic to streams", "Build community"]
  },
  {
    step: 4,
    title: "Grow Following",
    description: "Build a loyal community of traders and followers",
    icon: ArrowTrendingUpIcon,
    benefits: ["Increase influence", "Monetize content", "Create partnerships"]
  }
];

const PLATFORM_VALUE = [
  {
    category: "Monetization",
    icon: CurrencyDollarIcon,
    title: "Direct Revenue Streams",
    items: [
      "Premium content gating with token holdings",
      "Sponsored posts and partnerships",
      "Affiliate commissions from trading tools",
      "Exclusive alpha access for followers"
    ]
  },
  {
    category: "Community Building",
    icon: UserGroupIcon,
    title: "Engaged Audience",
    items: [
      "Real-time engagement with posts",
      "Follower notifications for new content",
      "Community-driven verification system",
      "Cross-platform promotion tools"
    ]
  },
  {
    category: "Credibility",
    icon: ShieldCheckIcon,
    title: "Verified Success",
    items: [
      "Blockchain-verified earnings",
      "Transparent trading history",
      "Success tier system (Bronze → Diamond)",
      "Anti-fake verification measures"
    ]
  },
  {
    category: "Analytics",
    icon: ChartBarIcon,
    title: "Performance Insights",
    items: [
      "Detailed engagement metrics",
      "Earnings tracking and trends",
      "Follower growth analytics",
      "Content performance data"
    ]
  }
];

const SUCCESS_STORIES = [
  {
    name: "CryptoTrader99",
    tier: "diamond",
    earnings: "$250K",
    followers: "15.4K",
    story: "Started with $1K, now making $50K+ per month. FlexStream helped me build credibility and attract premium followers.",
    posts: 47,
    verified: true
  },
  {
    name: "PumpMaster",
    tier: "gold", 
    earnings: "$180K",
    followers: "12.3K",
    story: "My stream highlights on FlexStream drive 3x more traffic to my live streams. The community is incredible.",
    posts: 32,
    verified: true
  },
  {
    name: "SolanaGuru",
    tier: "silver",
    earnings: "$75K", 
    followers: "8.7K",
    story: "The verification system helped me stand out from fake traders. Now I have a loyal following of serious traders.",
    posts: 28,
    verified: true
  }
];

export default function DemoFlowPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('journey');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            How Creators & Pump Streamers Use FlexStream
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Discover how successful traders and streamers leverage our platform to build communities, 
            showcase earnings, and monetize their expertise in the pump.fun ecosystem.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-1 border border-white/20">
            <button
              onClick={() => setActiveTab('journey')}
              className={`px-6 py-2 rounded-md transition-all ${
                activeTab === 'journey' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Creator Journey
            </button>
            <button
              onClick={() => setActiveTab('value')}
              className={`px-6 py-2 rounded-md transition-all ${
                activeTab === 'value' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Creator Value
            </button>
            <button
              onClick={() => setActiveTab('consumers')}
              className={`px-6 py-2 rounded-md transition-all ${
                activeTab === 'consumers' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Consumer Benefits
            </button>
            <button
              onClick={() => setActiveTab('success')}
              className={`px-6 py-2 rounded-md transition-all ${
                activeTab === 'success' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Success Stories
            </button>
          </div>
        </div>

        {/* Creator Journey */}
        {activeTab === 'journey' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-white text-center mb-8">
              The Creator Journey on FlexStream
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {CREATOR_JOURNEY.map((step, index) => (
                <Card key={step.step} className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader className="text-center">
                    <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <step.icon className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-white text-lg">{step.title}</CardTitle>
                    <CardDescription className="text-gray-300">
                      {step.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {step.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-center text-sm text-gray-300">
                          <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Call to Action */}
            <div className="text-center mt-12">
              <Button 
                size="lg" 
                className="flexstream-gradient text-white px-8 py-3"
                onClick={() => router.push('/auth/signup')}
              >
                <RocketLaunchIcon className="w-5 h-5 mr-2" />
                Start Your Creator Journey
              </Button>
            </div>
          </div>
        )}

        {/* Platform Value */}
        {activeTab === 'value' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-white text-center mb-8">
              Value FlexStream Provides to Creators
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {PLATFORM_VALUE.map((value, index) => (
                <Card key={index} className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader>
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                        <value.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-white">{value.title}</CardTitle>
                        <CardDescription className="text-gray-300">{value.category}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {value.items.map((item, i) => (
                        <li key={i} className="flex items-start text-gray-300">
                          <StarIcon className="w-5 h-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12">
              <Card className="bg-white/10 backdrop-blur-md border-white/20 text-center">
                <CardContent className="p-6">
                  <CurrencyDollarIcon className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-white mb-2">$2.5M+</div>
                  <div className="text-gray-300">Total Verified Earnings</div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/10 backdrop-blur-md border-white/20 text-center">
                <CardContent className="p-6">
                  <UserGroupIcon className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-white mb-2">50K+</div>
                  <div className="text-gray-300">Active Creators</div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/10 backdrop-blur-md border-white/20 text-center">
                <CardContent className="p-6">
                  <FireIcon className="w-12 h-12 text-orange-400 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-white mb-2">1M+</div>
                  <div className="text-gray-300">Posts Created</div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/10 backdrop-blur-md border-white/20 text-center">
                <CardContent className="p-6">
                  <ChartBarIcon className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-white mb-2">95%</div>
                  <div className="text-gray-300">Creator Satisfaction</div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Consumer Benefits */}
        {activeTab === 'consumers' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-white text-center mb-8">
              Benefits for Content Consumers & Traders
            </h2>
            
            {/* Main Benefits Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Alpha Access */}
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                      <ArrowTrendingUpIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-white">Early Alpha Access</CardTitle>
                      <CardDescription className="text-gray-300">Get first access to profitable trades</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-start text-gray-300">
                      <StarIcon className="w-5 h-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                      Follow verified traders with proven track records
                    </li>
                    <li className="flex items-start text-gray-300">
                      <StarIcon className="w-5 h-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                      Get notified of new pump.fun launches before they moon
                    </li>
                    <li className="flex items-start text-gray-300">
                      <StarIcon className="w-5 h-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                      Access exclusive trading signals and analysis
                    </li>
                    <li className="flex items-start text-gray-300">
                      <StarIcon className="w-5 h-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                      Join private communities of successful traders
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Educational Content */}
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                      <ChartBarIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-white">Learning & Education</CardTitle>
                      <CardDescription className="text-gray-300">Learn from the best traders</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-start text-gray-300">
                      <StarIcon className="w-5 h-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                      Watch stream highlights and trading breakdowns
                    </li>
                    <li className="flex items-start text-gray-300">
                      <StarIcon className="w-5 h-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                      Learn risk management and trading strategies
                    </li>
                    <li className="flex items-start text-gray-300">
                      <StarIcon className="w-5 h-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                      Understand market psychology and timing
                    </li>
                    <li className="flex items-start text-gray-300">
                      <StarIcon className="w-5 h-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                      Access educational content from top performers
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Community & Networking */}
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                      <UserGroupIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-white">Community & Networking</CardTitle>
                      <CardDescription className="text-gray-300">Connect with like-minded traders</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-start text-gray-300">
                      <StarIcon className="w-5 h-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                      Join discussions with successful traders
                    </li>
                    <li className="flex items-start text-gray-300">
                      <StarIcon className="w-5 h-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                      Share your own trading experiences
                    </li>
                    <li className="flex items-start text-gray-300">
                      <StarIcon className="w-5 h-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                      Build relationships with top performers
                    </li>
                    <li className="flex items-start text-gray-300">
                      <StarIcon className="w-5 h-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                      Get feedback on your trading strategies
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Risk Management */}
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                      <ShieldCheckIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-white">Risk Management</CardTitle>
                      <CardDescription className="text-gray-300">Trade smarter with verified data</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-start text-gray-300">
                      <StarIcon className="w-5 h-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                      Verify trader performance before following
                    </li>
                    <li className="flex items-start text-gray-300">
                      <StarIcon className="w-5 h-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                      See real earnings and success rates
                    </li>
                    <li className="flex items-start text-gray-300">
                      <StarIcon className="w-5 h-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                      Avoid fake traders and pump schemes
                    </li>
                    <li className="flex items-start text-gray-300">
                      <StarIcon className="w-5 h-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                      Make informed decisions with transparent data
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Consumer Journey */}
            <div className="mt-12">
              <h3 className="text-2xl font-bold text-white text-center mb-8">
                How Traders Benefit from FlexStream
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader className="text-center">
                    <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-white font-bold text-xl">1</span>
                    </div>
                    <CardTitle className="text-white">Discover</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 text-center">
                      Find verified traders with proven track records and follow their success stories
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader className="text-center">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-white font-bold text-xl">2</span>
                    </div>
                    <CardTitle className="text-white">Learn</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 text-center">
                      Watch stream highlights, read trading insights, and learn from the best performers
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader className="text-center">
                    <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-white font-bold text-xl">3</span>
                    </div>
                    <CardTitle className="text-white">Profit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 text-center">
                      Apply learned strategies, get early alpha, and improve your trading performance
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Consumer Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12">
              <Card className="bg-white/10 backdrop-blur-md border-white/20 text-center">
                <CardContent className="p-6">
                  <ArrowTrendingUpIcon className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-white mb-2">+127%</div>
                  <div className="text-gray-300">Avg. Portfolio Growth</div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/10 backdrop-blur-md border-white/20 text-center">
                <CardContent className="p-6">
                  <UserGroupIcon className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-white mb-2">85%</div>
                  <div className="text-gray-300">Users Report Better Trades</div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/10 backdrop-blur-md border-white/20 text-center">
                <CardContent className="p-6">
                  <FireIcon className="w-12 h-12 text-orange-400 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-white mb-2">2.3x</div>
                  <div className="text-gray-300">Faster Learning Curve</div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/10 backdrop-blur-md border-white/20 text-center">
                <CardContent className="p-6">
                  <ShieldCheckIcon className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-white mb-2">92%</div>
                  <div className="text-gray-300">Avoid Scams & Rugpulls</div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Success Stories */}
        {activeTab === 'success' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-white text-center mb-8">
              Real Creator Success Stories
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {SUCCESS_STORIES.map((story, index) => (
                <Card key={index} className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {story.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <CardTitle className="text-white text-lg">{story.name}</CardTitle>
                          <Badge className={`${story.tier === 'diamond' ? 'bg-blue-600' : story.tier === 'gold' ? 'bg-yellow-600' : 'bg-gray-600'} text-white`}>
                            {story.tier.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      {story.verified && (
                        <ShieldCheckIcon className="w-6 h-6 text-green-400" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">{story.earnings}</div>
                        <div className="text-xs text-gray-400">Earnings</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400">{story.followers}</div>
                        <div className="text-xs text-gray-400">Followers</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-400">{story.posts}</div>
                        <div className="text-xs text-gray-400">Posts</div>
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm italic">
                      "{story.story}"
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Engagement Stats */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-center">Platform Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <HeartIcon className="w-8 h-8 text-red-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">2.3M</div>
                    <div className="text-sm text-gray-400">Total Likes</div>
                  </div>
                  <div className="text-center">
                    <ChatBubbleLeftRightIcon className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">180K</div>
                    <div className="text-sm text-gray-400">Comments</div>
                  </div>
                  <div className="text-center">
                    <ShareIcon className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">95K</div>
                    <div className="text-sm text-gray-400">Shares</div>
                  </div>
                  <div className="text-center">
                    <PlayIcon className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">500K</div>
                    <div className="text-sm text-gray-400">Stream Views</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <Card className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-md border-purple-400/30 max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-white mb-4">
                Ready to Start Your Creator Journey?
              </h3>
              <p className="text-gray-300 mb-6">
                Join thousands of successful traders and streamers who are building their communities on FlexStream.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="flexstream-gradient text-white"
                  onClick={() => router.push('/auth/signup')}
                >
                  <RocketLaunchIcon className="w-5 h-5 mr-2" />
                  Get Started Free
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                  onClick={() => router.push('/demo')}
                >
                  View Live Demo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
