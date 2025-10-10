'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, MessageCircle, Share, MoreHorizontal, ExternalLink } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { PostComments } from './PostComments';
import { EarningsDisplay } from './EarningsDisplay';
import { VerificationBadge } from './VerificationBadge';
import { formatTimeAgo, formatEarnings, getSuccessTierIcon } from '@/lib/utils';
import { FlexPost } from '@/types';

interface PostCardProps {
  post: FlexPost;
}

export function PostCard({ post }: PostCardProps) {
  const router = useRouter();
  const [showComments, setShowComments] = useState(false);
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count);

  const handleLike = async () => {
    // TODO: Implement like functionality
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleShare = () => {
    // TODO: Implement share functionality
    if (navigator.share) {
      navigator.share({
        title: `${post.user?.display_name}'s post`,
        text: post.content,
        url: `${window.location.origin}/post/${post.id}`,
      });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
    }
  };

  const handleUserClick = () => {
    router.push(`/profile/${post.user?.username}`);
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
    <Card className="bg-card-bg border-white/10 hover:border-white/20 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar 
              className="h-10 w-10 cursor-pointer"
              onClick={handleUserClick}
            >
              <AvatarImage src={post.user?.avatar_url} alt={post.user?.display_name} />
              <AvatarFallback>
                {post.user?.display_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleUserClick}
                  className="font-semibold text-primary hover:text-purple-400 transition-colors"
                >
                  {post.user?.display_name}
                </button>
                <span className="text-secondary text-sm">
                  @{post.user?.username}
                </span>
                <Badge variant={post.user?.success_tier || 'bronze'} className="text-xs">
                  {getSuccessTierIcon(post.user?.success_tier || 'bronze')}
                </Badge>
                {post.verified && <VerificationBadge />}
              </div>
              
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-secondary text-sm">
                  {formatTimeAgo(post.created_at)}
                </span>
                <span className="text-secondary/50">•</span>
                <span className="text-secondary text-sm flex items-center">
                  {getPostTypeIcon(post.type)}
                </span>
              </div>
            </div>
          </div>
          
          <Button variant="ghost" size="icon" className="text-secondary hover:text-primary">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Post Content */}
        <div className="space-y-3">
          <p className="text-primary leading-relaxed">
            {post.content}
          </p>
          
          {/* Earnings Display */}
          {post.earnings_amount && (
            <EarningsDisplay 
              amount={post.earnings_amount}
              verified={post.verified}
              tokenAddress={post.token_address}
            />
          )}

          {/* Token Metrics - Price & Volume */}
          {post.token_address && (
            <div className="space-y-3">
              {/* Held By Section */}
              <div className="bg-card-bg/50 border border-white/10 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  <span className="text-secondary text-sm">Held by</span>
                  <div className="flex items-center -space-x-2">
                    {/* Mock holders - in real app, fetch from blockchain */}
                    {[
                      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop',
                      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop',
                      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop'
                    ].map((avatar, index) => (
                      <Avatar key={index} className="h-6 w-6 border-2 border-card-bg">
                        <AvatarImage src={avatar} />
                        <AvatarFallback className="bg-purple-600 text-xs">U</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-primary text-sm font-medium">cryptoking</span>
                    <span className="text-secondary text-sm">and</span>
                    <span className="text-primary text-sm font-medium">2 others</span>
                  </div>
                </div>
              </div>

              {/* Price & Volume Indicators */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-2 bg-card-bg/50 border border-white/10 rounded-lg">
                  <span className="text-secondary text-xs">Price</span>
                  <span className="text-metric-green font-semibold text-sm">$0.0024</span>
                  <Badge variant="outline" className="bg-metric-green/10 text-metric-green border-metric-green/30 text-xs">
                    +12.5%
                  </Badge>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-card-bg/50 border border-white/10 rounded-lg">
                  <span className="text-secondary text-xs">Volume</span>
                  <span className="text-link-blue font-semibold text-sm">$45.2K</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Media */}
          {post.media_urls && post.media_urls.length > 0 && (
            <div className="space-y-2">
              {post.media_urls.map((url, index) => {
                const isVideo = url.match(/\.(mp4|webm|ogg|avi|mov)$/i) || url.includes('video');
                return (
                  <div key={index} className="relative">
                    {isVideo ? (
                      <video
                        src={url}
                        controls
                        className="w-full rounded-lg object-cover max-h-96"
                        preload="metadata"
                      >
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <img
                        src={url}
                        alt={`Post media ${index + 1}`}
                        className="w-full rounded-lg object-cover max-h-96"
                        loading="lazy"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Social Link Preview */}
          {post.social_link && (
            <div className="mt-3">
              <a
                href={post.social_link}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <ExternalLink className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">
                      {new URL(post.social_link).hostname}
                    </p>
                    <p className="text-gray-400 text-xs mt-1 truncate">
                      {post.social_link}
                    </p>
                  </div>
                </div>
              </a>
            </div>
          )}
        </div>

        {/* Post Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <div className="flex items-center space-x-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`flex items-center space-x-2 transition-colors ${
                isLiked ? 'text-metric-red' : 'text-secondary hover:text-metric-red'
              }`}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{likesCount}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-2 text-secondary hover:text-link-blue transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              <span>{post.comments_count}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="flex items-center space-x-2 text-secondary hover:text-metric-green transition-colors"
            >
              <Share className="h-4 w-4" />
              <span>{post.shares_count}</span>
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/post/${post.id}`)}
            className="text-secondary hover:text-primary transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <PostComments postId={post.id} />
        )}
      </CardContent>
    </Card>
  );
}
