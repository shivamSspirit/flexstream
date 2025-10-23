/**
 * This file centralizes all environment variable access.
 * Add validation to ensure required variables are present.
 */

// App Configuration
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'FlexStream';

// Solana Configuration
export const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
export const SOLANA_NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'mainnet-beta';

// Database Configuration
export const DATABASE_URL = process.env.DATABASE_URL || process.env.NEXT_DATABASE_URL || '';
export const SUPABASE_URL = process.env.SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// File Upload Configuration
export const UPLOADTHING_SECRET = process.env.UPLOADTHING_SECRET || '';
export const UPLOADTHING_APP_ID = process.env.UPLOADTHING_APP_ID || '';

// Pump.fun Configuration
export const PUMP_FUN_PROGRAM_ID = process.env.NEXT_PUBLIC_PUMP_FUN_PROGRAM_ID;
export const PUMP_FUN_API_BASE_URL = process.env.PUMP_FUN_API_BASE_URL || '';

// JWT Configuration
export const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

// Helius API Configuration
export const HELIUS_API_KEY = process.env.HELIUS_API_KEY || '';

// Privy Configuration
export const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
export const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET || '';
export const PRIVY_CLIENT_ID = process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID;

// Meteora DBC Configuration
export const POOL_CONFIG_KEY = process.env.POOL_CONFIG_KEY || 'GDo9K18dcHx34zefEoS7JkRPKgMQpEnS4ASDLBBbmcWF';
export const DBC_CREATOR_PRIVATE_KEY = process.env.DBC_CREATOR_PRIVATE_KEY || '';

// Helper function to ensure required environment variables are present
function ensureEnvVariable(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

// Helper function to get optional environment variables
function getOptionalEnvVariable(key: string, defaultValue: string = ''): string {
  return process.env[key] || defaultValue;
}