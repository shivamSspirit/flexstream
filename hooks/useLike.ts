import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

interface LikeResponse {
  liked: boolean;
  likeCount: number;
  message: string;
}

export function useLike(postId: string, userId: string | undefined) {
  const queryClient = useQueryClient();
  const [optimisticLiked, setOptimisticLiked] = useState<boolean | null>(null);

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

  // Sync optimistic state with server state
  useEffect(() => {
    if (likeStatus?.liked !== undefined && optimisticLiked === null) {
      setOptimisticLiked(likeStatus.liked);
    }
  }, [likeStatus, optimisticLiked]);

  // Toggle like mutation with optimistic updates
  const likeMutation = useMutation({
    mutationFn: async (): Promise<LikeResponse> => {
      if (!userId) throw new Error('Connect wallet to like posts');

      const res = await fetch('/api/posts/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, userId }),
      });

      if (!res.ok) throw new Error('Failed to toggle like');
      return res.json();
    },
    onMutate: async () => {
      // OPTIMISTIC UPDATE - Instant feedback!
      const currentLiked = optimisticLiked ?? likeStatus?.liked ?? false;
      setOptimisticLiked(!currentLiked);

      // Vibration feedback (mobile only)
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(10); // Short haptic pulse
      }

      return { previousLiked: currentLiked };
    },
    onSuccess: (data) => {
      // Update like status cache with server response
      queryClient.setQueryData(['like-status', postId, userId], { liked: data.liked });
      setOptimisticLiked(data.liked);

      // Invalidate posts to update like count (background refresh)
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });

      // Subtle success feedback (no intrusive toast for likes)
    },
    onError: (error: Error, _variables, context) => {
      // Rollback optimistic update
      if (context?.previousLiked !== undefined) {
        setOptimisticLiked(context.previousLiked);
      }

      toast.error(error.message || 'Failed to like post');
    },
  });

  const toggleLike = () => {
    if (!userId) {
      toast.error('Connect your wallet to like posts');
      return;
    }
    likeMutation.mutate();
  };

  return {
    liked: optimisticLiked ?? likeStatus?.liked ?? false,
    toggleLike,
    isLoading: likeMutation.isPending,
  };
}
