'use client';

import { usePosts, Post } from '@/hooks/usePosts';
import { PostCard } from '@/components/posts/PostCard';
import { FlexPost } from '@/types';

export function SimpleFeed() {
  const { data, isLoading, error } = usePosts();

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

  const posts = data?.data?.posts || [];

  // Show empty state
  if (posts.length === 0) {
    return (
      <div className="text-center py-16 card-base">
        <p className="heading-4 mb-2">No posts yet</p>
        <p className="text-text-muted text-sm">Be the first to create a post and launch a token!</p>
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
