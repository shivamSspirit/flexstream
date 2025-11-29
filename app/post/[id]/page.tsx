'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useWallet } from '@jup-ag/wallet-adapter';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  ArrowLeftIcon,
  ShareIcon,
  EllipsisHorizontalIcon,
  ChartBarIcon,
  DocumentDuplicateIcon,
  ClockIcon,
  UserGroupIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { LoadingSpinner } from '@/components/ui/loading';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { connected, publicKey } = useWallet();
  const postId = params.id as string;

  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('comments');
  const [mediaView, setMediaView] = useState<'image' | 'chart'>('image');

  // Trading state
  const [tradeAmount, setTradeAmount] = useState('0.000111');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [selectedToken, setSelectedToken] = useState('SOL');

  useEffect(() => {
    if (postId) {
      fetchPost();
      fetchComments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const fetchPost = async () => {
    try {
      if (!supabase) {
        console.error('Supabase not configured');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:users(*)
        `)
        .eq('id', postId)
        .single();

      if (error) {
        console.error('Error fetching post:', error);
        toast.error('Failed to load post');
        setLoading(false);
        return;
      }

      setPost(data);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          user:users(*)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setComments(data);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim() || !connected || !publicKey) {
      toast.error('Please connect wallet and enter a comment');
      return;
    }

    try {
      if (!supabase) return;

      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('wallet_address', publicKey.toBase58())
        .single();

      if (!user) {
        toast.error('User not found');
        return;
      }

      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: comment,
        });

      if (error) {
        console.error('Error adding comment:', error);
        toast.error('Failed to add comment');
        return;
      }

      setComment('');
      fetchComments();
      toast.success('Comment added!');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to add comment');
    }
  };

  const copyAddress = () => {
    if (post?.token_mint) {
      navigator.clipboard.writeText(post.token_mint);
      toast.success('Token address copied!');
    }
  };

  const getExplorerLinks = (tokenMint: string, poolAddress?: string) => {
    return {
      solscan: `https://solscan.io/token/${tokenMint}`,
      dexscreener: poolAddress ? `https://dexscreener.com/solana/${poolAddress}` : `https://dexscreener.com/solana/${tokenMint}`,
      solanaExplorer: `https://explorer.solana.com/address/${tokenMint}`,
      birdeye: `https://birdeye.so/token/${tokenMint}?chain=solana`,
      coingecko: `https://www.coingecko.com/en/coins/solana-ecosystem`,
      photon: poolAddress ? `https://photon-sol.tinyastro.io/en/lp/${poolAddress}` : null,
    };
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-app-bg">
        <LoadingSpinner message="Loading post" submessage="Fetching content..." />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Post not found</h2>
          <Button onClick={() => router.push('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  const timeAgo = post.created_at ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true }) : '';

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-20 md:pb-0">
      {/* Top Navigation - Mobile First */}
      <div className="border-b border-white/10 bg-[#0a0a0a]/95 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-2 sm:py-3 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-1.5 sm:p-2 hover:bg-white/5 rounded-full transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </button>

          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/5 h-8 w-8 sm:h-9 sm:w-9"
            >
              <ChartBarIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              className="text-white hover:bg-white/5 h-8 w-8 sm:h-9 sm:w-9"
            >
              <ShareIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:flex text-white hover:bg-white/5 h-8 w-8 sm:h-9 sm:w-9"
            >
              <EllipsisHorizontalIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <Button className="bg-white text-black hover:bg-gray-200 font-medium text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4 hidden sm:flex">
              Log in
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Left Column - Image/Chart */}
          <div className="relative">
            <div className="lg:sticky lg:top-20 space-y-3 sm:space-y-4">
              {/* Image View */}
              {mediaView === 'image' && (
                <>
                  {post.media_urls && post.media_urls.length > 0 ? (
                    <div className="w-full bg-black/40 border border-white/10 rounded-xl sm:rounded-2xl overflow-hidden" style={{ minHeight: '500px', maxHeight: '700px' }}>
                      <img
                        src={post.media_urls[0]}
                        alt={post.title}
                        className="w-full h-full object-cover"
                        style={{ minHeight: '500px', maxHeight: '700px' }}
                      />
                    </div>
                  ) : (
                    <div className="w-full bg-black/40 border border-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center" style={{ minHeight: '500px' }}>
                      <SparklesIcon className="w-16 h-16 sm:w-24 sm:h-24 text-white/20" />
                    </div>
                  )}
                </>
              )}

              {/* Chart View */}
              {mediaView === 'chart' && (
                <div className="w-full bg-black/40 border border-white/10 rounded-xl sm:rounded-2xl overflow-hidden" style={{ minHeight: '500px' }}>
                  {/* Chart Header */}
                  <div className="p-4 sm:p-6 border-b border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-white mb-1">
                          ${post.title?.substring(0, 10).toUpperCase()}
                        </h3>
                        <p className="text-white/60 text-xs sm:text-sm">Price Chart</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl sm:text-2xl font-bold text-white">
                          <span className="text-green-500">▲</span> $0.000614
                        </div>
                        <div className="text-xs sm:text-sm text-green-500 font-semibold">+24% (24h)</div>
                      </div>
                    </div>

                    {/* Time Range Selector */}
                    <div className="flex gap-1 sm:gap-2">
                      {['1H', '1D', '1W', '1M', 'All'].map((range) => (
                        <button
                          key={range}
                          className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                            range === '1D'
                              ? 'bg-white/15 text-white'
                              : 'text-white/50 hover:text-white/70 hover:bg-white/5'
                          }`}
                        >
                          {range}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Chart Area - Simple SVG Chart */}
                  <div className="relative p-4 sm:p-6" style={{ height: '400px' }}>
                    <svg className="w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="none">
                      {/* Grid lines */}
                      <defs>
                        <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
                        </linearGradient>
                      </defs>

                      {/* Horizontal grid lines */}
                      {[0, 1, 2, 3, 4].map((i) => (
                        <line
                          key={i}
                          x1="0"
                          y1={60 * i}
                          x2="400"
                          y2={60 * i}
                          stroke="rgba(255, 255, 255, 0.05)"
                          strokeWidth="1"
                        />
                      ))}

                      {/* Price chart line (uptrend) */}
                      <path
                        d="M 0 250 Q 50 240 100 200 T 200 150 T 300 100 T 400 50"
                        fill="url(#chartGradient)"
                        stroke="none"
                      />
                      <path
                        d="M 0 250 Q 50 240 100 200 T 200 150 T 300 100 T 400 50"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />

                      {/* Data points */}
                      {[
                        { x: 0, y: 250 },
                        { x: 100, y: 200 },
                        { x: 200, y: 150 },
                        { x: 300, y: 100 },
                        { x: 400, y: 50 }
                      ].map((point, i) => (
                        <circle
                          key={i}
                          cx={point.x}
                          cy={point.y}
                          r="4"
                          fill="#10b981"
                          className="opacity-75"
                        />
                      ))}
                    </svg>

                    {/* Chart Stats Overlay */}
                    <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 grid grid-cols-3 gap-2 sm:gap-3">
                      <div className="bg-black/60 backdrop-blur-sm rounded-lg p-2 sm:p-3 border border-white/10">
                        <p className="text-white/60 text-[10px] sm:text-xs mb-0.5">High</p>
                        <p className="text-white text-xs sm:text-sm font-bold">$0.000850</p>
                      </div>
                      <div className="bg-black/60 backdrop-blur-sm rounded-lg p-2 sm:p-3 border border-white/10">
                        <p className="text-white/60 text-[10px] sm:text-xs mb-0.5">Low</p>
                        <p className="text-white text-xs sm:text-sm font-bold">$0.000495</p>
                      </div>
                      <div className="bg-black/60 backdrop-blur-sm rounded-lg p-2 sm:p-3 border border-white/10">
                        <p className="text-white/60 text-[10px] sm:text-xs mb-0.5">Volume</p>
                        <p className="text-white text-xs sm:text-sm font-bold">$1.93</p>
                      </div>
                    </div>
                  </div>

                  {/* Chart Footer */}
                  <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-white/10 bg-black/20">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-white/60">Live Price</span>
                      </div>
                      <div className="flex items-center gap-2 text-white/60">
                        <ClockIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>Updated just now</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* View Toggle Tabs - Professional Compact Design (Centered) */}
              <div className="flex justify-center">
                <div className="flex gap-1 bg-black/60 border border-white/10 rounded-lg p-0.5">
                  <button
                    onClick={() => setMediaView('image')}
                    className={`flex items-center justify-center px-4 py-2 rounded-md transition-all ${
                      mediaView === 'image'
                        ? 'bg-white/10 text-white'
                        : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                    }`}
                    aria-label="View Image"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setMediaView('chart')}
                    className={`flex items-center justify-center px-4 py-2 rounded-md transition-all ${
                      mediaView === 'chart'
                        ? 'bg-white/10 text-white'
                        : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                    }`}
                    aria-label="View Chart"
                  >
                    <ChartBarIcon className="w-4 h-4" strokeWidth={2} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Details & Trading */}
          <div className="space-y-4 sm:space-y-6">
            {/* Creator Info */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <Avatar className="h-9 w-9 sm:h-10 sm:w-10 ring-2 ring-white/10">
                  <AvatarImage src={post.user?.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white text-sm">
                    {post.user?.username?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-white font-semibold text-sm sm:text-base">{post.user?.display_name || post.user?.username}</p>
                  <p className="text-white/60 text-xs sm:text-sm">{timeAgo}</p>
                </div>
              </div>
            </div>

            {/* Title */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{post.title}</h1>
              {post.token_mint && (
                <div className="flex items-center gap-2">
                  <span className="text-white/60 text-xs sm:text-sm font-mono">${post.title?.substring(0, 10).toUpperCase()}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyAddress}
                    className="text-white/60 hover:text-white p-1 h-auto"
                  >
                    <DocumentDuplicateIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
              <div className="bg-black/40 rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 border border-white/10">
                <p className="text-white/60 text-[10px] sm:text-xs mb-0.5 sm:mb-1">Market Cap</p>
                <p className="text-white text-sm sm:text-base md:text-lg font-bold">
                  <span className="text-green-500">▲</span> $614.06
                </p>
              </div>
              <div className="bg-black/40 rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 border border-white/10">
                <p className="text-white/60 text-[10px] sm:text-xs mb-0.5 sm:mb-1">24H Volume</p>
                <p className="text-white text-sm sm:text-base md:text-lg font-bold flex items-center gap-1">
                  <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                  $0.16
                </p>
              </div>
              <div className="bg-black/40 rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 border border-white/10">
                <p className="text-white/60 text-[10px] sm:text-xs mb-0.5 sm:mb-1">Creator Earnings</p>
                <p className="text-white text-sm sm:text-base md:text-lg font-bold">$0.02</p>
              </div>
            </div>

            {/* Trading Interface - Clean Viral Style */}
            <div className="relative overflow-hidden rounded-2xl sm:rounded-2xl bg-black/95 border border-purple-500/30 backdrop-blur-xl">
              <div className="relative p-4 sm:p-5">
                {/* Buy/Sell Toggle - Modern Pill Style */}
                <div className="relative mb-4 p-1 bg-black/60 rounded-full border border-white/10">
                  <div className="grid grid-cols-2 gap-1 relative">
                    <button
                      onClick={() => setTradeType('buy')}
                      className={`relative z-10 py-2.5 sm:py-3 rounded-full font-bold text-sm transition-all duration-300 ${
                        tradeType === 'buy'
                          ? 'text-white'
                          : 'text-white/50 hover:text-white/70'
                      }`}
                    >
                      Buy
                    </button>
                    <button
                      onClick={() => setTradeType('sell')}
                      className={`relative z-10 py-2.5 sm:py-3 rounded-full font-bold text-sm transition-all duration-300 ${
                        tradeType === 'sell'
                          ? 'text-white'
                          : 'text-white/50 hover:text-white/70'
                      }`}
                    >
                      Sell
                    </button>
                    {/* Sliding Background */}
                    <div
                      className={`absolute top-1 bottom-1 w-[calc(50%-4px)] ${
                        tradeType === 'buy'
                          ? 'bg-green-500 left-1'
                          : 'bg-red-500 right-1'
                      } rounded-full transition-all duration-300 ease-out shadow-lg`}
                    />
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  {/* Amount Input - Big & Bold */}
                  <div className="relative">
                    <div className="bg-black/40 rounded-xl sm:rounded-2xl p-4 sm:p-4 border border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-white/60 text-xs sm:text-sm font-semibold uppercase tracking-wider">You Pay</span>
                        <div className="flex items-center gap-2 bg-purple-500/20 px-3 py-1.5 rounded-full border border-purple-500/30">
                          <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center text-white text-[10px] font-black">
                            S
                          </div>
                          <span className="text-white text-xs sm:text-sm font-bold">SOL</span>
                        </div>
                      </div>
                      <Input
                        value={tradeAmount}
                        onChange={(e) => setTradeAmount(e.target.value)}
                        className="text-2xl sm:text-3xl font-black bg-transparent border-0 text-white p-0 h-auto focus-visible:ring-0 placeholder:text-white/20"
                        placeholder="0.00"
                      />
                      <div className="flex items-center justify-between mt-3">
                        <p className="text-white/40 text-xs sm:text-sm">≈ $0.00</p>
                        <button className="text-purple-400 text-xs sm:text-sm font-bold hover:text-purple-300 transition-colors">
                          Balance: 0 SOL
                        </button>
                      </div>
                    </div>

                    {/* Swap Direction Icon */}
                    <div className="absolute left-1/2 -translate-x-1/2 -bottom-5 z-10">
                      <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center shadow-lg border-4 border-[#0a0a0a]">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* You Receive */}
                  <div className="bg-black/40 rounded-xl sm:rounded-2xl p-4 sm:p-4 border border-white/10 mt-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white/60 text-xs sm:text-sm font-semibold uppercase tracking-wider">You Receive</span>
                      <div className="flex items-center gap-2 bg-pink-500/20 px-3 py-1.5 rounded-full border border-pink-500/30">
                        <div className="w-5 h-5 rounded-full bg-pink-500 flex items-center justify-center text-white text-[8px] font-black">
                          {post.title?.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-white text-xs sm:text-sm font-bold">${post.title?.substring(0, 6).toUpperCase()}</span>
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-white">
                      ~0.00
                    </div>
                    <p className="text-white/40 text-xs sm:text-sm mt-3">≈ $0.00</p>
                  </div>

                  {/* Quick Amount Buttons - Pill Style */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: '0.1' },
                      { label: '0.5' },
                      { label: '1' },
                      { label: 'Max' }
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={() => {
                          if (item.label !== 'Max') {
                            setTradeAmount(item.label);
                          }
                        }}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 rounded-full py-2.5 sm:py-3 text-white font-bold text-xs sm:text-sm transition-all hover:scale-105 active:scale-95"
                      >
                        {item.label} SOL
                      </button>
                    ))}
                  </div>

                  {/* Trade Button - Big & Eye-catching */}
                  <button
                    disabled
                    className="w-full py-4 sm:py-5 rounded-xl sm:rounded-2xl font-black text-sm sm:text-base bg-purple-500 hover:bg-purple-600 text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-purple-500/30"
                  >
                    {tradeType === 'buy' ? 'Connect Wallet to Buy' : 'Connect Wallet to Sell'}
                  </button>

                  {/* Comment Input - Clean & Simple */}
                  <div className="pt-4 border-t border-white/10">
                    <div className="relative">
                      <Input
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="bg-black/40 border border-white/10 text-white placeholder:text-white/40 h-12 sm:h-14 text-sm sm:text-base rounded-xl px-4 focus:border-purple-500/50 transition-all"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAddComment();
                          }
                        }}
                      />
                    </div>
                    <p className="text-white/40 text-xs mt-2.5 text-center">
                      Press Enter to post
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full overflow-hidden">
              <TabsList className="w-full bg-gradient-to-b from-black/60 to-black/40 backdrop-blur-sm border border-white/10 rounded-2xl p-1.5 sm:p-2 grid grid-cols-4 gap-1 sm:gap-1.5 shadow-2xl overflow-hidden">
                <TabsTrigger
                  value="comments"
                  className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-white/15 data-[state=active]:to-white/5 data-[state=active]:text-white data-[state=active]:shadow-lg text-white/50 hover:text-white/70 text-[11px] sm:text-sm font-semibold px-1.5 sm:px-4 py-2.5 sm:py-3.5 rounded-xl transition-all duration-200 hover:bg-white/5 min-w-0"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Comments
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="holders"
                  className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-white/15 data-[state=active]:to-white/5 data-[state=active]:text-white data-[state=active]:shadow-lg text-white/50 hover:text-white/70 text-[11px] sm:text-sm font-semibold px-1 sm:px-3 py-2.5 sm:py-3.5 rounded-xl transition-all duration-200 hover:bg-white/5 min-w-0"
                >
                  <div className="flex items-center justify-center gap-1 sm:gap-1.5 min-w-0">
                    <UserGroupIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    <span className="hidden md:inline truncate text-[11px] sm:text-sm">Holders</span>
                    <span className="inline-flex items-center justify-center min-w-[18px] sm:min-w-[20px] h-4 sm:h-5 text-[9px] sm:text-xs bg-purple-500/20 text-purple-300 px-1 sm:px-1.5 rounded-full font-bold border border-purple-500/30 shrink-0">6</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger
                  value="activity"
                  className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-white/15 data-[state=active]:to-white/5 data-[state=active]:text-white data-[state=active]:shadow-lg text-white/50 hover:text-white/70 text-[11px] sm:text-sm font-semibold px-1.5 sm:px-4 py-2.5 sm:py-3.5 rounded-xl transition-all duration-200 hover:bg-white/5 min-w-0"
                >
                  <span className="flex items-center gap-1 sm:gap-2 min-w-0 truncate">
                    <ChartBarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 hidden xs:block shrink-0" />
                    <span className="truncate">Activity</span>
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="details"
                  className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-white/15 data-[state=active]:to-white/5 data-[state=active]:text-white data-[state=active]:shadow-lg text-white/50 hover:text-white/70 text-[11px] sm:text-sm font-semibold px-1.5 sm:px-4 py-2.5 sm:py-3.5 rounded-xl transition-all duration-200 hover:bg-white/5 min-w-0"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Details
                  </span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="comments" className="mt-5 sm:mt-6 min-h-[300px] sm:min-h-[400px]">
                {comments.length === 0 ? (
                  <div className="bg-black/20 border border-white/5 rounded-xl sm:rounded-2xl p-12 sm:p-16 md:p-20 text-center">
                    <div className="flex flex-col items-center gap-4 sm:gap-5">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/5 flex items-center justify-center">
                        <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <div className="space-y-2">
                        <p className="text-white/70 text-base sm:text-lg font-semibold">No comments yet</p>
                        <p className="text-white/40 text-sm sm:text-base">Be the first to share your thoughts!</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="bg-black/40 border border-white/10 rounded-xl p-4 sm:p-5 hover:border-white/20 transition-all">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <Avatar className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 ring-2 ring-white/5">
                          <AvatarImage src={comment.user?.avatar_url} />
                          <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white text-sm font-semibold">
                            {comment.user?.username?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <p className="text-white font-semibold text-sm sm:text-base">{comment.user?.display_name || comment.user?.username}</p>
                            <span className="text-white/40 text-xs">•</span>
                            <p className="text-white/40 text-xs sm:text-sm">
                              {comment.created_at ? formatDistanceToNow(new Date(comment.created_at), { addSuffix: true }) : ''}
                            </p>
                          </div>
                          <p className="text-white/80 text-sm sm:text-base leading-relaxed break-words">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="holders" className="mt-5 sm:mt-6 min-h-[300px] sm:min-h-[400px]">
                <div className="bg-black/20 border border-white/5 rounded-xl sm:rounded-2xl p-12 sm:p-16 md:p-20 text-center">
                  <div className="flex flex-col items-center gap-4 sm:gap-5">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/5 flex items-center justify-center">
                      <UserGroupIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white/40" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-white/70 text-base sm:text-lg font-semibold">Holder Information</p>
                      <p className="text-white/40 text-sm sm:text-base">Track token holders and distribution</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="activity" className="mt-5 sm:mt-6 min-h-[300px] sm:min-h-[400px]">
                <div className="bg-black/20 border border-white/5 rounded-xl sm:rounded-2xl p-12 sm:p-16 md:p-20 text-center">
                  <div className="flex flex-col items-center gap-4 sm:gap-5">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/5 flex items-center justify-center">
                      <ChartBarIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white/40" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-white/70 text-base sm:text-lg font-semibold">Activity Feed</p>
                      <p className="text-white/40 text-sm sm:text-base">View trading activity and transactions</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="details" className="mt-5 sm:mt-6 min-h-[300px] sm:min-h-[400px]">
                <div className="bg-black/40 border border-white/10 rounded-xl sm:rounded-2xl p-6 sm:p-7 md:p-8 space-y-5 sm:space-y-6">
                  <div className="flex justify-between items-center gap-4 py-2">
                    <span className="text-white/60 text-sm sm:text-base font-medium">Token Symbol</span>
                    <span className="text-white font-mono text-sm sm:text-base font-semibold">${post.title?.substring(0, 10).toUpperCase()}</span>
                  </div>
                  <div className="h-px bg-white/5" />
                  {post.token_mint && (
                    <>
                      <div className="flex justify-between items-center gap-4 py-2">
                        <span className="text-white/60 text-sm sm:text-base font-medium">Contract Address</span>
                        <button
                          onClick={copyAddress}
                          className="text-white font-mono text-sm sm:text-base hover:text-purple-400 transition-colors font-semibold flex items-center gap-2"
                        >
                          {post.token_mint.slice(0, 6)}...{post.token_mint.slice(-6)}
                          <DocumentDuplicateIcon className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="h-px bg-white/5" />
                    </>
                  )}
                  <div className="flex justify-between items-center gap-4 py-2">
                    <span className="text-white/60 text-sm sm:text-base font-medium">Network</span>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">S</span>
                      </div>
                      <span className="text-white text-sm sm:text-base font-semibold">Solana</span>
                    </div>
                  </div>
                  <div className="h-px bg-white/5" />
                  <div className="flex justify-between items-center gap-4 py-2">
                    <span className="text-white/60 text-sm sm:text-base font-medium">Protocol</span>
                    <span className="text-white text-sm sm:text-base font-semibold">Meteora DBC</span>
                  </div>
                  {post.token_mint && (
                    <>
                      <div className="h-px bg-white/5" />
                      <div className="pt-4">
                        <p className="text-white/60 text-sm sm:text-base font-medium mb-4">View on Explorers</p>
                        <div className="grid grid-cols-2 gap-3">
                          {(() => {
                            const links = getExplorerLinks(post.token_mint, post.pool_address);
                            return (
                              <>
                                {/* Solscan */}
                                <a
                                  href={links.solscan}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center gap-2 bg-black/60 hover:bg-black/80 border border-white/10 hover:border-purple-500/50 rounded-lg px-4 py-3 transition-all group"
                                >
                                  <svg className="w-5 h-5 text-white/80 group-hover:text-purple-400 transition-colors" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                                  </svg>
                                  <span className="text-white text-sm font-semibold">Solscan</span>
                                </a>

                                {/* DEXScreener */}
                                <a
                                  href={links.dexscreener}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center gap-2 bg-black/60 hover:bg-black/80 border border-white/10 hover:border-purple-500/50 rounded-lg px-4 py-3 transition-all group"
                                >
                                  <svg className="w-5 h-5 text-white/80 group-hover:text-purple-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                  </svg>
                                  <span className="text-white text-sm font-semibold">DEXScreener</span>
                                </a>

                                {/* Solana Explorer */}
                                <a
                                  href={links.solanaExplorer}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center gap-2 bg-black/60 hover:bg-black/80 border border-white/10 hover:border-purple-500/50 rounded-lg px-4 py-3 transition-all group"
                                >
                                  <svg className="w-5 h-5 text-white/80 group-hover:text-purple-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                  </svg>
                                  <span className="text-white text-sm font-semibold">Solana Explorer</span>
                                </a>

                                {/* Birdeye */}
                                <a
                                  href={links.birdeye}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center gap-2 bg-black/60 hover:bg-black/80 border border-white/10 hover:border-purple-500/50 rounded-lg px-4 py-3 transition-all group"
                                >
                                  <svg className="w-5 h-5 text-white/80 group-hover:text-purple-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  <span className="text-white text-sm font-semibold">Birdeye</span>
                                </a>

                                {/* CoinGecko */}
                                <a
                                  href={links.coingecko}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center gap-2 bg-black/60 hover:bg-black/80 border border-white/10 hover:border-purple-500/50 rounded-lg px-4 py-3 transition-all group"
                                >
                                  <svg className="w-5 h-5 text-white/80 group-hover:text-purple-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="text-white text-sm font-semibold">CoinGecko</span>
                                </a>

                                {/* Photon */}
                                {links.photon && (
                                  <a
                                    href={links.photon}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 bg-black/60 hover:bg-black/80 border border-white/10 hover:border-purple-500/50 rounded-lg px-4 py-3 transition-all group"
                                  >
                                    <svg className="w-5 h-5 text-white/80 group-hover:text-purple-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    <span className="text-white text-sm font-semibold">Photon</span>
                                  </a>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
