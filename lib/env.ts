/**
 * This file centralizes all environment variable access.
 * Add validation to ensure required variables are present.
 */

// App Configuration
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'FlexIt';

// Solana Configuration (Default/Fallback)
export const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
export const SOLANA_NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';

// Meteora DBC Configuration - DEVNET (Token Creation)
export const METEORA_RPC_URL = process.env.NEXT_PUBLIC_METEORA_RPC_URL || 'https://api.devnet.solana.com';
export const METEORA_NETWORK = process.env.NEXT_PUBLIC_METEORA_NETWORK || 'devnet';
export const METEORA_DBC_PROGRAM_ID = process.env.NEXT_PUBLIC_METEORA_DBC_PROGRAM_ID || 'dbcMHgYPYtvBWfnLmZWqYb9LoPBwsVMjdxCzCHbM1Dn';

// Jupiter Configuration - MAINNET (Swaps)
export const JUPITER_RPC_URL = process.env.NEXT_PUBLIC_JUPITER_RPC_URL || 'https://api.mainnet-beta.solana.com';
export const JUPITER_NETWORK = process.env.NEXT_PUBLIC_JUPITER_NETWORK || 'mainnet-beta';

// Database Configuration
export const DATABASE_URL = process.env.NEXT_PUBLIC_DATABASE_URL || '';
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';


// Helius API Configuration
export const HELIUS_API_KEY = process.env.HELIUS_API_KEY || '';

// Meteora DBC Pool Configuration
export const POST_POOL_CONFIG_KEY = process.env.POST_POOL_CONFIG_KEY || '';
export const CREATOR_POOL_CONFIG_KEY = process.env.CREATOR_POOL_CONFIG_KEY || '';

// Platform Configuration
export const PLATFORM_KEYPAIR_SECRET = process.env.PLATFORM_KEYPAIR_SECRET || '';