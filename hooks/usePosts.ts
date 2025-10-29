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

      const response = await fetch(`/api/posts?${params.toString()}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch posts');
      }

      return response.json();
    },
    enabled,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to invalidate posts cache (use after creating a new post)
 */
export function useInvalidatePosts() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ['posts'] });
  };
}
