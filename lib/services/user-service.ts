/**
 * User Service
 * Handles all user-related database operations
 * Follows Single Responsibility Principle
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { ERROR_MESSAGES } from '@/lib/constants';

// ============================================================================
// TYPES
// ============================================================================

export interface UserProfile {
  id: string;
  wallet_address: string;
  username: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  cover_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserParams {
  walletAddress: string;
  username?: string;
  displayName?: string;
}

export interface FindOrCreateUserResult {
  user: UserProfile;
  isNewUser: boolean;
}

// ============================================================================
// USER SERVICE CLASS
// ============================================================================

export class UserService {
  constructor(private supabase: SupabaseClient) {
    if (!supabase) {
      throw new Error(ERROR_MESSAGES.SUPABASE_NOT_CONFIGURED);
    }
  }

  /**
   * Finds an existing user by wallet address or creates a new one
   * Implements DRY principle - eliminates duplicated user creation logic
   */
  async findOrCreateUser(params: CreateUserParams): Promise<FindOrCreateUserResult> {
    const { walletAddress, username, displayName } = params;

    try {
      // First, try to find existing user
      const existingUser = await this.findUserByWallet(walletAddress);

      if (existingUser) {
        return {
          user: existingUser,
          isNewUser: false,
        };
      }

      // User doesn't exist, create new one
      const newUser = await this.createUser({
        walletAddress,
        username: username || this.generateUsername(walletAddress),
        displayName: displayName || this.generateDisplayName(walletAddress),
      });

      return {
        user: newUser,
        isNewUser: true,
      };
    } catch (error) {
      console.error('Error in findOrCreateUser:', error);
      throw new Error(ERROR_MESSAGES.USER_CREATION_FAILED);
    }
  }

  /**
   * Finds a user by wallet address
   */
  async findUserByWallet(walletAddress: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();

      if (error) {
        // If error is "not found", return null (not an error condition)
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error finding user by wallet:', error);
      return null;
    }
  }

  /**
   * Finds a user by username
   */
  async findUserByUsername(username: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error finding user by username:', error);
      return null;
    }
  }

  /**
   * Creates a new user
   */
  private async createUser(params: CreateUserParams): Promise<UserProfile> {
    const { walletAddress, username, displayName } = params;

    try {
      const { data, error } = await this.supabase
        .from('users')
        .insert({
          wallet_address: walletAddress,
          username: username || this.generateUsername(walletAddress),
          display_name: displayName || this.generateDisplayName(walletAddress),
          bio: '',
          avatar_url: this.generateDefaultAvatar(walletAddress),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('User created but no data returned');
      }

      return data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error(ERROR_MESSAGES.USER_CREATION_FAILED);
    }
  }

  /**
   * Updates user profile
   */
  async updateUserProfile(
    userId: string,
    updates: Partial<Omit<UserProfile, 'id' | 'wallet_address' | 'created_at'>>
  ): Promise<UserProfile> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('User updated but no data returned');
      }

      return data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new Error('Failed to update user profile');
    }
  }

  /**
   * Checks if username is available
   */
  async isUsernameAvailable(username: string): Promise<boolean> {
    const user = await this.findUserByUsername(username);
    return user === null;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Generates a clean, URL-friendly username
   * Format: user{timestamp}{random} - example: user1a2b3c4d5e
   * No underscores, no spaces, all lowercase
   */
  private generateUsername(walletAddress: string): string {
    const timestamp = Date.now().toString(36).toLowerCase();
    const randomSuffix = Math.random().toString(36).substring(2, 6).toLowerCase();
    return `user${timestamp}${randomSuffix}`;
  }

  /**
   * Generates a display name from wallet address
   */
  private generateDisplayName(walletAddress: string): string {
    const shortAddress = walletAddress.slice(0, 4);
    return `User ${shortAddress}`;
  }

  /**
   * Generates a default avatar URL using DiceBear API
   * Creates deterministic avatars based on wallet address
   */
  private generateDefaultAvatar(walletAddress: string): string {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${walletAddress}`;
  }
}

// ============================================================================
// FACTORY FUNCTION (Recommended approach)
// ============================================================================

/**
 * Creates a new UserService instance
 * Use this in API routes and server components
 */
export function createUserService(supabase: SupabaseClient): UserService {
  return new UserService(supabase);
}

// ============================================================================
// CONVENIENCE FUNCTIONS (For backward compatibility)
// ============================================================================

/**
 * Find or create user - standalone function
 * Maintains backward compatibility while using the service internally
 */
export async function findOrCreateUser(
  supabase: SupabaseClient,
  params: CreateUserParams
): Promise<FindOrCreateUserResult> {
  const service = createUserService(supabase);
  return service.findOrCreateUser(params);
}

/**
 * Find user by wallet - standalone function
 */
export async function findUserByWallet(
  supabase: SupabaseClient,
  walletAddress: string
): Promise<UserProfile | null> {
  const service = createUserService(supabase);
  return service.findUserByWallet(walletAddress);
}

/**
 * Find user by username - standalone function
 */
export async function findUserByUsername(
  supabase: SupabaseClient,
  username: string
): Promise<UserProfile | null> {
  const service = createUserService(supabase);
  return service.findUserByUsername(username);
}
