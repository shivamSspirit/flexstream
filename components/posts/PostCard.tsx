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
    <Card className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
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
                  className="font-semibold text-white hover:text-purple-400 transition-colors"
                >
                  {post.user?.display_name}
                </button>
                <span className="text-gray-400 text-sm">
                  @{post.user?.username}
                </span>
                <Badge variant={post.user?.success_tier || 'bronze'} className="text-xs">
                  {getSuccessTierIcon(post.user?.success_tier || 'bronze')}
                </Badge>
                {post.verified && <VerificationBadge />}
              </div>
              
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-gray-400 text-sm">
                  {formatTimeAgo(post.created_at)}
                </span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-400 text-sm flex items-center">
                  {getPostTypeIcon(post.type)}
                </span>
              </div>
            </div>
          </div>
          
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Post Content */}
        <div className="space-y-3">
          <p className="text-white leading-relaxed">
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
        <div className="flex items-center justify-between pt-2 border-t border-gray-700">
          <div className="flex items-center space-x-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`flex items-center space-x-2 ${
                isLiked ? 'text-red-400' : 'text-gray-400 hover:text-red-400'
              }`}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{likesCount}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-2 text-gray-400 hover:text-blue-400"
            >
              <MessageCircle className="h-4 w-4" />
              <span>{post.comments_count}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="flex items-center space-x-2 text-gray-400 hover:text-green-400"
            >
              <Share className="h-4 w-4" />
              <span>{post.shares_count}</span>
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/post/${post.id}`)}
            className="text-gray-400 hover:text-white"
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
