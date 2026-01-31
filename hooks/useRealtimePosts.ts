'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Post } from './usePosts';

// Type for the raw post record from Supabase Realtime
interface PostRecord {
  id: string;
  user_id: string;
  type: string;
  title: string;
  content: string;
  media_urls: string[];
  token_mint: string | null;
  created_at: string;
  [key: string]: unknown;
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

interface RealtimePostsOptions {
  userId?: string;
  enabled?: boolean;
}

/**
 * Hook that subscribes to real-time changes on the posts table
 * Automatically updates React Query cache when posts are inserted, updated, or deleted
 */
export function useRealtimePosts(options: RealtimePostsOptions = {}) {
  const { userId, enabled = true } = options;
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Store values in refs for stable handler references (prevents subscription reconnection)
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  const queryClientRef = useRef(queryClient);
  queryClientRef.current = queryClient;

  // Set up subscription - only depends on enabled and userId for filter setup
  useEffect(() => {
    if (!enabled || !supabase) {
      console.log('[REALTIME] Subscription disabled or Supabase not configured');
      return;
    }

    console.log('[REALTIME] Setting up posts subscription', userId ? `for user: ${userId}` : '(all posts)');

    // Create channel with unique name
    const channelName = `posts-realtime-${userId || 'all'}-${Date.now()}`;

    // Build filter if userId is provided
    const filter = userId ? `user_id=eq.${userId}` : undefined;

    // Handle new post insertion - defined inside useEffect to use refs
    const handleInsert = async (payload: RealtimePostgresChangesPayload<PostRecord>) => {
      const newPost = payload.new as PostRecord | null;
      console.log('[REALTIME] New post inserted:', newPost?.id);

      if (!newPost) return;

      // Fetch the complete post with user data
      if (!supabase) return;

      const { data: completePost, error } = await supabase
        .from('posts')
        .select(`
          *,
          users!inner (
            id,
            username,
            display_name,
            avatar_url,
            wallet_address
          )
        `)
        .eq('id', newPost.id)
        .single();

      if (error || !completePost) {
        console.error('[REALTIME] Failed to fetch complete post:', error);
        return;
      }

      // Update EXISTING queries only - do NOT create new caches
      // (Creating new caches with single post would overwrite the full post list from API)
      const queries = queryClientRef.current.getQueriesData<PostsResponse>({ queryKey: ['posts'] });

      for (const [queryKey, currentData] of queries) {
        // Skip if no data exists - let API fetch the full list
        if (!currentData) {
          console.log('[REALTIME] No cache data, skipping (API will fetch)', { queryKey });
          continue;
        }

        // Extract userId from query key: ['posts', { userId, limit, offset }]
        const queryParams = queryKey[1] as { userId?: string; limit?: number; offset?: number } | undefined;
        const queryUserId = queryParams?.userId;

        // Determine if this post should be added to this query:
        // - Main feed (userId undefined): add all posts
        // - Profile feed (userId set): only add if post belongs to that user
        const shouldAdd = !queryUserId || queryUserId === completePost.user_id;

        if (!shouldAdd) {
          console.log('[REALTIME] Skipping query - userId mismatch', {
            queryKey,
            queryUserId,
            postUserId: completePost.user_id
          });
          continue;
        }

        // Check if post already exists (prevent duplicates)
        const exists = currentData.data.posts.some(p => p.id === completePost.id);
        if (exists) {
          console.log('[REALTIME] Post already in cache, skipping', { queryKey });
          continue;
        }

        console.log('[REALTIME] Adding new post to existing cache at top', { queryKey });
        queryClientRef.current.setQueryData<PostsResponse>(queryKey, {
          ...currentData,
          data: {
            ...currentData.data,
            posts: [completePost as Post, ...currentData.data.posts],
            count: currentData.data.count + 1,
          },
        });
      }

      // Invalidate profile query to ensure fresh data on next mount
      queryClientRef.current.invalidateQueries({
        queryKey: ['posts', { userId: completePost.user_id }],
        exact: false,
        refetchType: 'none',
      });

      // Also invalidate main feed
      queryClientRef.current.invalidateQueries({
        queryKey: ['posts', { userId: undefined }],
        exact: false,
        refetchType: 'none',
      });
    };

    // Handle post update
    const handleUpdate = (payload: RealtimePostgresChangesPayload<PostRecord>) => {
      const updatedPost = payload.new as PostRecord | null;
      console.log('[REALTIME] Post updated:', updatedPost?.id);

      if (!updatedPost) return;

      queryClientRef.current.setQueriesData<PostsResponse>(
        { queryKey: ['posts'] },
        (oldData) => {
          if (!oldData) return oldData;

          const postIndex = oldData.data.posts.findIndex(p => p.id === updatedPost.id);
          if (postIndex === -1) return oldData;

          const newPosts = [...oldData.data.posts];
          // Merge the update with existing post (preserve user data)
          newPosts[postIndex] = {
            ...newPosts[postIndex],
            ...updatedPost,
            users: newPosts[postIndex].users, // Keep existing user data
          };

          return {
            ...oldData,
            data: {
              ...oldData.data,
              posts: newPosts,
            },
          };
        }
      );
    };

    // Handle post deletion
    const handleDelete = (payload: RealtimePostgresChangesPayload<PostRecord>) => {
      const deletedPost = payload.old as PostRecord | null;
      console.log('[REALTIME] Post deleted:', deletedPost?.id);

      if (!deletedPost?.id) return;

      queryClientRef.current.setQueriesData<PostsResponse>(
        { queryKey: ['posts'] },
        (oldData) => {
          if (!oldData) return oldData;

          const newPosts = oldData.data.posts.filter(p => p.id !== deletedPost.id);
          if (newPosts.length === oldData.data.posts.length) return oldData;

          return {
            ...oldData,
            data: {
              ...oldData.data,
              posts: newPosts,
              count: oldData.data.count - 1,
            },
          };
        }
      );
    };

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
          filter,
        },
        handleInsert
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'posts',
          filter,
        },
        handleUpdate
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'posts',
          filter,
        },
        handleDelete
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('[REALTIME] Subscribed to posts changes');
        } else if (status === 'CLOSED') {
          console.log('[REALTIME] Subscription closed');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[REALTIME] Channel error:', err);
        }
      });

    channelRef.current = channel;

    // Cleanup on unmount
    return () => {
      console.log('[REALTIME] Cleaning up subscription');
      if (channelRef.current && supabase) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled, userId]); // Only re-subscribe when enabled or userId changes

  // Return function to manually trigger refresh
  return {
    refresh: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  };
}
