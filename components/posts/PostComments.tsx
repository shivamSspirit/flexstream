'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Send, Heart, Reply } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatTimeAgo } from '@/lib/utils';
import { Comment } from '@/types';
import { supabase } from '@/lib/supabase';

interface PostCommentsProps {
  postId: string;
}

export function PostComments({ postId }: PostCommentsProps) {
  const { userId } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    setLoading(true);

    if (!supabase) {
      console.error('Supabase not configured');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          user:users(*)
        `)
        .eq('post_id', postId)
        .is('parent_id', null)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching comments:', error);
        return;
      }

      setComments(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !userId) return;

    if (!supabase) {
      console.error('Supabase not configured');
      return;
    }

    setSubmitting(true);
    try {
      // First get the user's database ID from their Privy ID
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (profileError || !userProfile) {
        console.error('User profile not found:', profileError);
        return;
      }

      const { data, error } = await supabase
        .from('comments')
        .insert({
          user_id: userProfile.id,
          post_id: postId,
          content: newComment.trim(),
        })
        .select(`
          *,
          user:users(*)
        `)
        .single();

      if (error) {
        console.error('Error creating comment:', error);
        return;
      }

      setComments(prev => [...prev, data]);
      setNewComment('');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    // TODO: Implement comment liking
    console.log('Like comment:', commentId);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex space-x-3">
            <div className="h-8 w-8 bg-gray-700 rounded-full animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 bg-gray-700 rounded animate-pulse" />
              <div className="h-4 w-full bg-gray-700 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-4 border-t border-gray-700">
      {/* Comment Form */}
      {userId && (
        <form onSubmit={handleSubmitComment} className="flex space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src="" alt="User" />
          <AvatarFallback>
              U
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 flex space-x-2">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              disabled={submitting}
            />
            <Button
              type="submit"
              size="sm"
              disabled={!newComment.trim() || submitting}
              className="flexstream-gradient"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={comment.user?.avatar_url} alt={comment.user?.display_name} />
              <AvatarFallback>
                {comment.user?.display_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-white text-sm">
                  {comment.user?.display_name}
                </span>
                <span className="text-gray-400 text-xs">
                  @{comment.user?.username}
                </span>
                <span className="text-gray-500 text-xs">
                  {formatTimeAgo(comment.created_at)}
                </span>
              </div>
              
              <p className="text-gray-300 text-sm">
                {comment.content}
              </p>
              
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLikeComment(comment.id)}
                  className="text-gray-400 hover:text-red-400 text-xs"
                >
                  <Heart className="h-3 w-3 mr-1" />
                  Like
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-blue-400 text-xs"
                >
                  <Reply className="h-3 w-3 mr-1" />
                  Reply
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {comments.length === 0 && (
        <div className="text-center py-4">
          <p className="text-gray-400 text-sm">
            No comments yet. Be the first to comment!
          </p>
        </div>
      )}
    </div>
  );
}
