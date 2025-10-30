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
      // Add timestamp to bust all caches
      params.append('_t', Date.now().toString());

      console.log('🔄 Fetching posts from API:', `/api/posts?${params.toString()}`);

      const response = await fetch(`/api/posts?${params.toString()}`, {
        cache: 'no-store', // Disable caching for fresh data
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Failed to fetch posts:', error);
        throw new Error(error.error || 'Failed to fetch posts');
      }

      const data = await response.json();
      console.log('✅ Fetched posts:', {
        totalPosts: data.data?.posts?.length || 0,
        posts: data.data?.posts?.map((p: any) => ({ id: p.id, title: p.title })) || []
      });

      return data;
    },
    enabled,
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: 'always', // Refetch every time component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchInterval: 5000, // Refetch every 5 seconds
  });
}

/**
 * Hook to invalidate posts cache (use after creating a new post)
 */
export function useInvalidatePosts() {
  const queryClient = useQueryClient();

  return () => {
    // Invalidate all posts queries to force refetch
    queryClient.invalidateQueries({ queryKey: ['posts'] });
    // Also refetch immediately
    queryClient.refetchQueries({ queryKey: ['posts'] });
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
