'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeftIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  ShoppingCartIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;
  
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<any[]>([]);

  useEffect(() => {
    if (postId) {
      fetchPost();
      fetchComments();
    }
  }, [postId]);

  const fetchPost = async () => {
    try {
      if (!supabase) {
        console.error('Supabase not configured');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:users(*)
        `)
        .eq('id', postId)
        .single();

      if (error) throw error;
      setPost(data);
      setIsLiked(data.is_liked || false);
    } catch (err) {
      console.error('Error fetching post:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      if (!supabase) {
        console.error('Supabase not configured');
        return;
      }

      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          user:users(*)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  const handleLike = async () => {
    setIsLiked(!isLiked);
    if (post) {
      const newLikeCount = isLiked ? post.likes_count - 1 : post.likes_count + 1;
      setPost({ ...post, likes_count: newLikeCount });

      if (!supabase) {
        console.error('Supabase not configured');
        return;
      }

      await supabase
        .from('posts')
        .update({ likes_count: newLikeCount })
        .eq('id', postId);
    }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;

    if (!supabase) {
      console.error('Supabase not configured');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: 'anonymous', // TODO: Use actual user ID
          content: comment,
        })
        .select(`
          *,
          user:users(*)
        `)
        .single();

      if (error) throw error;
      
      setComments([data, ...comments]);
      setComment('');
      
      // Update comment count
      if (post) {
        setPost({ ...post, comments_count: post.comments_count + 1 });
      }
    } catch (err) {
      console.error('Error posting comment:', err);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: post.content,
        url: window.location.href
      });
      
      if (post) {
        const newShareCount = post.shares_count + 1;
        setPost({ ...post, shares_count: newShareCount });

        if (!supabase) {
          console.error('Supabase not configured');
          return;
        }

        await supabase
          .from('posts')
          .update({ shares_count: newShareCount })
          .eq('id', postId);
      }
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  const handleBuy = () => {
    if (post?.token_address) {
      window.open(`https://pump.fun/${post.token_address}`, '_blank');
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-secondary text-sm">Loading post...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!post) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h1 className="text-2xl font-bold text-primary mb-2">Post Not Found</h1>
          <p className="text-secondary mb-6">This post doesn't exist or has been removed</p>
          <Button onClick={() => router.push('/')}>
            Go Home
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto pb-20 md:pb-0">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-secondary hover:text-primary transition-colors mb-6"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>

        {/* Post Card */}
        <div className="bg-card-bg rounded-2xl border border-white/10 overflow-hidden">
          {/* User Header */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <Avatar 
                className="h-12 w-12 ring-2 ring-white/10 cursor-pointer"
                onClick={() => router.push(`/profile/${post.user?.username}`)}
              >
                <AvatarImage src={post.user?.avatar_url} alt={post.user?.username} />
                <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white font-semibold">
                  {post.user?.username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span 
                    className="text-primary font-semibold hover:text-purple-400 cursor-pointer transition-colors"
                    onClick={() => router.push(`/profile/${post.user?.username}`)}
                  >
                    {post.user?.username}
                  </span>
                  {post.verified && (
                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">✓</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-secondary">
                  {new Date(post.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Media */}
          {post.media_urls && post.media_urls.length > 0 && (
            <div className="bg-black">
              <img
                src={post.media_urls[0]}
                alt={post.content}
                className="w-full h-auto"
              />
            </div>
          )}

          {/* Post Content */}
          <div className="p-4">
            <h1 className="text-2xl font-bold text-primary mb-3">{post.title || post.content}</h1>
            <p className="text-primary mb-4 whitespace-pre-wrap">{post.content}</p>

            {/* Token Info */}
            {post.token_address && (
              <div className="mb-4 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl">
                <p className="text-sm font-semibold text-purple-400 mb-2">🪙 Token: {post.token_symbol}</p>
                <div className="flex items-center gap-2 text-xs text-secondary font-mono">
                  <span>Mint:</span>
                  <span className="truncate">{post.token_address}</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <div className="flex items-center gap-6">
                <button
                  onClick={handleLike}
                  className="flex items-center gap-2 text-secondary hover:text-red-500 transition-colors"
                >
                  {isLiked ? (
                    <HeartSolidIcon className="w-6 h-6 text-red-500" />
                  ) : (
                    <HeartIcon className="w-6 h-6" />
                  )}
                  <span className="text-sm font-medium">{post.likes_count || 0}</span>
                </button>

                <button className="flex items-center gap-2 text-secondary hover:text-blue-500 transition-colors">
                  <ChatBubbleLeftIcon className="w-6 h-6" />
                  <span className="text-sm font-medium">{post.comments_count || 0}</span>
                </button>

                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 text-secondary hover:text-green-500 transition-colors"
                >
                  <ShareIcon className="w-6 h-6" />
                  <span className="text-sm font-medium">{post.shares_count || 0}</span>
                </button>
              </div>

              {post.token_address && (
                <Button
                  onClick={handleBuy}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold flex items-center gap-2"
                >
                  <ShoppingCartIcon className="w-5 h-5" />
                  Buy Token
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-6 bg-card-bg rounded-2xl border border-white/10 p-4">
          <h2 className="text-lg font-bold text-primary mb-4">Comments ({comments.length})</h2>

          {/* Add Comment */}
          <div className="mb-6">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts..."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-primary placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              rows={3}
            />
            <Button
              onClick={handleComment}
              disabled={!comment.trim()}
              className="mt-2 bg-gradient-to-r from-purple-600 to-pink-600 disabled:opacity-50"
            >
              Post Comment
            </Button>
          </div>

          {/* Comments List */}
          <div className="space-y-4">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={c.user?.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white">
                    {c.user?.username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-primary">{c.user?.username}</span>
                    <span className="text-xs text-secondary">
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-primary">{c.content}</p>
                </div>
              </div>
            ))}

            {comments.length === 0 && (
              <p className="text-center text-secondary text-sm py-8">
                No comments yet. Be the first to comment!
              </p>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

