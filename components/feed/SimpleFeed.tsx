'use client';

import { useEffect, useState } from 'react';
import { usePosts, Post } from '@/hooks/usePosts';
import { useUploadingPosts } from '@/hooks/useUploadingPosts';
import { PostCard } from '@/components/posts/PostCard';
import { UploadingPostCard } from '@/components/feed/UploadingPostCard';
import { FlexPost } from '@/types';

// User data shape from Supabase joins
interface UserData {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  wallet_address: string;
}

// Helper to extract user info from Supabase joins (which may return arrays)
const getUserFromJoin = (users: UserData | UserData[] | undefined | null): UserData | undefined => {
  if (!users) return undefined;
  return Array.isArray(users) ? users[0] : users;
};

// ═══════════════════════════════════════════════════════════════════════════
// SimpleFeed — Obsidian Vault Aesthetic
// Minimalist, sophisticated feed with refined animations
// ═══════════════════════════════════════════════════════════════════════════

export function SimpleFeed() {
  const { data, isLoading, error } = usePosts();
  const { uploadingPosts } = useUploadingPosts();
  const [mounted, setMounted] = useState(false);

  const posts = data?.data?.posts || [];

  useEffect(() => {
    setMounted(true);
  }, []);

  // Debug logging
  useEffect(() => {
    console.log('📰 [FEED] All posts (newest first):', {
      uploadingPosts: uploadingPosts.length,
      totalPosts: posts.length,
      isLoading,
      hasError: !!error,
      errorMessage: error?.message || null,
      posts: posts.map(p => {
        const user = getUserFromJoin(p.users);
        return {
          id: p.id,
          title: p.title,
          post_user_id: p.user_id,
          username: user?.username || 'unknown',
          wallet: user?.wallet_address?.substring(0, 8) || 'unknown',
          created_at: p.created_at
        };
      })
    });

    if (uploadingPosts.length > 0) {
      console.log('⏳ [FEED] Uploading posts:', uploadingPosts.map(p => ({
        tempId: p.tempId,
        title: p.title,
        progress: p.uploadProgress,
        stage: p.uploadStage
      })));
    }

    if (posts.length > 0 && !isLoading) {
      console.log('🔍 [FEED] Detailed first 3 posts:', posts.slice(0, 3).map(p => {
        const user = getUserFromJoin(p.users);
        return {
          postId: p.id,
          postUserId: p.user_id,
          postTitle: p.title,
          userInfo: {
            userId: user?.id,
            username: user?.username,
            wallet: user?.wallet_address
          }
        };
      }));
    }
  }, [posts, uploadingPosts, isLoading, error]);

  // Convert Post to FlexPost
  const convertToFlexPost = (post: Post): FlexPost => {
    const user = getUserFromJoin(post.users);
    return {
      id: post.id,
      user_id: post.user_id,
      type: post.type as 'earnings_flex' | 'stream_highlight' | 'lifestyle' | 'trading_journey',
      title: post.title,
      content: post.content,
      media_urls: post.media_urls || [],
      social_link: undefined,
      earnings_amount: undefined,
      token_mint: post.token_mint || undefined,
      token_symbol: post.token_symbol || undefined,
      token_display_name: post.token_display_name || undefined,
      token_is_verified: post.token_is_verified || false,
      content_category: post.content_category || undefined,
      content_link: post.content_link || undefined,
      token_utility_description: post.token_utility_description || undefined,
      verified: post.verified,
      likes_count: 0,
      comments_count: 0,
      shares_count: 0,
      created_at: post.created_at,
      updated_at: post.created_at,
      user: {
        id: user?.id || post.user_id,
        wallet_address: user?.wallet_address || '',
        username: user?.username || 'unknown',
        display_name: user?.display_name || 'Unknown',
        avatar_url: user?.avatar_url || undefined,
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

  // ─────────────────────────────────────────────────────────────────────────
  // Loading State — Obsidian Skeleton
  // ─────────────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-6 opacity-0 animate-vault-fade"
            style={{
              background: '#121212',
              border: '0.5px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              animationDelay: `${i * 0.1}s`,
            }}
          >
            {/* Header skeleton */}
            <div className="flex items-center gap-4 mb-5">
              <div
                className="h-11 w-11 rounded-full animate-vault-shimmer"
                style={{ background: 'rgba(255, 255, 255, 0.04)' }}
              />
              <div className="flex-1 space-y-2">
                <div
                  className="h-3 w-28 rounded animate-vault-shimmer"
                  style={{ background: 'rgba(255, 255, 255, 0.04)' }}
                />
                <div
                  className="h-2 w-20 rounded animate-vault-shimmer"
                  style={{ background: 'rgba(255, 255, 255, 0.04)' }}
                />
              </div>
            </div>

            {/* Content skeleton */}
            <div
              className="w-full h-72 rounded-lg mb-4 animate-vault-shimmer"
              style={{ background: 'rgba(255, 255, 255, 0.04)' }}
            />

            {/* Text skeleton */}
            <div className="space-y-2">
              <div
                className="h-3 w-3/4 rounded animate-vault-shimmer"
                style={{ background: 'rgba(255, 255, 255, 0.04)' }}
              />
              <div
                className="h-2 w-full rounded animate-vault-shimmer"
                style={{ background: 'rgba(255, 255, 255, 0.04)' }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Error State — Refined
  // ─────────────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div
        className="py-12 text-center"
        style={{
          background: '#121212',
          border: '0.5px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
        }}
      >
        <p
          className="text-sm"
          style={{ color: '#FF6B6B' }}
        >
          Failed to load posts. Please try again.
        </p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Empty State — The Vault Awaits
  // ─────────────────────────────────────────────────────────────────────────
  if (posts.length === 0 && uploadingPosts.length === 0) {
    return (
      <div
        className={`
          relative overflow-hidden py-20 px-8 text-center
          opacity-0 ${mounted ? 'animate-vault-fade-up' : ''}
        `}
        style={{
          background: '#121212',
          border: '0.5px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          opacity: mounted ? undefined : 0,
        }}
      >
        {/* Subtle gradient glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse at 50% 0%, rgba(45, 27, 78, 0.2) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 100%, rgba(224, 255, 98, 0.05) 0%, transparent 50%)
            `,
          }}
        />

        <div className="relative">
          {/* Icon */}
          <div
            className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '0.5px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <svg
              className="w-7 h-7"
              style={{ color: '#666666' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          {/* Text */}
          <h3
            className="text-2xl mb-3"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              color: '#FAFAFA',
              fontWeight: 400,
              letterSpacing: '-0.02em',
            }}
          >
            The Vault Awaits
          </h3>
          <p
            className="text-sm mb-8 max-w-xs mx-auto"
            style={{
              color: '#666666',
              lineHeight: 1.6,
            }}
          >
            Be the first to share a moment and launch its token.
          </p>

          {/* CTA Button */}
          <button
            onClick={() => window.location.href = '/create'}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all duration-300"
            style={{
              background: '#E0FF62',
              color: '#050505',
              borderRadius: '4px',
              letterSpacing: '-0.01em',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 40px rgba(224, 255, 98, 0.2)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Create First Post
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
            </svg>
          </button>

          {/* Subtle hint */}
          <p
            className="mt-6 text-xs"
            style={{ color: '#404040' }}
          >
            No posts exist yet. Make history.
          </p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Feed Content — Staggered Reveal with Generous Spacing
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* Uploading posts at the top */}
      {uploadingPosts.map((uploadingPost, index) => (
        <div
          key={uploadingPost.tempId}
          className={`opacity-0 ${mounted ? 'animate-vault-fade' : ''}`}
          style={{
            animationDelay: `${index * 0.05}s`,
            opacity: mounted ? undefined : 0,
          }}
        >
          <UploadingPostCard post={uploadingPost} />
        </div>
      ))}

      {/* Regular posts */}
      {posts.map((post, index) => (
        <div
          key={post.id}
          className={`opacity-0 ${mounted ? 'animate-vault-fade' : ''} pb-6 border-b border-white/[0.04]`}
          style={{
            animationDelay: `${(uploadingPosts.length + index) * 0.05}s`,
            opacity: mounted ? undefined : 0,
          }}
        >
          <PostCard post={convertToFlexPost(post)} />
        </div>
      ))}
    </div>
  );
}
