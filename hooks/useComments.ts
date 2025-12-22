import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  users: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
    verified: boolean;
  };
}

interface AddCommentResponse {
  comment: Comment;
  commentCount: number;
  message: string;
}

export function useComments(postId: string) {
  const queryClient = useQueryClient();

  // Fetch comments for post
  const { data, isLoading, error } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const res = await fetch(`/api/posts/comment?postId=${postId}`);
      if (!res.ok) throw new Error('Failed to fetch comments');
      return res.json() as Promise<{ comments: Comment[] }>;
    },
    enabled: !!postId,
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({
      userId,
      content,
      parentId,
    }: {
      userId: string;
      content: string;
      parentId?: string;
    }): Promise<AddCommentResponse> => {
      const res = await fetch('/api/posts/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, userId, content, parentId }),
      });

      if (!res.ok) throw new Error('Failed to add comment');
      return res.json();
    },
    onSuccess: (data) => {
      // Invalidate comments to refetch
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });

      toast.success(data.message);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add comment');
    },
  });

  return {
    comments: data?.comments || [],
    isLoading,
    error,
    addComment: addCommentMutation.mutate,
    isAddingComment: addCommentMutation.isPending,
  };
}
