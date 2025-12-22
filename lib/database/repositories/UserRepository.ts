/**
 * User Repository
 * Single source of truth for all user database operations
 * Follows Repository Pattern - separation of concerns
 */

import { db } from '../client';
import { NotFoundError, DatabaseError, ValidationError } from '@/lib/errors/AppError';

export interface User {
  id: string;
  wallet_address: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  verified: boolean;
  creator_coin_enabled: boolean;
  creator_coin_mint: string | null;
  created_at: string;
  updated_at: string;
}

export class UserRepository {
  /**
   * Find user by wallet address
   */
  static async findByWallet(walletAddress: string): Promise<User> {
    const { data, error } = await db
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (error) {
      throw new DatabaseError('Failed to fetch user by wallet', { error: error.message });
    }

    if (!data) {
      throw new NotFoundError('User', walletAddress);
    }

    return data;
  }

  /**
   * Find user by username
   */
  static async findByUsername(username: string): Promise<User> {
    const { data, error } = await db
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error) {
      throw new DatabaseError('Failed to fetch user by username', { error: error.message });
    }

    if (!data) {
      throw new NotFoundError('User', username);
    }

    return data;
  }

  /**
   * Find user by ID
   */
  static async findById(id: string): Promise<User> {
    const { data, error } = await db
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new DatabaseError('Failed to fetch user by ID', { error: error.message });
    }

    if (!data) {
      throw new NotFoundError('User', id);
    }

    return data;
  }

  /**
   * Create new user
   */
  static async create(userData: {
    id: string;
    wallet_address: string;
    username: string;
    display_name: string;
    avatar_url?: string;
    bio?: string;
  }): Promise<User> {
    const { data, error } = await db
      .from('users')
      .insert({
        ...userData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new DatabaseError('Failed to create user', { error: error.message });
    }

    return data;
  }

  /**
   * Update user profile
   */
  static async update(id: string, updates: Partial<User>): Promise<User> {
    const { data, error} = await db
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new DatabaseError('Failed to update user', { error: error.message });
    }

    return data;
  }

  /**
   * Check if username exists
   */
  static async usernameExists(username: string): Promise<boolean> {
    const { data, error } = await db
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw new DatabaseError('Failed to check username', { error: error.message });
    }

    return !!data;
  }

  /**
   * Check if wallet exists
   */
  static async walletExists(walletAddress: string): Promise<boolean> {
    const { data, error } = await db
      .from('users')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new DatabaseError('Failed to check wallet', { error: error.message });
    }

    return !!data;
  }

  /**
   * Get top creators by post count
   */
  static async getTopCreators(limit: number = 10): Promise<Array<User & { post_count: number }>> {
    const { data, error } = await db
      .from('users')
      .select(`
        *,
        posts:posts(count)
      `)
      .order('posts.count', { ascending: false })
      .limit(limit);

    if (error) {
      throw new DatabaseError('Failed to fetch top creators', { error: error.message });
    }

    return data as any;
  }
}
