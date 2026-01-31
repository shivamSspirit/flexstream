import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey, SystemProgram, Transaction, VersionedTransaction } from '@solana/web3.js';
import BN from 'bn.js';
import { DBCSwapEngine } from '@/lib/execution/dbc-swap-engine';
import { JupiterRoutingEngine } from '@/lib/execution/jupiter-routing-engine';
import { SwapDirection } from '@/lib/execution/types';
import { EXECUTION_CONFIG, getCurrentRpcUrl, ExecutionPriority } from '@/lib/execution/config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Jito tip receiver addresses
 */
const JITO_TIP_ACCOUNTS = [
  'Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY',
  'DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL',
  '96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5',
  '3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT',
  'HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe',
];

/**
 * POST /api/swap/execute
 *
 * Builds a swap transaction based on the selected route
 * Optionally creates a Jito tip transaction if useJito is enabled
 */
export async function POST(request: NextRequest) {
  console.log('[SWAP EXECUTE] Starting execute request');

  try {
    const body = await request.json();

    const {
      tokenMint,
      poolAddress,
      amount,
      direction,
      slippageBps = 300,
      userWallet,
      route, // 'DBC' or 'JUPITER'
      useJito = false,
      jitoTipLamports, // Dynamic tip from tip-floor API
      tokenType = 'post' as const, // 'post' or 'creator'
    } = body;

    // Validate required fields
    if (!tokenMint || !amount || !direction || !userWallet || !route) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: tokenMint, amount, direction, userWallet, route',
      }, { status: 400 });
    }

    // Validate route
    if (!['DBC', 'JUPITER'].includes(route.toUpperCase())) {
      return NextResponse.json({
        success: false,
        error: 'Invalid route. Must be "DBC" or "JUPITER"',
      }, { status: 400 });
    }

    // Validate direction
    if (!['buy', 'sell'].includes(direction.toLowerCase())) {
      return NextResponse.json({
        success: false,
        error: 'Invalid direction. Must be "buy" or "sell"',
      }, { status: 400 });
    }

    // Parse addresses
    let tokenMintPubkey: PublicKey;
    let poolAddressPubkey: PublicKey | undefined;
    let userWalletPubkey: PublicKey;

    try {
      tokenMintPubkey = new PublicKey(tokenMint);
      userWalletPubkey = new PublicKey(userWallet);
      if (poolAddress) {
        poolAddressPubkey = new PublicKey(poolAddress);
      }
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Invalid address format',
      }, { status: 400 });
    }

    // DBC route requires pool address
    if (route.toUpperCase() === 'DBC' && !poolAddressPubkey) {
      return NextResponse.json({
        success: false,
        error: 'DBC route requires poolAddress',
      }, { status: 400 });
    }

    // Convert amount to lamports
    const amountBN = new BN(Math.floor(amount * 1e9));
    const swapDirection = direction.toLowerCase() === 'buy' ? SwapDirection.BUY : SwapDirection.SELL;

    // Initialize connection
    const connection = new Connection(getCurrentRpcUrl(), EXECUTION_CONFIG.rpc.commitment);

    console.log('[SWAP EXECUTE] Building transaction:', {
      route,
      tokenMint: tokenMint.substring(0, 10) + '...',
      amount,
      direction,
      useJito,
    });

    let swapTransaction: string;
    let isVersionedTransaction = false;
    let estimatedFees = {
      networkFee: 5000, // Base Solana fee
      prioritizationFee: 0,
      jitoTip: 0,
      total: 5000,
    };

    // Build transaction based on route
    if (route.toUpperCase() === 'DBC') {
      // Build DBC transaction
      const dbcEngine = new DBCSwapEngine(connection);

      // First get a quote to determine minimum amount out
      const quote = await dbcEngine.getQuote({
        userWallet: userWalletPubkey,
        tokenMint: tokenMintPubkey,
        poolAddress: poolAddressPubkey!,
        direction: swapDirection,
        amountIn: amountBN,
        minimumAmountOut: new BN(0),
        slippageBps,
        tokenType,
      });

      // Build the transaction with the quote's minimum amount
      const transaction = await dbcEngine.buildSwapTransaction({
        userWallet: userWalletPubkey,
        tokenMint: tokenMintPubkey,
        poolAddress: poolAddressPubkey!,
        direction: swapDirection,
        amountIn: amountBN,
        minimumAmountOut: quote.minimumAmountOut,
        slippageBps,
        tokenType,
      });

      // DBC returns Legacy Transaction
      swapTransaction = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      }).toString('base64');
      isVersionedTransaction = false;
      estimatedFees.networkFee = quote.estimatedFee || 5000;

    } else {
      // Build Jupiter transaction
      const jupiterEngine = new JupiterRoutingEngine(connection);

      // Get quote first
      const quote = await jupiterEngine.getQuote({
        userWallet: userWalletPubkey,
        tokenMint: tokenMintPubkey,
        direction: swapDirection,
        amountIn: amountBN,
        minimumAmountOut: new BN(0),
        slippageBps,
        maxAccounts: EXECUTION_CONFIG.jupiter.maxAccounts,
        onlyDirectRoutes: false,
      });

      // Build transaction
      const transaction = await jupiterEngine.buildSwapTransaction(
        {
          userWallet: userWalletPubkey,
          tokenMint: tokenMintPubkey,
          direction: swapDirection,
          amountIn: amountBN,
          minimumAmountOut: quote.minimumAmountOut,
          slippageBps,
          maxAccounts: EXECUTION_CONFIG.jupiter.maxAccounts,
          onlyDirectRoutes: false,
        },
        quote
      );

      // Jupiter returns VersionedTransaction by default
      if (transaction instanceof VersionedTransaction) {
        swapTransaction = Buffer.from(transaction.serialize()).toString('base64');
        isVersionedTransaction = true;
      } else {
        swapTransaction = transaction.serialize({
          requireAllSignatures: false,
          verifySignatures: false,
        }).toString('base64');
        isVersionedTransaction = false;
      }

      estimatedFees.networkFee = quote.estimatedFee || 5000;
    }

    // Build Jito tip transaction if enabled
    let tipTransaction: string | null = null;

    if (useJito) {
      // Use dynamic tip from client or default
      const tipAmount = jitoTipLamports || EXECUTION_CONFIG.jito.tips.default;
      estimatedFees.jitoTip = tipAmount;

      // Get random tip account
      const tipAccount = new PublicKey(
        JITO_TIP_ACCOUNTS[Math.floor(Math.random() * JITO_TIP_ACCOUNTS.length)]
      );

      // Create tip transaction
      const tipTx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: userWalletPubkey,
          toPubkey: tipAccount,
          lamports: tipAmount,
        })
      );

      // Get blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash(
        EXECUTION_CONFIG.rpc.commitment
      );

      tipTx.recentBlockhash = blockhash;
      tipTx.lastValidBlockHeight = lastValidBlockHeight;
      tipTx.feePayer = userWalletPubkey;

      tipTransaction = tipTx.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      }).toString('base64');

      console.log('[SWAP EXECUTE] Tip transaction created:', {
        tipAccount: tipAccount.toBase58(),
        tipLamports: tipAmount,
      });
    }

    // Calculate total fees
    estimatedFees.total = estimatedFees.networkFee + estimatedFees.prioritizationFee + estimatedFees.jitoTip;

    // Get current blockhash for reference
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash(
      EXECUTION_CONFIG.rpc.commitment
    );

    const response = {
      success: true,
      data: {
        swapTransaction,
        tipTransaction,
        isVersionedTransaction,
        blockhash,
        lastValidBlockHeight,
        route: route.toUpperCase(),
        estimatedFees,
        useJito,
      },
    };

    console.log('[SWAP EXECUTE] Transaction built successfully:', {
      route,
      isVersioned: isVersionedTransaction,
      hasTipTx: !!tipTransaction,
      estimatedFees,
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('[SWAP EXECUTE] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: 500 });
  }
}
