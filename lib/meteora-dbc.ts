import { Connection, PublicKey, Transaction, Keypair, sendAndConfirmTransaction } from '@solana/web3.js';
import { DynamicBondingCurveClient, swapQuote, getCurrentPoint, ActivationType } from '@meteora-ag/dynamic-bonding-curve-sdk';
import { DBC_CONFIG, POST_TOKEN_CONFIG, CREATOR_TOKEN_CONFIG } from '@/lib/dbc-config';
import bs58 from 'bs58';
import BN from 'bn.js';

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

export interface UnsignedTokenTransaction {
  transaction: string; // Base64 encoded serialized transaction
  baseMintPublicKey: string; // The mint address that will be created
  blockhash: string;
  lastValidBlockHeight: number;
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
      console.log('[DBC] Loading platform keypair from env...');
      console.log('[DBC] PLATFORM_KEYPAIR_SECRET exists:', !!DBC_CONFIG.PLATFORM_KEYPAIR_SECRET);
      console.log('[DBC] PLATFORM_KEYPAIR_SECRET length:', DBC_CONFIG.PLATFORM_KEYPAIR_SECRET?.length);

      const platformKeypair = getPlatformKeypair();
      console.log('[DBC] Platform keypair loaded successfully!');
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

      console.log('[DBC] Confirmation result:', JSON.stringify(confirmation, null, 2));

      if (confirmation.value.err) {
        console.error('[DBC] Transaction FAILED with error:', JSON.stringify(confirmation.value.err, null, 2));
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      console.log('[DBC] Transaction confirmed successfully!');

      // Extract the actual pool address from the transaction
      // The pool is the account owned by the Meteora DBC program
      console.log('[DBC] Fetching transaction to extract pool address...');
      const confirmedTx = await this.connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 0,
        commitment: 'confirmed'
      });

      if (!confirmedTx) {
        throw new Error('Failed to fetch confirmed transaction');
      }

      // Find the pool account (owned by Meteora DBC program, created during transaction)
      const message = confirmedTx.transaction.message;
      const accountKeys = message.staticAccountKeys || [];

      let poolAddress: PublicKey | null = null;

      // Check each account to find the one owned by Meteora DBC program
      for (const accountKey of accountKeys) {
        const accountInfo = await this.connection.getAccountInfo(accountKey);
        if (accountInfo && accountInfo.owner.equals(tokenConfig.PROGRAM_ID)) {
          // Found an account owned by Meteora DBC - check if it's the pool (has data)
          if (accountInfo.data.length > 0 && accountInfo.data.length < 1000) {
            poolAddress = accountKey;
            console.log('[DBC] Found pool account:', accountKey.toBase58());
            break;
          }
        }
      }

      if (!poolAddress) {
        throw new Error('Failed to find pool address in transaction');
      }

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
   * Create an unsigned token transaction for user to sign
   * Used for:
   * 1. Creator-level coins (always requires creator signature)
   * 2. Post-level tokens after 10 free launches
   *
   * Returns a partially-signed transaction (signed by baseMint keypair)
   * that the user must sign with their wallet before submitting
   */
  async createTokenTransactionForSigning(params: TokenLaunchParams & { creatorWallet: PublicKey }): Promise<{
    unsignedTransaction: UnsignedTokenTransaction;
    baseMintSecretKey: string; // Base58 encoded for storage/transmission
  }> {
    try {
      const {
        name,
        symbol,
        imageUri,
        creatorWallet,
        tokenType = 'creator',
      } = params;

      const tokenConfig = tokenType === 'creator' ? CREATOR_TOKEN_CONFIG : POST_TOKEN_CONFIG;

      console.log(`[DBC] Creating ${tokenType.toUpperCase()} token transaction for signing:`, name);

      if (!name || !symbol) {
        throw new Error('Missing required parameters: name, symbol');
      }

      // Generate a new keypair for the base mint (token)
      const baseMint = Keypair.generate();
      console.log('[DBC] Generated base mint:', baseMint.publicKey.toBase58());

      console.log('[DBC] Creating token transaction with params:', {
        type: tokenType,
        name,
        symbol,
        creatorWallet: creatorWallet.toBase58(),
        configKey: tokenConfig.CONFIG_KEY.toBase58(),
      });

      // Create token and pool using official Meteora DBC SDK
      // Creator's wallet is both payer and poolCreator
      const createPoolParams = {
        baseMint: baseMint.publicKey,
        config: tokenConfig.CONFIG_KEY,
        name: name,
        symbol: symbol.toUpperCase(),
        uri: imageUri,
        payer: creatorWallet,        // Creator pays fees
        poolCreator: creatorWallet,  // Creator is the pool creator
      };

      console.log('[DBC] Calling SDK createPool for user-signed flow...');

      const transaction = await this.dbcClient.pool.createPool(createPoolParams);

      console.log('[DBC] Pool creation transaction prepared');

      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash('confirmed');

      console.log('[DBC] Got recent blockhash:', blockhash.substring(0, 20) + '...');

      // Set transaction parameters
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      transaction.feePayer = creatorWallet;

      // Partially sign with baseMint keypair ONLY
      // The user will sign with their wallet on the frontend
      console.log('[DBC] Partially signing transaction with baseMint keypair...');
      transaction.partialSign(baseMint);

      console.log('[DBC] Transaction partially signed, ready for user signature');

      // Serialize the transaction
      const serializedTransaction = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });

      return {
        unsignedTransaction: {
          transaction: Buffer.from(serializedTransaction).toString('base64'),
          baseMintPublicKey: baseMint.publicKey.toBase58(),
          blockhash,
          lastValidBlockHeight,
        },
        baseMintSecretKey: bs58.encode(baseMint.secretKey),
      };

    } catch (error) {
      console.error('[DBC] Error creating token transaction for signing:', error);
      throw new Error(`Failed to create token transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify a token creation transaction and extract pool address
   * Used after user signs and submits the transaction
   */
  async verifyTokenCreation(signature: string, expectedMint: string, tokenType: TokenType = 'creator'): Promise<{
    mint: string;
    pool: string;
    verified: boolean;
  }> {
    try {
      console.log('[DBC] Verifying token creation transaction:', signature);

      const tokenConfig = tokenType === 'creator' ? CREATOR_TOKEN_CONFIG : POST_TOKEN_CONFIG;

      // Wait for confirmation
      const confirmation = await this.connection.confirmTransaction(signature, 'confirmed');

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      // Fetch transaction to extract pool address
      const confirmedTx = await this.connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 0,
        commitment: 'confirmed'
      });

      if (!confirmedTx) {
        throw new Error('Failed to fetch confirmed transaction');
      }

      // Find the pool account
      const message = confirmedTx.transaction.message;
      const accountKeys = message.staticAccountKeys || [];

      let poolAddress: string | null = null;

      for (const accountKey of accountKeys) {
        const accountInfo = await this.connection.getAccountInfo(accountKey);
        if (accountInfo && accountInfo.owner.equals(tokenConfig.PROGRAM_ID)) {
          if (accountInfo.data.length > 0 && accountInfo.data.length < 1000) {
            poolAddress = accountKey.toBase58();
            console.log('[DBC] Found pool account:', poolAddress);
            break;
          }
        }
      }

      if (!poolAddress) {
        throw new Error('Failed to find pool address in transaction');
      }

      console.log('[DBC] Token creation verified:', {
        mint: expectedMint,
        pool: poolAddress,
        signature,
      });

      return {
        mint: expectedMint,
        pool: poolAddress,
        verified: true,
      };

    } catch (error) {
      console.error('[DBC] Error verifying token creation:', error);
      throw new Error(`Failed to verify token creation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get pool information and market data
   * Uses sqrtPrice from pool state for accurate bonding curve pricing
   */
  async getPoolInfo(poolAddress: PublicKey): Promise<PoolInfo> {
    try {
      console.log('[DBC] Fetching pool info for:', poolAddress.toBase58());

      // Fetch pool state from Meteora SDK
      const poolState = await this.dbcClient.state.getPool(poolAddress);

      if (!poolState) {
        throw new Error('Pool not found');
      }

      // Get reserves from pool state
      const baseReserveRaw = (poolState as any).baseReserve;
      const quoteReserveRaw = (poolState as any).quoteReserve;
      const sqrtPriceRaw = (poolState as any).sqrtPrice;

      // Convert reserves - tokens have 6 decimals, SOL has 9
      const baseReserveAmount = baseReserveRaw ?
        (typeof baseReserveRaw === 'bigint' ? Number(baseReserveRaw) : baseReserveRaw.toNumber?.() || Number(baseReserveRaw)) : 0;
      const quoteReserveAmount = quoteReserveRaw ?
        (typeof quoteReserveRaw === 'bigint' ? Number(quoteReserveRaw) : quoteReserveRaw.toNumber?.() || Number(quoteReserveRaw)) : 0;

      const virtualBaseReserves = baseReserveAmount / 1e6; // Token decimals (6)
      const virtualQuoteReserves = quoteReserveAmount / 1e9; // SOL decimals (9)

      // Calculate price from sqrtPrice (Q64.64 fixed-point format)
      // Price = (sqrtPrice / 2^64)²
      // Note: sqrtPrice already accounts for token decimals
      let buyPrice = 0;
      if (sqrtPriceRaw) {
        const sqrtPriceBigInt = typeof sqrtPriceRaw === 'bigint' ? sqrtPriceRaw : BigInt(sqrtPriceRaw.toString());
        // Q64 = 2^64 = 18446744073709551616
        const Q64 = BigInt('18446744073709551616');
        const sqrtPriceFloat = Number(sqrtPriceBigInt) / Number(Q64);
        buyPrice = sqrtPriceFloat * sqrtPriceFloat;
      }

      // Fallback to reserve ratio if sqrtPrice not available
      if (buyPrice === 0 && virtualBaseReserves > 0 && virtualQuoteReserves > 0) {
        buyPrice = virtualQuoteReserves / virtualBaseReserves;
      }

      const sellPrice = buyPrice * 0.99; // Approximate sell price (accounting for fees)

      // Calculate market cap: total supply * current price
      const totalSupply = POST_TOKEN_CONFIG.DEFAULT_INITIAL_SUPPLY; // 1B tokens
      const marketCap = totalSupply * buyPrice;

      // Liquidity is the quote reserves (SOL in pool)
      const liquidity = virtualQuoteReserves;

      console.log('[DBC] Pool info retrieved:', {
        pool: poolAddress.toBase58(),
        sqrtPrice: sqrtPriceRaw?.toString(),
        buyPrice,
        sellPrice,
        marketCap,
        liquidity,
        virtualBaseReserves,
        virtualQuoteReserves
      });

      return {
        mint: poolState.baseMint,
        pool: poolAddress,
        virtualBaseReserves,
        virtualQuoteReserves,
        marketCap,
        buyPrice,
        sellPrice,
        liquidity
      };
    } catch (error) {
      console.error('[DBC] Error fetching pool info:', error);
      throw new Error(`Failed to fetch pool info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a buy transaction for a token
   * @param poolAddress - The DBC pool address
   * @param buyer - The wallet address buying tokens
   * @param solAmount - Amount of SOL to spend (in SOL, not lamports)
   * @param slippageBps - Slippage tolerance in basis points (default: 500 = 5%)
   * @returns Transaction ready to be signed and sent
   */
  async createBuyTransaction(
    poolAddress: PublicKey,
    buyer: PublicKey,
    solAmount: number,
    slippageBps: number = 500
  ): Promise<Transaction> {
    try {
      console.log('[DBC] Creating buy transaction:', {
        pool: poolAddress.toBase58(),
        buyer: buyer.toBase58(),
        solAmount,
        slippageBps
      });

      // Convert SOL to lamports
      const amountInLamports = new BN(solAmount * 1e9);

      // Get pool state
      const poolState = await this.dbcClient.state.getPool(poolAddress);
      if (!poolState) {
        throw new Error('Pool not found');
      }

      // Get config state using the pool's config address
      const configState = await this.dbcClient.state.getPoolConfig(poolState.config);
      if (!configState) {
        throw new Error('Config not found');
      }

      // Get current point (slot or timestamp based on activation type)
      const currentPoint = await getCurrentPoint(this.connection, ActivationType.Slot);

      // Get accurate swap quote using the standalone function
      const quote = swapQuote(
        poolState,
        configState,
        false, // false = BUY tokens with SOL (swap quote for base)
        amountInLamports,
        slippageBps,
        false, // hasReferral
        currentPoint
      );

      console.log('[DBC] Swap quote:', {
        solIn: solAmount,
        minimumTokensOut: quote.minimumAmountOut.toNumber() / 1e9,
        slippageBps
      });

      // Create swap transaction using Meteora SDK
      const transaction = await this.dbcClient.pool.swap({
        owner: buyer,
        pool: poolAddress,
        amountIn: amountInLamports,
        minimumAmountOut: quote.minimumAmountOut, // Use SDK-calculated minimum
        swapBaseForQuote: false, // false = BUY tokens with SOL
        referralTokenAccount: null, // No referral
        payer: buyer
      });

      console.log('[DBC] Buy transaction created successfully');

      return transaction;
    } catch (error) {
      console.error('[DBC] Error creating buy transaction:', error);
      throw new Error(`Failed to create buy transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a sell transaction for a token
   * @param poolAddress - The DBC pool address
   * @param seller - The wallet address selling tokens
   * @param tokenAmount - Amount of tokens to sell (in tokens, not smallest unit)
   * @param slippageBps - Slippage tolerance in basis points (default: 500 = 5%)
   * @returns Transaction ready to be signed and sent
   */
  async createSellTransaction(
    poolAddress: PublicKey,
    seller: PublicKey,
    tokenAmount: number,
    slippageBps: number = 500
  ): Promise<Transaction> {
    try {
      console.log('[DBC] Creating sell transaction:', {
        pool: poolAddress.toBase58(),
        seller: seller.toBase58(),
        tokenAmount,
        slippageBps
      });

      // Convert tokens to smallest unit (assuming 9 decimals)
      const amountInSmallestUnit = new BN(tokenAmount * 1e9);

      // Get pool state
      const poolState = await this.dbcClient.state.getPool(poolAddress);
      if (!poolState) {
        throw new Error('Pool not found');
      }

      // Get config state using the pool's config address
      const configState = await this.dbcClient.state.getPoolConfig(poolState.config);
      if (!configState) {
        throw new Error('Config not found');
      }

      // Get current point (slot or timestamp based on activation type)
      const currentPoint = await getCurrentPoint(this.connection, ActivationType.Slot);

      // Get accurate swap quote using the standalone function
      const quote = swapQuote(
        poolState,
        configState,
        true, // true = SELL tokens for SOL (swap base for quote)
        amountInSmallestUnit,
        slippageBps,
        false, // hasReferral
        currentPoint
      );

      console.log('[DBC] Swap quote:', {
        tokensIn: tokenAmount,
        minimumSolOut: quote.minimumAmountOut.toNumber() / 1e9,
        slippageBps
      });

      // Create swap transaction using Meteora SDK
      const transaction = await this.dbcClient.pool.swap({
        owner: seller,
        pool: poolAddress,
        amountIn: amountInSmallestUnit,
        minimumAmountOut: quote.minimumAmountOut, // Use SDK-calculated minimum
        swapBaseForQuote: true, // true = SELL tokens for SOL
        referralTokenAccount: null, // No referral
        payer: seller
      });

      console.log('[DBC] Sell transaction created successfully');

      return transaction;
    } catch (error) {
      console.error('[DBC] Error creating sell transaction:', error);
      throw new Error(`Failed to create sell transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
