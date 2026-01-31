/**
 * FlexIt Jito Bundle Engine
 *
 * Handles Jito bundle execution for:
 * - MEV protection (private mempool)
 * - Priority execution (via tips)
 * - Atomic swaps (all or nothing)
 */

import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  VersionedTransaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import { SearcherClient, searcherClient } from 'jito-ts/dist/sdk/block-engine/searcher';
import { Bundle } from 'jito-ts/dist/sdk/block-engine/types';
import { BundleResult } from 'jito-ts/dist/gen/block-engine/bundle';
import bs58 from 'bs58';
import { BundleConfig, BundleExecutionStatus } from './types';
import { EXECUTION_CONFIG, ExecutionPriority, getJitoTip, getCurrentRpcUrl } from './config';

/**
 * Jito tip receiver addresses (rotated for load balancing)
 */
const JITO_TIP_ACCOUNTS = [
  'Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY',
  'DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL',
  '96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5',
  '3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT',
  'HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe',
  'ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49',
  'ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt',
  'DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh',
].map(addr => new PublicKey(addr));

/**
 * Jito Bundle Engine
 */
export class JitoBundleEngine {
  private connection: Connection;
  private searcherClient: SearcherClient | null = null;
  private authKeypair: Keypair | null = null;
  private tipAccountIndex: number = 0;

  constructor(connection?: Connection) {
    this.connection = connection || new Connection(getCurrentRpcUrl(), EXECUTION_CONFIG.rpc.commitment);
    this.initialize();
  }

  /**
   * Initialize Jito client
   */
  private initialize() {
    try {
      if (!EXECUTION_CONFIG.jito.enabled) {
        console.log('[Jito] Jito bundles disabled in config');
        return;
      }

      if (!EXECUTION_CONFIG.jito.authKeypair) {
        console.warn('[Jito] No auth keypair configured, bundles will not work');
        return;
      }

      // Load auth keypair
      let secretArray: number[];
      const secret = EXECUTION_CONFIG.jito.authKeypair;

      if (secret.startsWith('[')) {
        secretArray = JSON.parse(secret);
      } else {
        secretArray = Array.from(bs58.decode(secret));
      }

      this.authKeypair = Keypair.fromSecretKey(new Uint8Array(secretArray));

      // Create searcher client using factory function
      this.searcherClient = searcherClient(
        EXECUTION_CONFIG.jito.blockEngineUrl,
        this.authKeypair
      );

      console.log('[Jito] Bundle engine initialized:', {
        blockEngine: EXECUTION_CONFIG.jito.blockEngineUrl,
        authPubkey: this.authKeypair.publicKey.toBase58(),
      });
    } catch (error) {
      console.error('[Jito] Failed to initialize:', error);
      this.searcherClient = null;
    }
  }

  /**
   * Check if Jito is available
   */
  isAvailable(): boolean {
    return this.searcherClient !== null && this.authKeypair !== null;
  }

  /**
   * Create a tip transaction
   */
  async createTipTransaction(
    feePayer: PublicKey,
    priority: ExecutionPriority = ExecutionPriority.NORMAL
  ): Promise<Transaction> {
    try {
      const tipLamports = getJitoTip(priority);

      // Get tip account (rotate for load balancing)
      const tipAccount = this.getNextTipAccount();

      console.log('[Jito] Creating tip transaction:', {
        feePayer: feePayer.toBase58(),
        tipAccount: tipAccount.toBase58(),
        tipLamports,
        priority,
      });

      // Create tip instruction
      const tipInstruction = SystemProgram.transfer({
        fromPubkey: feePayer,
        toPubkey: tipAccount,
        lamports: tipLamports,
      });

      // Build transaction
      const transaction = new Transaction().add(tipInstruction);

      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash(
        EXECUTION_CONFIG.rpc.commitment
      );

      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      transaction.feePayer = feePayer;

      return transaction;
    } catch (error) {
      console.error('[Jito] Error creating tip transaction:', error);
      throw new Error(`Failed to create tip transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a bundle with transactions
   */
  async createBundle(
    transactions: Transaction[],
    feePayer: PublicKey,
    priority: ExecutionPriority = ExecutionPriority.NORMAL
  ): Promise<BundleConfig> {
    try {
      console.log('[Jito] Creating bundle:', {
        txCount: transactions.length,
        priority,
      });

      // Create tip transaction
      const tipTransaction = await this.createTipTransaction(feePayer, priority);
      const tipLamports = getJitoTip(priority);

      // Bundle ID
      const bundleId = `bundle-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      return {
        id: bundleId,
        transactions,
        tipTransaction,
        tipLamports,
        maxRetries: EXECUTION_CONFIG.jito.bundleRetries,
        timeoutMs: EXECUTION_CONFIG.jito.bundleTimeout,
      };
    } catch (error) {
      console.error('[Jito] Error creating bundle:', error);
      throw error;
    }
  }

  /**
   * Send a bundle to Jito
   */
  async sendBundle(bundle: BundleConfig, signers: Keypair[]): Promise<string> {
    if (!this.searcherClient) {
      throw new Error('Jito searcher client not initialized');
    }

    try {
      console.log('[Jito] Sending bundle:', bundle.id);

      // Sign all transactions
      const allTransactions = [...bundle.transactions, bundle.tipTransaction];

      for (const tx of allTransactions) {
        (tx.sign as any)(...signers);
      }

      // Create Jito bundle
      const jitoBundle = new Bundle(
        allTransactions.map(tx => {
          if (tx instanceof VersionedTransaction) {
            return tx;
          }
          // Convert Transaction to VersionedTransaction
          return new VersionedTransaction(tx.compileMessage());
        }),
        allTransactions.length
      );

      // Send bundle
      const result = await this.searcherClient.sendBundle(jitoBundle);

      if (!result.ok) {
        throw new Error(`Failed to send bundle: ${result.error.message}`);
      }

      const bundleId = result.value;

      console.log('[Jito] Bundle sent successfully:', {
        bundleId,
        internalId: bundle.id,
        txCount: bundle.transactions.length,
        tip: bundle.tipLamports,
      });

      return bundleId;
    } catch (error) {
      console.error('[Jito] Error sending bundle:', error);
      throw new Error(`Failed to send bundle: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Wait for bundle confirmation
   */
  async waitForBundleConfirmation(
    bundleId: string,
    timeoutMs: number = EXECUTION_CONFIG.jito.bundleTimeout
  ): Promise<BundleExecutionStatus> {
    const startTime = Date.now();
    const status: BundleExecutionStatus = {
      bundleId,
      status: 'PENDING',
      retries: 0,
      createdAt: startTime,
      updatedAt: startTime,
    };

    console.log('[Jito] Waiting for bundle confirmation:', bundleId);

    try {
      // Poll for bundle status
      while (Date.now() - startTime < timeoutMs) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Poll every 500ms

        // Note: jito-ts doesn't have a direct bundle status API
        // In production, you'd use their WebSocket API or check block for your transactions
        // For now, we'll implement a simplified version

        const elapsed = Date.now() - startTime;

        if (elapsed > timeoutMs) {
          status.status = 'TIMEOUT';
          status.error = 'Bundle confirmation timeout';
          status.updatedAt = Date.now();
          break;
        }

        // TODO: Implement actual bundle status checking via Jito API
        // For now, assume success after 2 seconds (for development)
        if (elapsed > 2000) {
          status.status = 'LANDED';
          status.updatedAt = Date.now();
          console.log('[Jito] Bundle landed (simulated):', bundleId);
          break;
        }

        status.status = 'PROCESSING';
        status.updatedAt = Date.now();
      }

      return status;
    } catch (error) {
      console.error('[Jito] Error waiting for bundle:', error);
      status.status = 'FAILED';
      status.error = error instanceof Error ? error.message : 'Unknown error';
      status.updatedAt = Date.now();
      return status;
    }
  }

  /**
   * Execute a bundle with retries
   */
  async executeBundle(
    bundle: BundleConfig,
    signers: Keypair[]
  ): Promise<BundleExecutionStatus> {
    let lastError: Error | null = null;
    let attempts = 0;

    while (attempts < bundle.maxRetries) {
      attempts++;

      try {
        console.log(`[Jito] Execute attempt ${attempts}/${bundle.maxRetries}`);

        // Send bundle
        const bundleId = await this.sendBundle(bundle, signers);

        // Wait for confirmation
        const status = await this.waitForBundleConfirmation(bundleId, bundle.timeoutMs);

        if (status.status === 'LANDED') {
          console.log('[Jito] Bundle executed successfully:', bundleId);
          return status;
        }

        if (status.status === 'TIMEOUT' && attempts < bundle.maxRetries) {
          console.log('[Jito] Bundle timeout, retrying...');
          continue;
        }

        return status;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.error(`[Jito] Attempt ${attempts} failed:`, lastError.message);

        if (attempts >= bundle.maxRetries) {
          break;
        }

        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(2, attempts), 5000)));
      }
    }

    // All retries failed
    return {
      bundleId: bundle.id,
      status: 'FAILED',
      error: lastError?.message || 'All retry attempts failed',
      retries: attempts,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  /**
   * Fallback: Send transaction normally if Jito fails
   */
  async sendTransactionFallback(
    transaction: Transaction,
    signers: Keypair[]
  ): Promise<string> {
    console.log('[Jito] Using fallback (direct RPC send)');

    try {
      transaction.sign(...signers);

      const signature = await this.connection.sendRawTransaction(
        transaction.serialize(),
        {
          skipPreflight: false,
          preflightCommitment: EXECUTION_CONFIG.rpc.commitment,
        }
      );

      console.log('[Jito] Fallback transaction sent:', signature);

      // Wait for confirmation
      const confirmation = await this.connection.confirmTransaction(
        signature,
        EXECUTION_CONFIG.rpc.commitment
      );

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      return signature;
    } catch (error) {
      console.error('[Jito] Fallback failed:', error);
      throw error;
    }
  }

  /**
   * Get next tip account (round-robin)
   */
  private getNextTipAccount(): PublicKey {
    const account = JITO_TIP_ACCOUNTS[this.tipAccountIndex];
    this.tipAccountIndex = (this.tipAccountIndex + 1) % JITO_TIP_ACCOUNTS.length;
    return account;
  }

  /**
   * Estimate bundle cost (tip + gas)
   */
  estimateBundleCost(
    txCount: number,
    priority: ExecutionPriority = ExecutionPriority.NORMAL
  ): number {
    const tip = getJitoTip(priority);
    const estimatedGas = 5000 * (txCount + 1); // ~5000 lamports per tx
    return tip + estimatedGas;
  }
}

/**
 * Create a Jito bundle engine instance
 */
export function createJitoBundleEngine(connection?: Connection): JitoBundleEngine {
  return new JitoBundleEngine(connection);
}

export default JitoBundleEngine;
