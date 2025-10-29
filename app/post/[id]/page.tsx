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

  // Trading state
  const [tradeAmount, setTradeAmount] = useState('0.000111');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [selectedToken, setSelectedToken] = useState('ETH');

  useEffect(() => {
    if (postId) {
      fetchPost();
      fetchComments();
    }
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

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
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
          {/* Left Column - Image */}
          <div className="relative">
            <div className="lg:sticky lg:top-20">
              {post.media_urls && post.media_urls.length > 0 ? (
                <img
                  src={post.media_urls[0]}
                  alt={post.title}
                  className="w-full rounded-xl sm:rounded-2xl object-cover"
                  style={{ maxHeight: '70vh' }}
                />
              ) : (
                <div className="w-full aspect-square bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-xl sm:rounded-2xl flex items-center justify-center">
                  <SparklesIcon className="w-16 h-16 sm:w-24 sm:h-24 text-white/20" />
                </div>
              )}
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
                <p className="text-white text-sm sm:text-base md:text-lg font-bold">💰 $0.02</p>
              </div>
            </div>

            {/* Trading Interface */}
            <div className="bg-black/40 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <div className="flex gap-2 mb-4 sm:mb-6">
                <Button
                  onClick={() => setTradeType('buy')}
                  className={`flex-1 h-10 sm:h-12 font-semibold text-sm sm:text-base ${
                    tradeType === 'buy'
                      ? 'bg-green-500 hover:bg-green-600 text-black'
                      : 'bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  Buy
                </Button>
                <Button
                  onClick={() => setTradeType('sell')}
                  className={`flex-1 h-10 sm:h-12 font-semibold text-sm sm:text-base ${
                    tradeType === 'sell'
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  Sell
                </Button>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {/* Amount Input */}
                <div className="bg-black/60 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/60 text-xs sm:text-sm">Amount</span>
                    <div className="flex items-center gap-2">
                      <button className="text-white bg-blue-500/20 px-2 py-1 rounded text-xs">
                        ETH ▼
                      </button>
                    </div>
                  </div>
                  <Input
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(e.target.value)}
                    className="text-xl sm:text-2xl font-bold bg-transparent border-0 text-white p-0 h-auto focus-visible:ring-0"
                    placeholder="0.000111"
                  />
                  <p className="text-white/40 text-xs sm:text-sm mt-1">Balance: 0</p>
                </div>

                {/* Quick Amount Buttons */}
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                  {['0.001 ETH', '0.01 ETH', '0.1 ETH', 'Max'].map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (amount !== 'Max') {
                          setTradeAmount(amount.replace(' ETH', ''));
                        }
                      }}
                      className="bg-white/5 border-white/10 text-white hover:bg-white/10 text-[10px] sm:text-xs h-8 sm:h-9 px-1 sm:px-2"
                    >
                      {amount}
                    </Button>
                  ))}
                </div>

                {/* Trade Button */}
                <Button
                  className="w-full h-10 sm:h-12 bg-white/10 text-white hover:bg-white/20 font-semibold text-sm sm:text-base"
                  disabled
                >
                  Insufficient balance
                </Button>

                {/* Comment Input */}
                <div className="pt-3 sm:pt-4 border-t border-white/10">
                  <Input
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="bg-black/60 border-white/10 text-white placeholder:text-white/40 h-10 sm:h-11 text-sm sm:text-base"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddComment();
                      }
                    }}
                  />
                  <p className="text-white/40 text-xs mt-2">
                    Become a holder to unlock 🔒
                  </p>
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
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
