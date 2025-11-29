'use client';

import { useEffect, useMemo } from 'react';
import { usePosts, Post } from '@/hooks/usePosts';
import { PostCard } from '@/components/posts/PostCard';
import { FlexPost } from '@/types';

export function SimpleFeed() {
  console.log('🔄 [FEED] Component rendering...');

  const { data, isLoading, error } = usePosts();

  console.log('📊 [FEED] Raw query data:', {
    hasData: !!data,
    isLoading,
    hasError: !!error,
    postCount: data?.data?.posts?.length || 0
  });

  const posts = useMemo(() => {
    const result = data?.data?.posts || [];
    console.log('🧮 [FEED] Memoized posts:', result.length);
    return result;
  }, [data?.data?.posts]);

  // Debug logging
  useEffect(() => {
    console.log('📰 [FEED] Effect triggered - All posts (newest first):', {
      totalPosts: posts.length,
      isLoading,
      hasError: !!error,
      errorMessage: error?.message || null,
      posts: posts.map(p => ({
        id: p.id,
        title: p.title,
        post_user_id: p.user_id,
        username: p.users?.username || 'unknown',
        wallet: p.users?.wallet_address?.substring(0, 8) || 'unknown',
        created_at: p.created_at
      }))
    });

    // Show detailed info for first 3 posts to understand user_id mismatch
    if (posts.length > 0 && !isLoading) {
      console.log('🔍 [FEED] Detailed first 3 posts:', posts.slice(0, 3).map(p => ({
        postId: p.id,
        postUserId: p.user_id,
        postTitle: p.title,
        userInfo: {
          userId: p.users?.id,
          username: p.users?.username,
          wallet: p.users?.wallet_address
        }
      })));
    }
  }, [posts, isLoading, error]);

  // Convert Post to FlexPost
  const convertToFlexPost = (post: Post): FlexPost => {
    return {
      id: post.id,
      user_id: post.user_id,
      type: post.type as 'earnings_flex' | 'stream_highlight' | 'lifestyle' | 'trading_journey',
      title: post.title,
      content: post.content,
      media_urls: post.media_urls || [],
      social_link: undefined,
      earnings_amount: undefined,
      token_address: post.token_mint || undefined,
      verified: post.verified,
      likes_count: 0,
      comments_count: 0,
      shares_count: 0,
      created_at: post.created_at,
      updated_at: post.created_at,
      user: {
        id: post.users.id,
        wallet_address: post.users.wallet_address,
        username: post.users.username,
        display_name: post.users.display_name,
        avatar_url: post.users.avatar_url || undefined,
        verified: false,
        verified_earnings: 0,
        success_tier: 'bronze',
        total_followers: 0,
        total_following: 0,
        created_at: post.created_at,
        updated_at: post.created_at,
      },
      is_liked: false,
      is_following: false,
    };
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card-base p-6 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 bg-white/10 rounded-full"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 w-32 bg-white/10 rounded"></div>
                <div className="h-3 w-20 bg-white/10 rounded"></div>
              </div>
            </div>
            <div className="w-full h-64 bg-white/10 rounded-xl mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 w-3/4 bg-white/10 rounded"></div>
              <div className="h-3 w-full bg-white/10 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="text-center py-12 card-base">
        <p className="text-metric-red text-base font-medium">Failed to load posts. Please try again.</p>
      </div>
    );
  }

  // Show empty state with viral CTA - Nikita Bier Strategy
  if (posts.length === 0) {
    return (
      <div className="text-center py-16 card-base relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent-green/5 via-accent-cyan/5 to-accent-purple/5 animate-gradient-shift"></div>

        <div className="relative z-10">
          <div className="text-7xl mb-6 animate-bounce-slow">🚀</div>
          <h3 className="text-3xl font-black text-white mb-3">
            Your Feed is Empty
          </h3>
          <p className="text-text-muted text-base mb-6 max-w-md mx-auto leading-relaxed">
            Be the <span className="text-accent-green font-bold">first</span> to launch a token and start the movement
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <button
              onClick={() => window.location.href = '/create'}
              className="bg-gradient-to-r from-accent-green via-accent-cyan to-accent-blue hover:from-accent-green/90 hover:via-accent-cyan/90 hover:to-accent-blue/90 text-black font-black px-8 py-4 rounded-xl transition-all hover:scale-105 shadow-lg hover:shadow-accent-green/50 text-base"
            >
              Create First Post
            </button>
            <p className="text-white/40 text-xs">No posts exist yet. Make history.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <PostCard key={post.id} post={convertToFlexPost(post)} />
      ))}
    </div>
  );
}
