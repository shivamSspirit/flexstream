'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, Share, MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { VerificationBadge } from './VerificationBadge';
import { PostOptionsMenu } from './PostOptionsMenu';
import { ShareModal } from './ShareModal';
import { CommentsModal } from './CommentsModal';
import { ImageCarousel } from './ImageCarousel';
import { formatTimeAgo, getSuccessTierIcon } from '@/lib/utils';
import { FlexPost } from '@/types';

interface PostCardProps {
  post: FlexPost;
}

export function PostCard({ post }: PostCardProps) {
  const router = useRouter();
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);

  const postUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/post/${post.id}`;

  const handleShare = () => {
    // Open ShareModal with all share options
    setShowShareModal(true);
  };

  const handleComments = () => {
    console.log('Comments button clicked');
    setShowCommentsModal(true);
  };

  const handleUserClick = () => {
    router.push(`/profile/${post.user?.username}`);
  };

  const [showBuyModal, setShowBuyModal] = useState(false);
  const [recentActivity, setRecentActivity] = useState({
    viewers: Math.floor(Math.random() * 50) + 10,
    recentBuys: Math.floor(Math.random() * 15) + 3,
    priceChange: (Math.random() * 50 - 10).toFixed(1), // -10% to +40%
  });

  const handleBuy = () => {
    if (post.token_address) {
      setShowBuyModal(true);
    }
  };

  const handleQuickBuy = (amount: number) => {
    if (post.token_address) {
      // Open Jupiter with pre-filled amount
      const solAmount = amount / 100; // Convert $ to approximate SOL (simplified)
      window.open(`https://jup.ag/swap/SOL-${post.token_address}?inAmount=${solAmount}`, '_blank');

      // Show success toast and Twitter share prompt
      setTimeout(() => {
        const shouldShare = window.confirm(
          `🎉 Just bought $${amount} of ${post.token_address?.slice(0, 4)}...! Share on Twitter?`
        );
        if (shouldShare) {
          handleShareToTwitter(amount);
        }
      }, 1000);
    }
  };

  const handleShareToTwitter = (amount?: number) => {
    const ticker = post.token_address?.slice(0, 8) || 'TOKEN';
    const priceChange = recentActivity.priceChange;
    const text = amount
      ? `Just bought $${amount} of $${ticker} on @FlexStream! 🚀\n\nCurrent price: $89 ${parseFloat(priceChange) > 0 ? '📈' : '📉'} ${priceChange}%\n\nJoin me: ${postUrl}`
      : `Check out this post on @FlexStream! 🔥\n\n${post.title || post.content?.slice(0, 50)}\n\n${postUrl}`;

    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handlePostClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('a') ||
      target.closest('input') ||
      target.closest('[role="button"]')
    ) {
      return;
    }
    router.push(`/post/${post.id}`);
  };

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'earnings_flex':
        return '💰';
      case 'stream_highlight':
        return '🎥';
      case 'lifestyle':
        return '✨';
      case 'trading_journey':
        return '📈';
      default:
        return '📝';
    }
  };

  return (
    <Card className="card-interactive group bg-gradient-to-br from-card-bg to-card-bg/80 border border-white/10 hover:border-white/20 shadow-card-lg">
      <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
            <Avatar
              className="h-10 w-10 sm:h-12 sm:w-12 cursor-pointer ring-2 ring-transparent hover:ring-accent-purple/50 transition-all duration-300 shrink-0 shadow-lg"
              onClick={handleUserClick}
            >
              <AvatarImage src={post.user?.avatar_url} alt={post.user?.display_name} />
              <AvatarFallback className="bg-gradient-to-br from-accent-purple to-accent-pink text-white font-bold text-sm sm:text-base">
                {post.user?.display_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0 space-y-1 sm:space-y-1.5">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <button
                  onClick={handleUserClick}
                  className="font-bold text-text-primary hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-accent-blue hover:to-accent-purple transition-all duration-200 text-sm sm:text-base"
                >
                  {post.user?.display_name}
                </button>
                <span className="text-text-muted text-xs sm:text-sm font-medium">
                  @{post.user?.username}
                </span>
                <Badge variant={post.user?.success_tier || 'bronze'} className="text-xs shrink-0 font-semibold">
                  {getSuccessTierIcon(post.user?.success_tier || 'bronze')}
                </Badge>
                {post.verified && <VerificationBadge />}
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 text-text-muted text-xs sm:text-sm">
                <span className="font-medium">{formatTimeAgo(post.created_at)}</span>
                <span className="text-white/20">•</span>
                <span className="flex items-center text-sm sm:text-base">
                  {getPostTypeIcon(post.type)}
                </span>
              </div>
            </div>
          </div>

          <PostOptionsMenu tokenAddress={post.token_address} postId={post.id}>
            <Button
              variant="ghost"
              size="icon"
              className="btn-icon shrink-0 h-8 w-8 sm:h-9 sm:w-9"
            >
              <MoreHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </PostOptionsMenu>
        </div>
      </CardHeader>

      <CardContent className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 space-y-0">
        {/* Social Proof Indicators - FOMO */}
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          {/* Live viewers */}
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
            <span>{recentActivity.viewers} viewing</span>
          </div>

          {/* Recent buys */}
          <div className="flex items-center gap-1.5 text-xs text-accent-green font-semibold">
            <span>🔥</span>
            <span>{recentActivity.recentBuys} buys in 5m</span>
          </div>

          {/* Price change */}
          <div className={`flex items-center gap-1 text-xs font-bold ${parseFloat(recentActivity.priceChange) > 0 ? 'text-accent-green' : 'text-metric-red'}`}>
            <span>{parseFloat(recentActivity.priceChange) > 0 ? '↗' : '↘'}</span>
            <span>{recentActivity.priceChange}%</span>
          </div>
        </div>

        {/* Media - Image Carousel */}
        {post.media_urls && post.media_urls.length > 0 && (
          <div className="mb-3 cursor-pointer" onClick={handlePostClick}>
            <ImageCarousel
              images={post.media_urls.filter(url => !url.match(/\.(mp4|webm|ogg|avi|mov)$/i) && !url.includes('video'))}
              videos={post.media_urls.filter(url => url.match(/\.(mp4|webm|ogg|avi|mov)$/i) || url.includes('video'))}
            />
          </div>
        )}

        {/* Post Actions - Market Cap, Comments, Share, Buy */}
        <div className="flex items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-3">
            {/* Market Cap with Green Triangle */}
            <div className="flex items-center gap-1 text-accent-green">
              <svg className="h-3 w-3" viewBox="0 0 12 12" fill="currentColor">
                <path d="M6 2L11 10H1L6 2Z" />
              </svg>
              <span className="font-bold text-base">$89</span>
            </div>

            {/* Comment Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleComments}
              className="h-9 w-9 rounded-full hover:bg-white/5 p-0"
            >
              <MessageCircle className="h-5 w-5 text-text-secondary" />
            </Button>

            {/* Share Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              className="h-9 w-9 rounded-full hover:bg-white/5 p-0"
            >
              <Share className="h-5 w-5 text-text-secondary" />
            </Button>
          </div>

          {/* Quick Buy Buttons - One Tap! */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => handleQuickBuy(5)}
              className="bg-accent-green/20 hover:bg-accent-green/30 text-accent-green border border-accent-green/30 font-bold px-3 py-2 rounded-full transition-all text-xs h-8"
            >
              $5
            </Button>
            <Button
              onClick={() => handleQuickBuy(10)}
              className="bg-accent-green/20 hover:bg-accent-green/30 text-accent-green border border-accent-green/30 font-bold px-3 py-2 rounded-full transition-all text-xs h-8"
            >
              $10
            </Button>
            <Button
              onClick={handleBuy}
              className="bg-accent-green hover:bg-accent-green/90 text-black font-bold px-6 py-2 rounded-full transition-all text-sm h-9"
            >
              Buy
            </Button>
          </div>
        </div>

        {/* Held By Section - At Bottom */}
        <div className="flex items-center gap-2 text-sm py-2">
          <Avatar className="h-5 w-5 border border-card-bg">
            <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop" />
            <AvatarFallback className="bg-gradient-to-br from-accent-purple to-accent-pink text-xs">U</AvatarFallback>
          </Avatar>
          <span className="text-text-muted text-xs">Held by</span>
          <span className="text-text-primary font-semibold text-xs">casualcollapse</span>
          <span className="text-text-muted text-xs">and</span>
          <span className="text-text-primary font-semibold text-xs">2 others</span>
        </div>

        {/* GM Text or Post Content */}
        <div className="py-2 cursor-pointer" onClick={handlePostClick}>
          {post.content && (
            <p className="text-text-primary text-sm">
              {post.content}
            </p>
          )}
        </div>

        {/* Add Comment Input */}
        <div className="pt-1 pb-2">
          <input
            type="text"
            placeholder="Add a comment..."
            onClick={handleComments}
            readOnly
            className="w-full bg-transparent text-text-muted text-sm placeholder:text-text-muted/50 focus:outline-none cursor-pointer"
          />
        </div>

      </CardContent>

      {/* Modals */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        postUrl={postUrl}
        postId={post.id}
      />

      <CommentsModal
        isOpen={showCommentsModal}
        onClose={() => setShowCommentsModal(false)}
        postId={post.id}
        commentsCount={post.comments_count}
      />

      {/* Quick Buy Modal */}
      {showBuyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowBuyModal(false)}>
          <div className="bg-card-bg border border-white/20 rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-4">Quick Buy</h3>
            <p className="text-text-muted text-sm mb-6">Choose an amount to buy instantly</p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <Button
                onClick={() => { handleQuickBuy(5); setShowBuyModal(false); }}
                className="bg-accent-green/20 hover:bg-accent-green/30 text-accent-green border-2 border-accent-green/40 font-bold py-6 text-lg rounded-xl"
              >
                $5
              </Button>
              <Button
                onClick={() => { handleQuickBuy(10); setShowBuyModal(false); }}
                className="bg-accent-green/20 hover:bg-accent-green/30 text-accent-green border-2 border-accent-green/40 font-bold py-6 text-lg rounded-xl"
              >
                $10
              </Button>
              <Button
                onClick={() => { handleQuickBuy(25); setShowBuyModal(false); }}
                className="bg-accent-green/20 hover:bg-accent-green/30 text-accent-green border-2 border-accent-green/40 font-bold py-6 text-lg rounded-xl"
              >
                $25
              </Button>
              <Button
                onClick={() => { handleQuickBuy(50); setShowBuyModal(false); }}
                className="bg-accent-green/20 hover:bg-accent-green/30 text-accent-green border-2 border-accent-green/40 font-bold py-6 text-lg rounded-xl"
              >
                $50
              </Button>
            </div>

            <Button
              onClick={() => {
                if (post.token_address) {
                  window.open(`https://jup.ag/swap/SOL-${post.token_address}`, '_blank');
                }
                setShowBuyModal(false);
              }}
              className="w-full bg-accent-green hover:bg-accent-green/90 text-black font-bold py-3 rounded-xl"
            >
              Custom Amount →
            </Button>

            <button
              onClick={() => setShowBuyModal(false)}
              className="w-full mt-3 text-text-muted text-sm hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
