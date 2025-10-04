'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { FlexPost } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChatBubbleLeftIcon,
  ShareIcon,
  HeartIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

export function SimpleFeed() {
  const [posts, setPosts] = useState<FlexPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:users(*)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching posts:', error);
        setError('Failed to load posts');
        return;
      }

      // Compute simple client-side verified flag if social link references pump.fun
      const enhanced = (data || []).map((p: any) => ({
        ...p,
        verified: p.verified || (p.social_link?.includes('pump.fun') ?? false)
      }));

      setPosts(enhanced);
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    // Find the current post to get its like count
    const currentPost = posts.find(p => p.id === postId);
    if (!currentPost) return;
    
    // Optimistic update
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: (p.likes_count || 0) + 1 } : p));
    const { error } = await supabase
      .from('posts')
      .update({ likes_count: (currentPost.likes_count || 0) + 1 })
      .eq('id', postId);
    if (error) {
      console.error('Failed to like:', error);
      // revert on failure
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: Math.max((p.likes_count || 1) - 1, 0) } : p));
    } else {
      // Fallback: refetch the row to ensure server truth if needed
      // await fetchPosts();
    }
  };

  const handleShare = async (post: FlexPost) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Flex post',
          text: post.content?.slice(0, 120) || 'Check out this flex!',
          url: post.social_link || window.location.href,
        });
      } else {
        // fallback copy link
        await navigator.clipboard.writeText(post.social_link || window.location.href);
        alert('Link copied to clipboard');
      }
      // Optimistic increment
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, shares_count: (p.shares_count || 0) + 1 } : p));
      const { error } = await supabase
        .from('posts')
        .update({ shares_count: (post.shares_count || 0) + 1 })
        .eq('id', post.id);
      if (error) {
        console.error('Failed to increment shares:', error);
        setPosts(prev => prev.map(p => p.id === post.id ? { ...p, shares_count: Math.max((p.shares_count || 1) - 1, 0) } : p));
      }
    } catch (e) {
      console.error('Share failed:', e);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-4">{error}</div>
        <button 
          onClick={fetchPosts}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 mb-4">No posts yet</div>
        <div className="text-gray-400 text-sm">Be the first to share your success!</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <div key={post.id} className="bg-white border border-gray-200 rounded-lg p-6">
          {/* User Header */}
          <div className="flex items-center space-x-3 mb-4">
            <img
              src={post.user?.avatar_url || '/default-avatar.png'}
              alt={post.user?.username || 'User'}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900">
                  {post.user?.username || 'Unknown User'}
                </span>
                {post.verified && (
                  <Badge variant="secondary" className="text-xs px-1 py-0">
                    ✓
                  </Badge>
                )}
              </div>
              <div className="text-gray-500 text-sm">
                {new Date(post.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
          
          {/* Post Content */}
          <div className="text-gray-900 mb-4">
            {post.content}
          </div>

          {post.media_urls && post.media_urls.length > 0 && (
            <div className="mb-4">
              {post.media_urls.map((url, index) => (
                <div key={index} className="mb-2">
                  {url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <img 
                      src={url} 
                      alt={`Post media ${index + 1}`}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  ) : url.match(/\.(mp4|webm|ogg|avi|mov)$/i) ? (
                    <video 
                      src={url} 
                      controls
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  ) : null}
                </div>
              ))}
            </div>
          )}

          {post.social_link && (
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <a 
                href={post.social_link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                🔗 {post.social_link}
              </a>
            </div>
          )}

          {/* Earnings Display */}
          {post.earnings_amount && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-green-600 font-semibold text-lg">
                    ${post.earnings_amount.toLocaleString()}
                  </div>
                  <div className="text-green-500 text-sm">Earnings</div>
                </div>
                {post.verified && (
                  <Badge variant="secondary" className="text-green-600 bg-green-100">
                    Verified ✓
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <button onClick={() => handleLike(post.id)} className="flex items-center space-x-2 text-gray-500 hover:text-gray-700">
                <HeartIcon className="w-5 h-5" />
                <span className="text-sm">{post.likes_count || 0}</span>
              </button>
              <button className="flex items-center space-x-2 text-gray-500 hover:text-gray-700">
                <ChatBubbleLeftIcon className="w-5 h-5" />
                <span className="text-sm">{post.comments_count || 0}</span>
              </button>
              <button onClick={() => handleShare(post)} className="flex items-center space-x-2 text-gray-500 hover:text-gray-700">
                <ShareIcon className="w-5 h-5" />
                <span className="text-sm">{post.shares_count || 0}</span>
              </button>
            </div>
            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
              Buy
            </Button>
          </div>
        
          {/* Comment Input */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
