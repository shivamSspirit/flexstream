import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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
  token_name: string | null;
  pool_address: string | null;
  bonding_curve_address: string | null;
  token_metadata_uri: string | null;
  token_signature: string | null;
  is_token_tradable: boolean;
  verified: boolean;
  created_at: string;
  users: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
    wallet_address: string;
  };
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
 * Hook to fetch posts from the API
 */
export function usePosts(options: UsePostsOptions = {}) {
  const { userId, limit = 20, offset = 0, enabled = true } = options;

  return useQuery<PostsResponse>({
    queryKey: ['posts', { userId, limit, offset }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());

      // Add timestamp to prevent ANY caching
      params.append('_t', Date.now().toString());

      console.log('🔄 [FETCH] Fetching posts from API:', `/api/posts?${params.toString()}`);

      const response = await fetch(`/api/posts?${params.toString()}`, {
        cache: 'no-store', // Disable Next.js caching
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ [FETCH] Failed to fetch posts:', error);
        throw new Error(error.error || 'Failed to fetch posts');
      }

      const data = await response.json();
      console.log('✅ [FETCH] Fetched posts from REAL DATABASE:', {
        totalPosts: data.data?.posts?.length || 0,
        posts: data.data?.posts?.map((p: any) => ({ id: p.id, title: p.title })) || [],
        timestamp: new Date().toISOString()
      });

      return data;
    },
    enabled,
    staleTime: 0, // Always consider data stale (forces fresh fetch)
    gcTime: 5 * 60 * 1000, // Keep unused data in cache for 5 minutes
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch on internet reconnect
  });
}

/**
 * Hook to invalidate posts cache (use after creating a new post)
 * Only marks queries as stale - they refetch naturally when needed
 * This prevents overwriting optimistic updates with stale data
 */
export function useInvalidatePosts() {
  const queryClient = useQueryClient();

  return () => {
    // Only mark as stale, don't force immediate refetch
    // The query will refetch naturally when:
    // - Component remounts
    // - Window regains focus
    // - Network reconnects
    // This prevents race conditions where refetch returns stale data
    queryClient.invalidateQueries({ queryKey: ['posts'] });
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
 * This makes the new post appear instantly on the feed
 * Returns a promise that resolves when the cache is updated
 */
export function useAddPostToCache() {
  const queryClient = useQueryClient();

  return (newPost: Post) => {
    console.log('[ADD POST TO CACHE] Starting...', { postId: newPost.id, postTitle: newPost.title });

    // Update all posts queries (both main feed and profile queries)
    queryClient.setQueriesData<PostsResponse>(
      { queryKey: ['posts'] },
      (oldData) => {
        console.log('[ADD POST TO CACHE] Current cache data:', {
          hasOldData: !!oldData,
          oldPostCount: oldData?.data?.posts?.length || 0
        });

        if (!oldData) {
          console.warn('[ADD POST TO CACHE] No existing cache data, creating new cache');
          // If no cache exists, create initial data structure
          return {
            success: true,
            data: {
              posts: [newPost],
              count: 1,
              limit: 20,
              offset: 0,
            },
          };
        }

        // Check if post already exists in cache (prevent duplicates)
        const postExists = oldData.data.posts.some(p => p.id === newPost.id);
        if (postExists) {
          console.log('[ADD POST TO CACHE] Post already exists in cache, skipping');
          return oldData;
        }

        const updatedData = {
          ...oldData,
          data: {
            ...oldData.data,
            posts: [newPost, ...oldData.data.posts],
            count: oldData.data.count + 1,
          },
        };

        console.log('[ADD POST TO CACHE] Updated cache:', {
          newPostCount: updatedData.data.posts.length,
          addedPost: { id: newPost.id, title: newPost.title }
        });

        return updatedData;
      }
    );

    console.log('[ADD POST TO CACHE] Complete!');
  };
}
