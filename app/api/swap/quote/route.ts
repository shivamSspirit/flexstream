import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { RoutingEngine } from '@/lib/execution/routing-engine';
import { SwapDirection } from '@/lib/execution/types';
import { EXECUTION_CONFIG, getCurrentRpcUrl } from '@/lib/execution/config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/swap/quote
 *
 * Unified quote endpoint that compares DBC vs Jupiter
 * and returns the best price with comparison data
 */
export async function POST(request: NextRequest) {
  console.log('[SWAP QUOTE] Starting quote request');

  try {
    const body = await request.json();

    const {
      tokenMint,
      poolAddress,
      amount,
      direction,
      slippageBps = 300, // Default 3%
      userWallet,
    } = body;

    // Validate required fields
    if (!tokenMint || !amount || !direction || !userWallet) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: tokenMint, amount, direction, userWallet',
      }, { status: 400 });
    }

    // Validate direction
    if (!['buy', 'sell'].includes(direction.toLowerCase())) {
      return NextResponse.json({
        success: false,
        error: 'Invalid direction. Must be "buy" or "sell"',
      }, { status: 400 });
    }

    // Parse values
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

    // Convert amount to lamports/base units
    const amountBN = new BN(Math.floor(amount * 1e9));

    // Initialize routing engine
    const connection = new Connection(getCurrentRpcUrl(), EXECUTION_CONFIG.rpc.commitment);
    const routingEngine = new RoutingEngine(connection);

    // Build swap params
    const swapParams = {
      userWallet: userWalletPubkey,
      tokenMint: tokenMintPubkey,
      poolAddress: poolAddressPubkey,
      direction: direction.toLowerCase() === 'buy' ? SwapDirection.BUY : SwapDirection.SELL,
      amountIn: amountBN,
      minimumAmountOut: new BN(0), // Will be calculated by quote
      slippageBps,
    };

    console.log('[SWAP QUOTE] Comparing quotes:', {
      tokenMint: tokenMint.substring(0, 10) + '...',
      poolAddress: poolAddress?.substring(0, 10) || 'none',
      amount,
      direction,
      slippageBps,
    });

    // Compare quotes from both DBC and Jupiter
    const comparison = await routingEngine.compareQuotes(swapParams);

    // Calculate advantage percentage
    let advantagePercent = 0;
    if (comparison.dbc && comparison.jupiter) {
      const dbcOut = comparison.dbc.amountOut.toNumber();
      const jupOut = comparison.jupiter.amountOut.toNumber();
      if (comparison.recommended === 'DBC') {
        advantagePercent = ((dbcOut / jupOut) - 1) * 100;
      } else {
        advantagePercent = ((jupOut / dbcOut) - 1) * 100;
      }
    }

    // Build response
    const bestQuote = comparison.recommended === 'DBC' ? comparison.dbc : comparison.jupiter;

    if (!bestQuote) {
      return NextResponse.json({
        success: false,
        error: 'No quotes available',
      }, { status: 503 });
    }

    const response = {
      success: true,
      data: {
        bestRoute: comparison.recommended,
        bestQuote: {
          amountIn: bestQuote.amountIn.toString(),
          amountOut: bestQuote.amountOut.toString(),
          minimumAmountOut: bestQuote.minimumAmountOut.toString(),
          priceImpactBps: bestQuote.priceImpactBps,
          price: bestQuote.price,
          estimatedExecutionMs: bestQuote.estimatedExecutionMs,
          estimatedFee: bestQuote.estimatedFee,
        },
        comparison: {
          dbc: comparison.dbc ? {
            amountOut: comparison.dbc.amountOut.toString(),
            minimumAmountOut: comparison.dbc.minimumAmountOut.toString(),
            priceImpactBps: comparison.dbc.priceImpactBps,
            price: comparison.dbc.price,
            available: true,
          } : {
            available: false,
            reason: 'No DBC pool',
          },
          jupiter: comparison.jupiter ? {
            amountOut: comparison.jupiter.amountOut.toString(),
            minimumAmountOut: comparison.jupiter.minimumAmountOut.toString(),
            priceImpactBps: comparison.jupiter.priceImpactBps,
            price: comparison.jupiter.price,
            available: true,
          } : {
            available: false,
            reason: 'Jupiter quote failed',
          },
          reason: comparison.reason,
          advantagePercent: parseFloat(advantagePercent.toFixed(2)),
        },
        routeDetails: {
          route: comparison.recommended,
          poolAddress: poolAddress || null,
          slippageBps,
        },
        timestamp: Date.now(),
      },
    };

    console.log('[SWAP QUOTE] Quote comparison complete:', {
      bestRoute: comparison.recommended,
      reason: comparison.reason,
      advantagePercent: advantagePercent.toFixed(2) + '%',
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('[SWAP QUOTE] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: 500 });
  }
}
