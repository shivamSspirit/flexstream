import { Connection, PublicKey, Transaction, Keypair } from '@solana/web3.js';
import { DynamicBondingCurveClient } from '@meteora-ag/dynamic-bonding-curve-sdk';
import { DBC_CONFIG } from '@/lib/dbc-config';

export interface TokenLaunchParams {
  name: string;
  symbol: string;
  description: string;
  imageUri: string;
  creator: PublicKey;
  initialSupply?: number;
}

export interface TokenLaunchResult {
  mint: PublicKey;
  pool: PublicKey;
  transaction: Transaction;
  baseMintKeypair: Keypair;  // Needed to sign after user signs
  signature?: string;
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
   * Uses the official Meteora DBC SDK method: pool.createPool
   */
  async createToken(params: TokenLaunchParams): Promise<TokenLaunchResult> {
    try {
      console.log('🚀 Creating token with Meteora DBC:', params.name);

      const {
        name,
        symbol,
        description,
        imageUri,
        creator,
        initialSupply = 1_000_000_000 // 1 billion tokens default
      } = params;

      // Validate inputs
      if (!name || !symbol || !creator) {
        throw new Error('Missing required parameters: name, symbol, creator');
      }

      // Validate connection
      if (!this.connection) {
        throw new Error('Solana connection not initialized');
      }

      // Check if DBC client is available
      if (!this.dbcClient) {
        throw new Error('DBC client not initialized');
      }

      console.log('📊 Creating token with params:', {
        name,
        symbol,
        creator: creator.toBase58(),
        initialSupply,
        configKey: DBC_CONFIG.CONFIG_KEY.toBase58()
      });

      // Generate a new keypair for the base mint (token)
      const baseMint = Keypair.generate();
      console.log('🪙 Generated base mint:', baseMint.publicKey.toBase58());

      // Create token and pool using official Meteora DBC SDK
      // Based on the example from the docs
      const createPoolParams = {
        baseMint: baseMint.publicKey,
        config: DBC_CONFIG.CONFIG_KEY,
        name: name,
        symbol: symbol.toUpperCase(),
        uri: imageUri,
        payer: creator,
        poolCreator: creator,
      };

      console.log('🏊 Creating pool with params:', createPoolParams);

      // Call the official SDK method
      const transaction = await this.dbcClient.pool.createPool(createPoolParams);

      console.log('✅ Pool creation transaction prepared');

      // Get recent blockhash BEFORE signing
      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash('confirmed');

      console.log('🔗 Got recent blockhash:', blockhash.substring(0, 20) + '...');

      // Set transaction parameters required for signing
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      transaction.feePayer = creator;

      // IMPORTANT: Do NOT sign here - we'll sign on the backend AFTER the user signs
      // This avoids wallet adapter issues with partially-signed transactions
      // We need to return the baseMint keypair secret so the backend can sign after user
      console.log('✅ Transaction prepared (unsigned) - baseMint will sign on backend after user');

      // Derive the pool address (this is deterministic based on config and base mint)
      const [poolAddress] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('pool'),
          DBC_CONFIG.CONFIG_KEY.toBuffer(),
          baseMint.publicKey.toBuffer(),
        ],
        DBC_CONFIG.PROGRAM_ID
      );

      console.log('✅ Token and pool created:', {
        mint: baseMint.publicKey.toBase58(),
        pool: poolAddress.toBase58(),
        name,
        symbol
      });

      return {
        mint: baseMint.publicKey,
        pool: poolAddress,
        transaction: transaction,
        baseMintKeypair: baseMint  // Return keypair to sign on backend after user
      };

    } catch (error) {
      console.error('❌ Error creating token:', error);
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
        console.error('❌ Metadata upload error details:', error);
        throw new Error(`Failed to upload metadata: ${error.message}`);
      }

      const { data: { publicUrl } } = supabaseClient.storage
        .from('flexstream')
        .getPublicUrl(`token-metadata/${fileName}`);

      console.log('📤 Metadata uploaded:', publicUrl);
      return publicUrl;

    } catch (error) {
      console.error('❌ Error uploading metadata:', error);
      const err = error as Error;
      throw new Error(`Failed to upload metadata: ${err.message}`);
    }
  }

  /**
   * Generate a unique token symbol from post content
   */
  generateTokenSymbol(_content: string, username: string): string {
    // Take first 3 letters of username and add random suffix
    const userPrefix = username.substring(0, 3).toUpperCase();
    const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();

    return `${userPrefix}${randomSuffix}`;
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
 * Helper function to create token for post (backward compatibility)
 */
export async function createTokenForPost(params: {
  name: string;
  symbol: string;
  description: string;
  imageUrl?: string;
  creatorWallet: PublicKey;
  initialSupply?: number;
}): Promise<{
  transaction: string;
  mint: string;
  name: string;
  symbol: string;
  description: string;
  imageUri: string;
  creator: string;
  poolAddress: string;
  bondingCurveAddress: string;
  createdAt: number;
}> {
  const connection = new Connection(DBC_CONFIG.RPC_URL, 'confirmed');
  const dbcClient = createDBCClient(connection);

  const result = await dbcClient.createToken({
    name: params.name,
    symbol: params.symbol,
    description: params.description,
    imageUri: params.imageUrl || '',
    creator: params.creatorWallet,
    initialSupply: params.initialSupply
  });

  // Serialize transaction for frontend
  const serializedTx = result.transaction.serialize();
  
  return {
    transaction: Buffer.from(serializedTx).toString('base64'),
    mint: result.mint.toBase58(),
    name: params.name,
    symbol: params.symbol,
    description: params.description,
    imageUri: params.imageUrl || '',
    creator: params.creatorWallet.toBase58(),
    poolAddress: result.pool.toBase58(),
    bondingCurveAddress: result.pool.toBase58(),
    createdAt: Date.now()
  };
}
