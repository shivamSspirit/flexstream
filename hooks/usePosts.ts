import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRealtimePosts } from '@/hooks/useRealtimePosts';

interface UserData {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  wallet_address: string;
}

export interface Post {
  id: string;
  user_id: string;
  type: string;
  title: string;
  content: string;
  media_urls: string[];
  token_mint: string | null;
  token_symbol: string | null;
  token_display_name: string | null;
  token_is_verified: boolean | null;
  creator_is_verified: boolean | null;
  token_name: string | null;
  pool_address: string | null;
  bonding_curve_address: string | null;
  token_metadata_uri: string | null;
  token_signature: string | null;
  is_token_tradable: boolean;
  verified: boolean;
  created_at: string;
  // Supabase joins can return either an object or array depending on the relationship
  users: UserData | UserData[];
}

interface PostsResponse {
  success: boolean;
  data: {
    posts: Post[];
    count: number;
    limit: number;
    offset: number;
  };
}

interface UsePostsOptions {
  userId?: string;
  limit?: number;
  offset?: number;
  enabled?: boolean;
}

/**
 * Hook to fetch posts from the API with real-time updates
 * Uses Supabase Realtime for instant updates + React Query for data fetching
 */
export function usePosts(options: UsePostsOptions = {}) {
  const { userId, limit = 20, offset = 0, enabled = true } = options;

  // Set up real-time subscription (handles cache updates automatically)
  useRealtimePosts({ userId, enabled });

  return useQuery<PostsResponse>({
    queryKey: ['posts', { userId, limit, offset }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());

      // Add timestamp to prevent caching
      params.append('_t', Date.now().toString());

      const response = await fetch(`/api/posts?${params.toString()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[POSTS] Failed to fetch:', error);
        throw new Error(error.error || 'Failed to fetch posts');
      }

      const data = await response.json();
      console.log('[POSTS] Fetched:', data.data?.posts?.length || 0, 'posts');

      return data;
    },
    enabled,
    staleTime: 30000, // Consider data fresh for 30 seconds (realtime handles updates)
    gcTime: 60000, // Keep in cache for 1 minute
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    // Reduced polling as fallback - realtime handles most updates
    refetchInterval: 30000, // Fallback poll every 30 seconds
  });
}

/**
 * Hook to invalidate posts cache (use after creating a new post)
 * Marks queries as stale - realtime subscriptions handle actual updates
 * IMPORTANT: We no longer force refetch or remove queries to prevent
 * race conditions that cause posts to disappear
 */
export function useInvalidatePosts() {
  const queryClient = useQueryClient();

  return async () => {
    console.log('[INVALIDATE POSTS] Marking posts queries as stale (realtime handles updates)');

    // Only invalidate to mark queries as stale
    // Realtime subscriptions and background refetch will handle actual updates
    // DO NOT use refetchQueries or removeQueries - they cause race conditions
    // that overwrite optimistic/realtime updates and make posts disappear
    await queryClient.invalidateQueries({
      queryKey: ['posts'],
      exact: false,
    });
    console.log('[INVALIDATE POSTS] All queries marked as stale');
  };
}

/**
 * Hook to manually refetch posts
 */
export function useRefetchPosts() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.refetchQueries({ queryKey: ['posts'] });
  };
}

/**
 * Hook to add a new post optimistically to the cache
 * This makes the new post appear instantly on the feed AND the creator's profile
 * IMPORTANT: Only updates EXISTING caches - does NOT create new caches
 * (Creating new caches with single post would overwrite the full post list from API)
 */
export function useAddPostToCache() {
  const queryClient = useQueryClient();

  return (newPost: Post) => {
    console.log('[ADD POST TO CACHE] Starting...', { postId: newPost.id, postTitle: newPost.title, postUserId: newPost.user_id });

    // Get all queries that match ['posts'] prefix
    const queries = queryClient.getQueriesData<PostsResponse>({ queryKey: ['posts'] });

    for (const [queryKey, currentData] of queries) {
      // Skip if no data exists - let API fetch the full list
      if (!currentData) {
        console.log('[ADD POST TO CACHE] No cache data, skipping (API will fetch)', { queryKey });
        continue;
      }

      // Extract userId from query key: ['posts', { userId, limit, offset }]
      const queryParams = queryKey[1] as { userId?: string; limit?: number; offset?: number } | undefined;
      const queryUserId = queryParams?.userId;

      // Determine if this post should be added to this query:
      // - Main feed (userId undefined): add all posts
      // - Profile feed (userId set): only add if post belongs to that user
      const shouldAdd = !queryUserId || queryUserId === newPost.user_id;

      if (!shouldAdd) {
        console.log('[ADD POST TO CACHE] Skipping query - userId mismatch', {
          queryUserId,
          postUserId: newPost.user_id
        });
        continue;
      }

      // Check if post already exists in cache (prevent duplicates)
      const postExists = currentData.data.posts.some(p => p.id === newPost.id);
      if (postExists) {
        console.log('[ADD POST TO CACHE] Post already exists, skipping', { queryKey });
        continue;
      }

      console.log('[ADD POST TO CACHE] Adding post to existing cache', {
        queryKey,
        oldCount: currentData.data.posts.length
      });

      // Prepend new post to existing cache
      queryClient.setQueryData<PostsResponse>(queryKey, {
        ...currentData,
        data: {
          ...currentData.data,
          posts: [newPost, ...currentData.data.posts],
          count: currentData.data.count + 1,
        },
      });
    }

    // Invalidate the profile query to ensure it refetches fresh data on next mount
    // This handles the case where the profile cache doesn't exist yet
    queryClient.invalidateQueries({
      queryKey: ['posts', { userId: newPost.user_id }],
      exact: false,
      refetchType: 'none', // Don't refetch now, just mark as stale
    });

    // Also invalidate main feed to ensure consistency
    queryClient.invalidateQueries({
      queryKey: ['posts', { userId: undefined }],
      exact: false,
      refetchType: 'none',
    });

    console.log('[ADD POST TO CACHE] Complete!');
  };
}
