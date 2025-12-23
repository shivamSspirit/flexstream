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

interface CommentsResponse {
  comments: Comment[];
}

interface AddCommentResponse {
  comment: Comment;
  commentCount: number;
  message: string;
}

export function useComments(postId: string) {
  const queryClient = useQueryClient();

  // Fetch comments for a post
  const { data, isLoading, error } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async (): Promise<CommentsResponse> => {
      const res = await fetch(`/api/posts/comment?postId=${postId}`);
      if (!res.ok) throw new Error('Failed to fetch comments');
      return res.json();
    },
    enabled: !!postId,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Add comment mutation with optimistic updates
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

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to add comment');
      }

      return res.json();
    },
    onMutate: async (newComment) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['comments', postId] });

      // Snapshot previous value
      const previousComments = queryClient.getQueryData<CommentsResponse>(['comments', postId]);

      // Optimistically update - create temporary comment
      const tempComment: Comment = {
        id: `temp-${Date.now()}`,
        post_id: postId,
        user_id: newComment.userId,
        content: newComment.content,
        parent_id: newComment.parentId || null,
        created_at: new Date().toISOString(),
        users: {
          id: newComment.userId,
          username: 'You',
          display_name: 'You',
          avatar_url: null,
          verified: false,
        },
      };

      queryClient.setQueryData<CommentsResponse>(['comments', postId], (old) => ({
        comments: [...(old?.comments || []), tempComment],
      }));

      // Haptic feedback
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(15);
      }

      return { previousComments };
    },
    onSuccess: (data) => {
      // Replace with real comment from server
      queryClient.setQueryData<CommentsResponse>(['comments', postId], (old) => {
        const filtered = old?.comments.filter((c) => !c.id.startsWith('temp-')) || [];
        return { comments: [...filtered, data.comment] };
      });

      // Update post comment count
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });

      toast.success('Comment added!');
    },
    onError: (error: Error, _variables, context) => {
      // Rollback on error
      if (context?.previousComments) {
        queryClient.setQueryData(['comments', postId], context.previousComments);
      }

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
