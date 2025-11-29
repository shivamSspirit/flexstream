import { Connection, PublicKey, Keypair, Transaction } from '@solana/web3.js';
import { DynamicBondingCurveClient } from '@meteora-ag/dynamic-bonding-curve-sdk';
import bs58 from 'bs58';

// Meteora DBC Configuration
const DBC_CONFIG_KEY = new PublicKey('GDo9K18dcHx34zefEoS7JkRPKgMQpEnS4ASDLBBbmcWF');
const DBC_PROGRAM_ID = new PublicKey('dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN');
const HELIUS_RPC = process.env.NEXT_PUBLIC_HELIUS_RPC_URL || 'https://api.devnet.solana.com';

export interface CreateTokenParams {
  name: string;
  symbol: string;
  description: string;
  imageUrl?: string;
  creatorWallet: PublicKey;
  initialSupply?: number;
  metadataUri?: string;
}

export interface TokenMetadata {
  mint: string;
  name: string;
  symbol: string;
  description: string;
  imageUri: string;
  creator: string;
  poolAddress: string;
  bondingCurveAddress: string;
  createdAt: number;
  signature?: string;
}

/**
 * Initialize DBC Client
 */
export function initDBCClient(connection: Connection): DynamicBondingCurveClient {
  return new DynamicBondingCurveClient(connection, 'confirmed');
}

/**
 * Create a new token via Meteora DBC when a post is created
 * This will call the backend API to handle the transaction
 */
export async function createTokenForPost(
  params: CreateTokenParams
): Promise<TokenMetadata> {
  try {
    console.log('Creating Meteora DBC token for post:', params.name);

    const response = await fetch('/api/dbc/create-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: params.name,
        symbol: params.symbol,
        description: params.description,
        imageUri: params.imageUrl,
        metadataUri: params.metadataUri,
        creator: params.creatorWallet.toBase58(),
        initialSupply: params.initialSupply || 1000000000, // 1 billion tokens
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create DBC token');
    }

    const data = await response.json();
    
    return {
      mint: data.data.mint,
      name: params.name,
      symbol: params.symbol,
      description: params.description,
      imageUri: params.imageUrl || '',
      creator: params.creatorWallet.toBase58(),
      poolAddress: data.data.poolAddress,
      bondingCurveAddress: data.data.bondingCurveAddress || data.data.poolAddress,
      createdAt: Date.now(),
      signature: data.data.signature,
    };
  } catch (error) {
    console.error('Error creating DBC token:', error);
    throw error;
  }
}

/**
 * Get pool info from Meteora DBC
 */
export async function getPoolInfo(poolAddress: string): Promise<any> {
  try {
    const response = await fetch(`/api/dbc/pool-info?pool=${poolAddress}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch pool info');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching pool info:', error);
    throw error;
  }
}

/**
 * Get bonding curve price and market info
 */
export async function getBondingCurvePrice(
  poolAddress: string
): Promise<{
  buyPrice: number;
  sellPrice: number;
  marketCap: number;
  liquidity: number;
  virtualBaseReserves: number;
  virtualQuoteReserves: number;
}> {
  try {
    const response = await fetch(`/api/dbc/pool-info?pool=${poolAddress}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch bonding curve info');
    }

    const data = await response.json();
    const poolInfo = data.data;
    
    return {
      buyPrice: poolInfo.buyPrice || 0,
      sellPrice: poolInfo.sellPrice || 0,
      marketCap: poolInfo.marketCap || 0,
      liquidity: poolInfo.liquidity || 0,
      virtualBaseReserves: poolInfo.virtualBaseReserves || 0,
      virtualQuoteReserves: poolInfo.virtualQuoteReserves || 0,
    };
  } catch (error) {
    console.error('Error fetching bonding curve:', error);
    return {
      buyPrice: 0,
      sellPrice: 0,
      marketCap: 0,
      liquidity: 0,
      virtualBaseReserves: 0,
      virtualQuoteReserves: 0,
    };
  }
}

/**
 * Get Jupiter trade URL for a token
 */
export function getJupiterTradeUrl(
  mintAddress: string,
  network: 'devnet' | 'mainnet' = 'devnet'
): string {
  if (network === 'devnet') {
    return `https://app.jup.ag/swap/SOL-${mintAddress}`;
  }
  return `https://jup.ag/swap/SOL-${mintAddress}`;
}

/**
 * Get Meteora trade URL for a pool
 */
export function getMeteoraTradeUrl(
  poolAddress: string,
  network: 'devnet' | 'mainnet' = 'devnet'
): string {
  if (network === 'devnet') {
    return `https://app.meteora.ag/pools/${poolAddress}?network=devnet`;
  }
  return `https://app.meteora.ag/pools/${poolAddress}`;
}

/**
 * Generate a unique token symbol from post content
 */
export function generateTokenSymbol(content: string, username: string): string {
  // Take first 3 letters of username and add random suffix
  const userPrefix = username.substring(0, 3).toUpperCase();
  const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
  
  return `${userPrefix}${randomSuffix}`;
}

/**
 * Generate token name from content
 */
export function generateTokenName(content: string, username: string): string {
  // Take first 3 words of content or username's token
  const words = content.split(' ').filter(w => w.length > 0);
  const firstWords = words.slice(0, 3).join(' ');
  
  if (firstWords.length > 5) {
    return firstWords.substring(0, 30);
  }
  
  return `${username}'s Token`;
}

/**
 * Upload token metadata to Irys/Arweave
 */
export async function uploadTokenMetadata(metadata: {
  name: string;
  symbol: string;
  description: string;
  image: string;
}): Promise<string> {
  try {
    const response = await fetch('/api/upload-metadata', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    });

    if (!response.ok) {
      throw new Error('Failed to upload metadata');
    }

    const data = await response.json();
    return data.uri;
  } catch (error) {
    console.error('Error uploading metadata:', error);
    throw error;
  }
}

/**
 * Format market cap for display
 */
export function formatMarketCap(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(2)}K`;
  }
  return `$${value.toFixed(2)}`;
}

