import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface LikeResponse {
  liked: boolean;
  likeCount: number;
  message: string;
}

export function useLike(postId: string, userId: string | undefined) {
  const queryClient = useQueryClient();

  // Check if user has liked the post
  const { data: likeStatus } = useQuery({
    queryKey: ['like-status', postId, userId],
    queryFn: async () => {
      if (!userId) return { liked: false };

      const res = await fetch(`/api/posts/like?postId=${postId}&userId=${userId}`);
      if (!res.ok) throw new Error('Failed to fetch like status');
      return res.json() as Promise<{ liked: boolean }>;
    },
    enabled: !!userId && !!postId,
  });

  // Toggle like mutation
  const likeMutation = useMutation({
    mutationFn: async (): Promise<LikeResponse> => {
      if (!userId) throw new Error('Must be logged in to like');

      const res = await fetch('/api/posts/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, userId }),
      });

      if (!res.ok) throw new Error('Failed to toggle like');
      return res.json();
    },
    onSuccess: (data) => {
      // Update like status cache
      queryClient.setQueryData(['like-status', postId, userId], { liked: data.liked });

      // Invalidate posts to update like count
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });

      toast.success(data.message);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to like post');
    },
  });

  return {
    liked: likeStatus?.liked || false,
    toggleLike: likeMutation.mutate,
    isLoading: likeMutation.isPending,
  };
}
