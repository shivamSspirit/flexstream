import { Connection, PublicKey } from '@solana/web3.js';

/**
 * Meteora DBC Configuration
 * Supports both post-level and creator-level tokens with separate configs
 */

// Post-level tokens: Each post gets its own tradable token
export const POST_TOKEN_CONFIG = {
  PROGRAM_ID: new PublicKey('dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN'),
  CONFIG_KEY: new PublicKey(process.env.POST_POOL_CONFIG_KEY || 'GDo9K18dcHx34zefEoS7JkRPKgMQpEnS4ASDLBBbmcWF'),
  TYPE: 'post' as const,
  DEFAULT_INITIAL_SUPPLY: 1_000_000_000, // 1B tokens per post
  DEFAULT_FEE_BPS: 0,
} as const;

// Creator-level tokens: Each creator has their own profile token
export const CREATOR_TOKEN_CONFIG = {
  PROGRAM_ID: new PublicKey('dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN'),
  CONFIG_KEY: new PublicKey(process.env.CREATOR_POOL_CONFIG_KEY || '41MgtuAEUZ6wSmnheX5vkSPFjWVSfVcGebgSJjQwVXZp'),
  TYPE: 'creator' as const,
  DEFAULT_INITIAL_SUPPLY: 10_000_000_000, // 10B tokens per creator (higher supply)
  DEFAULT_FEE_BPS: 100, // 1% creator fee
} as const;

// Main DBC Configuration (shared settings)
export const DBC_CONFIG = {
  // Network Configuration
  RPC_URL: process.env.NEXT_PUBLIC_METEORA_RPC_URL || 'https://api.devnet.solana.com',
  NETWORK: process.env.NEXT_PUBLIC_METEORA_NETWORK || 'devnet',

  // Platform Keypair for Backend Token Creation
  // This keypair pays transaction fees and creates pools on behalf of users
  PLATFORM_KEYPAIR_SECRET: process.env.PLATFORM_KEYPAIR_SECRET,

  // Default Pool Settings
  DEFAULT_CURVE_TYPE: 'linear' as const,

  // Transaction Settings
  COMMITMENT: 'confirmed' as const,
  TIMEOUT: 30000,
  MAX_RETRIES: 3,

  // Token Configs
  POST: POST_TOKEN_CONFIG,
  CREATOR: CREATOR_TOKEN_CONFIG,
} as const;

// Initialize Solana connection
export const getConnection = () => new Connection(DBC_CONFIG.RPC_URL, DBC_CONFIG.COMMITMENT);

// Storage configuration
export const STORAGE_CONFIG = {
  BUCKET_NAME: 'post-media',
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
} as const;