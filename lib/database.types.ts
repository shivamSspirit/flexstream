export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          parent_id: string | null
          post_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          post_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          post_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      flex_airdrop_claims: {
        Row: {
          airdrop_id: string | null
          claimed: boolean | null
          claimed_at: string | null
          created_at: string | null
          id: string
          points_snapshot: number
          tokens_received: number
          tx_signature: string | null
          user_id: string | null
        }
        Insert: {
          airdrop_id?: string | null
          claimed?: boolean | null
          claimed_at?: string | null
          created_at?: string | null
          id?: string
          points_snapshot: number
          tokens_received: number
          tx_signature?: string | null
          user_id?: string | null
        }
        Update: {
          airdrop_id?: string | null
          claimed?: boolean | null
          claimed_at?: string | null
          created_at?: string | null
          id?: string
          points_snapshot?: number
          tokens_received?: number
          tx_signature?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flex_airdrop_claims_airdrop_id_fkey"
            columns: ["airdrop_id"]
            isOneToOne: false
            referencedRelation: "flex_airdrops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flex_airdrop_claims_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      flex_airdrops: {
        Row: {
          completed_at: string | null
          conversion_rate: number | null
          created_at: string | null
          id: string
          participants_count: number | null
          period_end: string
          period_start: string
          status: string | null
          total_points_distributed: number
          total_tokens_minted: number
          tx_signature: string | null
        }
        Insert: {
          completed_at?: string | null
          conversion_rate?: number | null
          created_at?: string | null
          id?: string
          participants_count?: number | null
          period_end: string
          period_start: string
          status?: string | null
          total_points_distributed?: number
          total_tokens_minted?: number
          tx_signature?: string | null
        }
        Update: {
          completed_at?: string | null
          conversion_rate?: number | null
          created_at?: string | null
          id?: string
          participants_count?: number | null
          period_end?: string
          period_start?: string
          status?: string | null
          total_points_distributed?: number
          total_tokens_minted?: number
          tx_signature?: string | null
        }
        Relationships: []
      }
      flex_multipliers: {
        Row: {
          active: boolean | null
          created_at: string | null
          ends_at: string
          id: string
          multiplier: number
          name: string
          starts_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          ends_at: string
          id?: string
          multiplier: number
          name: string
          starts_at: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          ends_at?: string
          id?: string
          multiplier?: number
          name?: string
          starts_at?: string
        }
        Relationships: []
      }
      flex_points: {
        Row: {
          available_flex: number | null
          created_at: string | null
          current_streak: number | null
          id: string
          last_active_date: string | null
          last_airdrop_at: string | null
          longest_streak: number | null
          period_flex: number | null
          total_flex: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          available_flex?: number | null
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_active_date?: string | null
          last_airdrop_at?: string | null
          longest_streak?: number | null
          period_flex?: number | null
          total_flex?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          available_flex?: number | null
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_active_date?: string | null
          last_airdrop_at?: string | null
          longest_streak?: number | null
          period_flex?: number | null
          total_flex?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flex_points_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      flex_transactions: {
        Row: {
          action: string
          amount: number
          created_at: string | null
          final_amount: number
          id: string
          metadata: Json | null
          multiplier: number | null
          user_id: string | null
        }
        Insert: {
          action: string
          amount: number
          created_at?: string | null
          final_amount: number
          id?: string
          metadata?: Json | null
          multiplier?: number | null
          user_id?: string | null
        }
        Update: {
          action?: string
          amount?: number
          created_at?: string | null
          final_amount?: number
          id?: string
          metadata?: Json | null
          multiplier?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flex_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string | null
          follower_id: string | null
          following_id: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id?: string | null
          following_id?: string | null
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string | null
          following_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          bonding_curve_address: string | null
          comments_count: number | null
          content: string
          cover_url: string | null
          created_at: string | null
          creator_is_verified: boolean | null
          current_market_cap: number | null
          earnings_amount: number | null
          id: string
          initial_market_cap: number | null
          is_token_tradable: boolean | null
          likes_count: number | null
          media_urls: string[] | null
          pool_address: string | null
          shares_count: number | null
          social_link: string | null
          title: string | null
          token_address: string | null
          token_created_at: string | null
          token_display_name: string | null
          token_is_verified: boolean | null
          token_metadata_uri: string | null
          token_mint: string | null
          token_name: string | null
          token_signature: string | null
          token_symbol: string | null
          type: string
          updated_at: string | null
          user_id: string | null
          verified: boolean | null
        }
        Insert: {
          bonding_curve_address?: string | null
          comments_count?: number | null
          content: string
          cover_url?: string | null
          created_at?: string | null
          creator_is_verified?: boolean | null
          current_market_cap?: number | null
          earnings_amount?: number | null
          id?: string
          initial_market_cap?: number | null
          is_token_tradable?: boolean | null
          likes_count?: number | null
          media_urls?: string[] | null
          pool_address?: string | null
          shares_count?: number | null
          social_link?: string | null
          title?: string | null
          token_address?: string | null
          token_created_at?: string | null
          token_display_name?: string | null
          token_is_verified?: boolean | null
          token_metadata_uri?: string | null
          token_mint?: string | null
          token_name?: string | null
          token_signature?: string | null
          token_symbol?: string | null
          type: string
          updated_at?: string | null
          user_id?: string | null
          verified?: boolean | null
        }
        Update: {
          bonding_curve_address?: string | null
          comments_count?: number | null
          content?: string
          cover_url?: string | null
          created_at?: string | null
          creator_is_verified?: boolean | null
          current_market_cap?: number | null
          earnings_amount?: number | null
          id?: string
          initial_market_cap?: number | null
          is_token_tradable?: boolean | null
          likes_count?: number | null
          media_urls?: string[] | null
          pool_address?: string | null
          shares_count?: number | null
          social_link?: string | null
          title?: string | null
          token_address?: string | null
          token_created_at?: string | null
          token_display_name?: string | null
          token_is_verified?: boolean | null
          token_metadata_uri?: string | null
          token_mint?: string | null
          token_name?: string | null
          token_signature?: string | null
          token_symbol?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      token_trades: {
        Row: {
          base_amount: number
          block_time: string | null
          created_at: string | null
          fee_amount: number | null
          id: string
          mint_address: string
          pool_address: string
          price_per_token: number | null
          quote_amount: number
          signature: string
          token_id: string | null
          trade_type: string
          trader_wallet: string
        }
        Insert: {
          base_amount: number
          block_time?: string | null
          created_at?: string | null
          fee_amount?: number | null
          id?: string
          mint_address: string
          pool_address: string
          price_per_token?: number | null
          quote_amount: number
          signature: string
          token_id?: string | null
          trade_type: string
          trader_wallet: string
        }
        Update: {
          base_amount?: number
          block_time?: string | null
          created_at?: string | null
          fee_amount?: number | null
          id?: string
          mint_address?: string
          pool_address?: string
          price_per_token?: number | null
          quote_amount?: number
          signature?: string
          token_id?: string | null
          trade_type?: string
          trader_wallet?: string
        }
        Relationships: [
          {
            foreignKeyName: "token_trades_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      tokens: {
        Row: {
          bonding_curve_address: string | null
          config_key: string | null
          created_at: string | null
          creation_signature: string | null
          creator_wallet: string
          current_supply: number | null
          description: string | null
          display_name: string | null
          holders_count: number | null
          id: string
          image_uri: string | null
          initial_supply: number | null
          is_migrated: boolean | null
          is_tradable: boolean | null
          is_verified: boolean | null
          market_cap: number | null
          metadata_uri: string | null
          migrated_at: string | null
          mint_address: string
          name: string
          pool_address: string
          post_id: string | null
          price_sol: number | null
          price_usd: number | null
          symbol: string
          trades_count: number | null
          updated_at: string | null
          virtual_base_reserves: number | null
          virtual_quote_reserves: number | null
          volume_24h: number | null
          volume_total: number | null
        }
        Insert: {
          bonding_curve_address?: string | null
          config_key?: string | null
          created_at?: string | null
          creation_signature?: string | null
          creator_wallet: string
          current_supply?: number | null
          description?: string | null
          display_name?: string | null
          holders_count?: number | null
          id?: string
          image_uri?: string | null
          initial_supply?: number | null
          is_migrated?: boolean | null
          is_tradable?: boolean | null
          is_verified?: boolean | null
          market_cap?: number | null
          metadata_uri?: string | null
          migrated_at?: string | null
          mint_address: string
          name: string
          pool_address: string
          post_id?: string | null
          price_sol?: number | null
          price_usd?: number | null
          symbol: string
          trades_count?: number | null
          updated_at?: string | null
          virtual_base_reserves?: number | null
          virtual_quote_reserves?: number | null
          volume_24h?: number | null
          volume_total?: number | null
        }
        Update: {
          bonding_curve_address?: string | null
          config_key?: string | null
          created_at?: string | null
          creation_signature?: string | null
          creator_wallet?: string
          current_supply?: number | null
          description?: string | null
          display_name?: string | null
          holders_count?: number | null
          id?: string
          image_uri?: string | null
          initial_supply?: number | null
          is_migrated?: boolean | null
          is_tradable?: boolean | null
          is_verified?: boolean | null
          market_cap?: number | null
          metadata_uri?: string | null
          migrated_at?: string | null
          mint_address?: string
          name?: string
          pool_address?: string
          post_id?: string | null
          price_sol?: number | null
          price_usd?: number | null
          symbol?: string
          trades_count?: number | null
          updated_at?: string | null
          virtual_base_reserves?: number | null
          virtual_quote_reserves?: number | null
          volume_24h?: number | null
          volume_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tokens_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          bio: string | null
          cover_url: string | null
          created_at: string | null
          creator_coin_bonding_curve: string | null
          creator_coin_created_at: string | null
          creator_coin_creation_signature: string | null
          creator_coin_enabled: boolean | null
          creator_coin_metadata_uri: string | null
          creator_coin_mint: string | null
          creator_coin_pool: string | null
          display_name: string
          id: string
          instagram: string | null
          post_launch_count: number | null
          profile_completed: boolean | null
          success_tier: string | null
          total_followers: number | null
          total_following: number | null
          twitter: string | null
          twitter_verified: boolean | null
          updated_at: string | null
          username: string
          verified_earnings: number | null
          wallet_address: string
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string | null
          creator_coin_bonding_curve?: string | null
          creator_coin_created_at?: string | null
          creator_coin_creation_signature?: string | null
          creator_coin_enabled?: boolean | null
          creator_coin_metadata_uri?: string | null
          creator_coin_mint?: string | null
          creator_coin_pool?: string | null
          display_name: string
          id: string
          instagram?: string | null
          post_launch_count?: number | null
          profile_completed?: boolean | null
          success_tier?: string | null
          total_followers?: number | null
          total_following?: number | null
          twitter?: string | null
          twitter_verified?: boolean | null
          updated_at?: string | null
          username: string
          verified_earnings?: number | null
          wallet_address: string
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string | null
          creator_coin_bonding_curve?: string | null
          creator_coin_created_at?: string | null
          creator_coin_creation_signature?: string | null
          creator_coin_enabled?: boolean | null
          creator_coin_metadata_uri?: string | null
          creator_coin_mint?: string | null
          creator_coin_pool?: string | null
          display_name?: string
          id?: string
          instagram?: string | null
          post_launch_count?: number | null
          profile_completed?: boolean | null
          success_tier?: string | null
          total_followers?: number | null
          total_following?: number | null
          twitter?: string | null
          twitter_verified?: boolean | null
          updated_at?: string | null
          username?: string
          verified_earnings?: number | null
          wallet_address?: string
          website?: string | null
        }
        Relationships: []
      }
      waitlist_signups: {
        Row: {
          created_at: string | null
          email: string
          id: string
          metadata: Json | null
          position: number | null
          referral_code: string
          referral_count: number | null
          referred_by: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          metadata?: Json | null
          position?: number | null
          referral_code: string
          referral_count?: number | null
          referred_by?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          metadata?: Json | null
          position?: number | null
          referral_code?: string
          referral_count?: number | null
          referred_by?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      token_leaderboard: {
        Row: {
          created_at: string | null
          creator_avatar: string | null
          creator_username: string | null
          creator_wallet: string | null
          display_name: string | null
          holders_count: number | null
          id: string | null
          image_uri: string | null
          is_verified: boolean | null
          market_cap: number | null
          mint_address: string | null
          name: string | null
          pool_address: string | null
          post_content: string | null
          post_id: string | null
          post_media: string[] | null
          symbol: string | null
          trades_count: number | null
          volume_24h: number | null
          volume_total: number | null
        }
        Relationships: []
      }
      trending_tokens: {
        Row: {
          created_at: string | null
          display_name: string | null
          holders_count: number | null
          id: string | null
          image_uri: string | null
          is_verified: boolean | null
          market_cap: number | null
          mint_address: string | null
          name: string | null
          pool_address: string | null
          recent_trades_count: number | null
          symbol: string | null
          trades_count: number | null
          volume_24h: number | null
        }
        Relationships: []
      }
    }
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Views<T extends keyof Database['public']['Views']> = Database['public']['Views'][T]['Row']
