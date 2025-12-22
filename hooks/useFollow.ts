import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface FollowResponse {
  following: boolean;
  followerCount: number;
  message: string;
}

export function useFollow(followerId: string | undefined, followingId: string) {
  const queryClient = useQueryClient();

  // Check if following
  const { data: followStatus } = useQuery({
    queryKey: ['follow-status', followerId, followingId],
    queryFn: async () => {
      if (!followerId) return { following: false };

      const res = await fetch(`/api/users/follow?followerId=${followerId}&followingId=${followingId}`);
      if (!res.ok) throw new Error('Failed to fetch follow status');
      return res.json() as Promise<{ following: boolean }>;
    },
    enabled: !!followerId && !!followingId && followerId !== followingId,
  });

  // Toggle follow mutation
  const followMutation = useMutation({
    mutationFn: async (): Promise<FollowResponse> => {
      if (!followerId) throw new Error('Must be logged in to follow');

      const res = await fetch('/api/users/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followerId, followingId }),
      });

      if (!res.ok) throw new Error('Failed to toggle follow');
      return res.json();
    },
    onSuccess: (data) => {
      // Update follow status cache
      queryClient.setQueryData(['follow-status', followerId, followingId], { following: data.following });

      // Invalidate user profile to update follower count
      queryClient.invalidateQueries({ queryKey: ['user-stats', followingId] });
      queryClient.invalidateQueries({ queryKey: ['top-creators'] });

      toast.success(data.message);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to follow user');
    },
  });

  return {
    following: followStatus?.following || false,
    toggleFollow: followMutation.mutate,
    isLoading: followMutation.isPending,
  };
}
