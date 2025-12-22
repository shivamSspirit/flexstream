/**
 * Post Repository
 * Centralized post data access layer
 */

import { db } from '../client';
import { NotFoundError, DatabaseError } from '@/lib/errors/AppError';

export interface Post {
  id: string;
  user_id: string;
  type: string;
  title: string;
  content: string;
  media_urls: string[];
  token_mint: string | null;
  token_symbol: string | null;
  token_display_name: string | null;
  pool_address: string | null;
  verified: boolean;
  created_at: string;
  users?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
    wallet_address: string;
  };
}

export class PostRepository {
  /**
   * Find all posts with pagination
   */
  static async findAll(options: {
    limit?: number;
    offset?: number;
    userId?: string;
  } = {}): Promise<{ posts: Post[]; count: number }> {
    const { limit = 20, offset = 0, userId } = options;

    let query = db
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
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new DatabaseError('Failed to fetch posts', { error: error.message });
    }

    return {
      posts: (data as any) || [],
      count: count || 0,
    };
  }

  /**
   * Find post by ID
   */
  static async findById(id: string): Promise<Post> {
    const { data, error } = await db
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
      .eq('id', id)
      .single();

    if (error) {
      throw new DatabaseError('Failed to fetch post', { error: error.message });
    }

    if (!data) {
      throw new NotFoundError('Post', id);
    }

    return data as any;
  }

  /**
   * Create new post
   */
  static async create(postData: {
    id: string;
    user_id: string;
    type: string;
    title: string;
    content: string;
    media_urls: string[];
    token_mint?: string;
    token_symbol?: string;
    token_display_name?: string;
    pool_address?: string;
  }): Promise<Post> {
    const { data, error } = await db
      .from('posts')
      .insert({
        ...postData,
        created_at: new Date().toISOString(),
      })
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
      .single();

    if (error) {
      throw new DatabaseError('Failed to create post', { error: error.message });
    }

    return data as any;
  }

  /**
   * Update post
   */
  static async update(id: string, updates: Partial<Post>): Promise<Post> {
    const { data, error } = await db
      .from('posts')
      .update(updates)
      .eq('id', id)
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
      .single();

    if (error) {
      throw new DatabaseError('Failed to update post', { error: error.message });
    }

    return data as any;
  }

  /**
   * Delete post
   */
  static async delete(id: string): Promise<void> {
    const { error } = await db
      .from('posts')
      .delete()
      .eq('id', id);

    if (error) {
      throw new DatabaseError('Failed to delete post', { error: error.message });
    }
  }

  /**
   * Get post count for user
   */
  static async getCountByUser(userId: string): Promise<number> {
    const { count, error } = await db
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      throw new DatabaseError('Failed to count posts', { error: error.message });
    }

    return count || 0;
  }
}
