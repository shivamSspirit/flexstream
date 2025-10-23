import { Connection, PublicKey } from '@solana/web3.js';

/**
 * Meteora DBC Configuration
 * Following the pattern from Meteora Fun Launch scaffold
 */
export const DBC_CONFIG = {
  // Core Program Configuration
  PROGRAM_ID: new PublicKey('dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN'),
  CONFIG_KEY: new PublicKey(process.env.POOL_CONFIG_KEY || 'GDo9K18dcHx34zefEoS7JkRPKgMQpEnS4ASDLBBbmcWF'),
  
  // Network Configuration
  RPC_URL: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  NETWORK: process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'mainnet-beta',
  
  // Pool Settings
  DEFAULT_INITIAL_SUPPLY: 1_000_000_000, // 1 billion tokens
  DEFAULT_CURVE_TYPE: 'linear' as const,
  DEFAULT_FEE_BPS: 0, // No creator fees
  
  // Transaction Settings
  COMMITMENT: 'confirmed' as const,
  TIMEOUT: 30000,
  MAX_RETRIES: 3
} as const;

// Initialize Solana connection
export const getConnection = () => new Connection(DBC_CONFIG.RPC_URL, DBC_CONFIG.COMMITMENT);

// Storage configuration
export const STORAGE_CONFIG = {
  BUCKET_NAME: 'post-media',
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
} as const;