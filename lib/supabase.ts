import { createClient } from '@supabase/supabase-js';

// Use environment variables directly with fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Only create client if we have the required variables
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null;

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          wallet_address: string | null
          username: string
          display_name: string
          avatar_url: string | null
          bio: string | null
          verified_earnings: number
          success_tier: 'bronze' | 'silver' | 'gold' | 'diamond'
          total_followers: number
          total_following: number
          created_at: string
          updated_at: string
          encrypted_private_key: string | null
          wallet_created_at: string | null
          clerk_user_id: string | null
        }
        Insert: {
          id?: string
          wallet_address?: string | null
          username: string
          display_name: string
          avatar_url?: string | null
          bio?: string | null
          verified_earnings?: number
          success_tier?: 'bronze' | 'silver' | 'gold' | 'diamond'
          total_followers?: number
          total_following?: number
          created_at?: string
          updated_at?: string
          encrypted_private_key?: string | null
          wallet_created_at?: string | null
          clerk_user_id?: string | null
        }
        Update: {
          id?: string
          wallet_address?: string | null
          username?: string
          display_name?: string
          avatar_url?: string | null
          bio?: string | null
          verified_earnings?: number
          success_tier?: 'bronze' | 'silver' | 'gold' | 'diamond'
          total_followers?: number
          total_following?: number
          created_at?: string
          updated_at?: string
          encrypted_private_key?: string | null
          wallet_created_at?: string | null
          clerk_user_id?: string | null
        }
      }
      posts: {
        Row: {
          id: string
          user_id: string
          type: 'earnings_flex' | 'stream_highlight' | 'lifestyle' | 'trading_journey'
          content: string
          media_urls: string[]
          earnings_amount: number | null
          token_address: string | null
          verified: boolean
          likes_count: number
          comments_count: number
          shares_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'earnings_flex' | 'stream_highlight' | 'lifestyle' | 'trading_journey'
          content: string
          media_urls?: string[]
          earnings_amount?: number | null
          token_address?: string | null
          verified?: boolean
          likes_count?: number
          comments_count?: number
          shares_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'earnings_flex' | 'stream_highlight' | 'lifestyle' | 'trading_journey'
          content?: string
          media_urls?: string[]
          earnings_amount?: number | null
          token_address?: string | null
          verified?: boolean
          likes_count?: number
          comments_count?: number
          shares_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
        }
      }
      likes: {
        Row: {
          id: string
          user_id: string
          post_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          post_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          user_id: string
          post_id: string
          parent_id: string | null
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          post_id: string
          parent_id?: string | null
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string
          parent_id?: string | null
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'like' | 'comment' | 'follow' | 'mention'
          from_user_id: string
          post_id: string | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'like' | 'comment' | 'follow' | 'mention'
          from_user_id: string
          post_id?: string | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'like' | 'comment' | 'follow' | 'mention'
          from_user_id?: string
          post_id?: string | null
          read?: boolean
          created_at?: string
        }
      }
      earnings_verifications: {
        Row: {
          id: string
          user_id: string
          post_id: string
          wallet_address: string
          claimed_amount: number
          verified_amount: number | null
          verification_status: 'pending' | 'verified' | 'rejected'
          pump_fun_tx_hash: string | null
          verification_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          post_id: string
          wallet_address: string
          claimed_amount: number
          verified_amount?: number | null
          verification_status?: 'pending' | 'verified' | 'rejected'
          pump_fun_tx_hash?: string | null
          verification_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string
          wallet_address?: string
          claimed_amount?: number
          verified_amount?: number | null
          verification_status?: 'pending' | 'verified' | 'rejected'
          pump_fun_tx_hash?: string | null
          verification_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
