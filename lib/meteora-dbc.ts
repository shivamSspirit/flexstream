import { Connection, PublicKey, Transaction, Keypair, sendAndConfirmTransaction } from '@solana/web3.js';
import { DynamicBondingCurveClient } from '@meteora-ag/dynamic-bonding-curve-sdk';
import { DBC_CONFIG, POST_TOKEN_CONFIG, CREATOR_TOKEN_CONFIG } from '@/lib/dbc-config';
import bs58 from 'bs58';

export type TokenType = 'post' | 'creator';

export interface TokenLaunchParams {
  name: string;
  symbol: string;
  displayName?: string; // User-chosen display name (can be duplicate) - for anti-rug mechanism
  description: string;
  imageUri: string;
  creator?: PublicKey; // Optional - platform creates on behalf of user
  initialSupply?: number;
  tokenType?: TokenType; // Specify if this is a post or creator token
}

export interface TokenLaunchResult {
  mint: PublicKey;
  pool: PublicKey;
  signature: string; // Confirmed transaction signature
  transaction?: Transaction; // Optional for legacy support
  baseMintKeypair?: Keypair; // Optional for legacy support
}

/**
 * Load platform keypair from environment variable
 * This keypair is used to pay transaction fees and create pools on behalf of users
 */
export function getPlatformKeypair(): Keypair {
  const secretKey = DBC_CONFIG.PLATFORM_KEYPAIR_SECRET;

  if (!secretKey) {
    throw new Error(
      'PLATFORM_KEYPAIR_SECRET not configured. Please set this environment variable with your platform wallet secret key (base58 or JSON array format).'
    );
  }

  try {
    // Support both base58 and JSON array formats
    let secretArray: number[];

    if (secretKey.startsWith('[')) {
      // JSON array format: [1,2,3,...]
      secretArray = JSON.parse(secretKey);
    } else {
      // Base58 format (from Phantom, Solflare, etc.)
      secretArray = Array.from(bs58.decode(secretKey));
    }

    return Keypair.fromSecretKey(new Uint8Array(secretArray));
  } catch (error) {
    throw new Error(`Failed to parse PLATFORM_KEYPAIR_SECRET: ${error instanceof Error ? error.message : 'Invalid format'}`);
  }
}

export interface PoolInfo {
  mint: PublicKey;
  pool: PublicKey;
  virtualBaseReserves: number;
  virtualQuoteReserves: number;
  marketCap: number;
  buyPrice: number;
  sellPrice: number;
  liquidity: number;
}

/**
 * Meteora DBC Client for token launches
 * Following the official Meteora DBC SDK documentation
 */
export class MeteoraDBCClient {
  private connection: Connection;
  private dbcClient: DynamicBondingCurveClient;

  constructor(connection: Connection) {
    this.connection = connection;
    this.dbcClient = new DynamicBondingCurveClient(connection, 'confirmed');
  }

  /**
   * Create a new token with DBC pool initialization
   * Backend-only: Signs and submits transaction using platform keypair
   * No user signature required!
   */
  async createToken(params: TokenLaunchParams): Promise<TokenLaunchResult> {
    try {
      const {
        name,
        symbol,
        description,
        imageUri,
        tokenType = 'post', // Default to post token
      } = params;

      // Select appropriate config based on token type
      const tokenConfig = tokenType === 'creator' ? CREATOR_TOKEN_CONFIG : POST_TOKEN_CONFIG;
      const initialSupply = params.initialSupply || tokenConfig.DEFAULT_INITIAL_SUPPLY;

      console.log(`[DBC] Creating ${tokenType.toUpperCase()} token (backend-only):`, name);

      // Validate inputs
      if (!name || !symbol) {
        throw new Error('Missing required parameters: name, symbol');
      }

      // Validate connection
      if (!this.connection) {
        throw new Error('Solana connection not initialized');
      }

      // Check if DBC client is available
      if (!this.dbcClient) {
        throw new Error('DBC client not initialized');
      }

      // Load platform keypair (pays fees and creates pool)
      const platformKeypair = getPlatformKeypair();
      console.log('[DBC] Using platform wallet:', platformKeypair.publicKey.toBase58());

      // Generate a new keypair for the base mint (token)
      const baseMint = Keypair.generate();
      console.log('[DBC] Generated base mint:', baseMint.publicKey.toBase58());

      console.log('[DBC] Creating token with params:', {
        type: tokenType,
        name,
        symbol,
        platformWallet: platformKeypair.publicKey.toBase58(),
        initialSupply,
        configKey: tokenConfig.CONFIG_KEY.toBase58(),
        feeBps: tokenConfig.DEFAULT_FEE_BPS
      });

      // Create token and pool using official Meteora DBC SDK
      // Platform wallet acts as both payer and poolCreator
      const createPoolParams = {
        baseMint: baseMint.publicKey,
        config: tokenConfig.CONFIG_KEY,
        name: name,
        symbol: symbol.toUpperCase(),
        uri: imageUri,
        payer: platformKeypair.publicKey,        // Platform pays fees
        poolCreator: platformKeypair.publicKey,  // Platform creates pool
      };

      console.log('[DBC] Calling SDK createPool...');

      // Call the official SDK method
      const transaction = await this.dbcClient.pool.createPool(createPoolParams);

      console.log('[DBC] Pool creation transaction prepared');

      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash('confirmed');

      console.log('[DBC] Got recent blockhash:', blockhash.substring(0, 20) + '...');

      // Set transaction parameters
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      transaction.feePayer = platformKeypair.publicKey;

      // Sign transaction with BOTH required keypairs
      // 1. baseMint keypair (new token being created)
      // 2. platform keypair (payer + poolCreator)
      console.log('[DBC] Signing transaction with platform and baseMint keypairs...');
      transaction.sign(platformKeypair, baseMint);

      console.log('[DBC] Transaction signed successfully');

      // Submit transaction to Solana
      console.log('[DBC] Submitting transaction to Solana...');
      const signature = await this.connection.sendRawTransaction(
        transaction.serialize(),
        {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
        }
      );

      console.log('[DBC] Transaction submitted:', signature);

      // Wait for confirmation
      console.log('[DBC] Waiting for confirmation...');
      const confirmation = await this.connection.confirmTransaction(
        {
          signature,
          blockhash,
          lastValidBlockHeight,
        },
        'confirmed'
      );

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      console.log('[DBC] Transaction confirmed!');

      // Derive the pool address (this is deterministic based on config and base mint)
      const [poolAddress] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('pool'),
          tokenConfig.CONFIG_KEY.toBuffer(),
          baseMint.publicKey.toBuffer(),
        ],
        tokenConfig.PROGRAM_ID
      );

      console.log(`[DBC] ${tokenType.toUpperCase()} token and pool created successfully:`, {
        type: tokenType,
        mint: baseMint.publicKey.toBase58(),
        pool: poolAddress.toBase58(),
        signature,
        name,
        symbol,
        supply: initialSupply,
        config: tokenConfig.CONFIG_KEY.toBase58()
      });

      return {
        mint: baseMint.publicKey,
        pool: poolAddress,
        signature: signature,
        // Legacy support (not needed for backend-only flow)
        transaction: transaction,
        baseMintKeypair: baseMint
      };

    } catch (error) {
      console.error('[DBC] Error creating token:', error);
      throw new Error(`Failed to create token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get pool information and market data
   */
  async getPoolInfo(poolAddress: PublicKey): Promise<PoolInfo> {
    // TODO: Implement proper pool info fetching from Meteora SDK
    throw new Error('getPoolInfo not yet implemented - Meteora SDK integration needed');
  }

  /**
   * Create a buy transaction for a token
   */
  async createBuyTransaction(
    poolAddress: PublicKey,
    buyer: PublicKey,
    solAmount: number
  ): Promise<Transaction> {
    // TODO: Implement buy transaction with Meteora SDK
    throw new Error('createBuyTransaction not yet implemented - Meteora SDK integration needed');
  }

  /**
   * Create a sell transaction for a token
   */
  async createSellTransaction(
    poolAddress: PublicKey,
    seller: PublicKey,
    tokenAmount: number
  ): Promise<Transaction> {
    // TODO: Implement sell transaction with Meteora SDK
    throw new Error('createSellTransaction not yet implemented - Meteora SDK integration needed');
  }

  /**
   * Upload token metadata to storage
   * Uses Supabase storage for now - can be upgraded to IPFS/Arweave later
   */
  async uploadMetadata(
    metadata: {
      name: string;
      symbol: string;
      description: string;
      image: string;
      external_url?: string;
    },
    supabaseClient: any
  ): Promise<string> {
    try {
      // Create metadata JSON
      const metadataJson = {
        name: metadata.name,
        symbol: metadata.symbol,
        description: metadata.description,
        image: metadata.image,
        external_url: metadata.external_url,
        attributes: [],
        properties: {
          files: [
            {
              uri: metadata.image,
              type: metadata.image.includes('.mp4') ? 'video/mp4' : 'image/png'
            }
          ],
          category: 'image',
        }
      };

      // Upload to Supabase storage
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.json`;

      // Convert JSON to Blob to ensure proper upload
      const jsonBlob = new Blob([JSON.stringify(metadataJson, null, 2)], {
        type: 'text/plain'
      });

      const { error } = await supabaseClient.storage
        .from('flexstream')
        .upload(`token-metadata/${fileName}`, jsonBlob, {
          contentType: 'text/plain',
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Metadata upload error details:', error);
        throw new Error(`Failed to upload metadata: ${error.message}`);
      }

      const { data: { publicUrl } } = supabaseClient.storage
        .from('flexstream')
        .getPublicUrl(`token-metadata/${fileName}`);

      console.log('Metadata uploaded:', publicUrl);
      return publicUrl;

    } catch (error) {
      console.error('Error uploading metadata:', error);
      const err = error as Error;
      throw new Error(`Failed to upload metadata: ${err.message}`);
    }
  }

  /**
   * Generate a unique token symbol from post content
   * Format: POST_{RANDOM}_{SEQUENCE}
   * Example: POST_A7X9K_1, POST_B3M2P_1
   */
  generateTokenSymbol(_content: string, _username: string): string {
    // Generate a unique random identifier
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();

    // Combine to create unique symbol (max 10 chars for readability)
    return `${timestamp.slice(-5)}${random}`.substring(0, 10);
  }

  /**
   * Generate a truly unique token symbol for anti-rug mechanism
   * Format: Timestamp-based + Random (max 10 chars for Solana)
   * This ensures no collisions even with high volume
   */
  generateUniqueSymbol(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();

    // Create a unique 9-character symbol (safe for Solana's 10 char limit)
    // Example: T5K9PA7M3 or similar
    return `${timestamp.slice(-5)}${random}`.substring(0, 9);
  }

  /**
   * Generate token name from content
   */
  generateTokenName(postContent: string, username: string): string {
    // Handle undefined or empty content
    if (!postContent || typeof postContent !== 'string') {
      return `${username}'s Token`;
    }

    // Take first 3 words of content or username's token
    const words = postContent.split(' ').filter(w => w.length > 0);
    const firstWords = words.slice(0, 3).join(' ');

    if (firstWords.length > 5) {
      return firstWords.substring(0, 30);
    }

    return `${username}'s Token`;
  }

  /**
   * Format market cap for display
   */
  formatMarketCap(value: number): string {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`;
    }
    return `$${value.toFixed(2)}`;
  }

  /**
   * Get Jupiter trade URL for a token
   */
  getJupiterTradeUrl(mintAddress: string, network: 'devnet' | 'mainnet' = 'devnet'): string {
    if (network === 'devnet') {
      return `https://app.jup.ag/swap/SOL-${mintAddress}`;
    }
    return `https://jup.ag/swap/SOL-${mintAddress}`;
  }

  /**
   * Get Meteora trade URL for a pool
   */
  getMeteoraTradeUrl(poolAddress: string, network: 'devnet' | 'mainnet' = 'devnet'): string {
    if (network === 'devnet') {
      return `https://app.meteora.ag/pools/${poolAddress}?network=devnet`;
    }
    return `https://app.meteora.ag/pools/${poolAddress}`;
  }
}

/**
 * Factory function to create a DBC client instance
 */
export function createDBCClient(connection: Connection): MeteoraDBCClient {
  return new MeteoraDBCClient(connection);
}

/**
 * Helper function to create token
 * Backend-only: Creates and submits token without user signature
 * Supports both post-level and creator-level tokens
 */
export async function createTokenForPost(params: {
  name: string;
  symbol: string;
  description: string;
  imageUrl?: string;
  initialSupply?: number;
  tokenType?: TokenType; // 'post' or 'creator'
}): Promise<{
  signature: string;
  mint: string;
  name: string;
  symbol: string;
  description: string;
  imageUri: string;
  poolAddress: string;
  bondingCurveAddress: string;
  createdAt: number;
  tokenType: TokenType;
}> {
  const connection = new Connection(DBC_CONFIG.RPC_URL, 'confirmed');
  const dbcClient = createDBCClient(connection);

  const result = await dbcClient.createToken({
    name: params.name,
    symbol: params.symbol,
    description: params.description,
    imageUri: params.imageUrl || '',
    initialSupply: params.initialSupply,
    tokenType: params.tokenType || 'post', // Default to post token
  });

  return {
    signature: result.signature,
    mint: result.mint.toBase58(),
    name: params.name,
    symbol: params.symbol,
    description: params.description,
    imageUri: params.imageUrl || '',
    poolAddress: result.pool.toBase58(),
    bondingCurveAddress: result.pool.toBase58(),
    createdAt: Date.now(),
    tokenType: params.tokenType || 'post',
  };
}
