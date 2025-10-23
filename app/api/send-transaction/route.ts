import { NextRequest, NextResponse } from 'next/server';
import { Connection, Transaction, VersionedTransaction } from '@solana/web3.js';
import { DBC_CONFIG } from '@/lib/dbc-config';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with proper null checking
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

type TransactionPayload = {
  transaction: string; // Base64 encoded transaction
  type?: 'legacy' | 'versioned';
  tokenId?: string;
  action?: 'create' | 'mint' | 'transfer';
};

export async function POST(req: NextRequest) {
  try {
    const { transactions } = await req.json() as { transactions: TransactionPayload[] };
    
    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      throw new Error('No transactions provided');
    }

    const connection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || DBC_CONFIG.RPC_URL,
      DBC_CONFIG.COMMITMENT
    );

    const results = [];
    
    for (const { transaction: txData, type = 'legacy', tokenId, action } of transactions) {
      try {
        let transaction: Transaction | VersionedTransaction;
        
        // Deserialize the transaction
        const txBuffer = Buffer.from(txData, 'base64');
        
        if (type === 'versioned') {
          transaction = VersionedTransaction.deserialize(txBuffer);
        } else {
          transaction = Transaction.from(txBuffer);
        }

        // Send the transaction
        const signature = await connection.sendRawTransaction(
          transaction.serialize(),
          {
            skipPreflight: false,
            maxRetries: 3,
          }
        );

        // Wait for confirmation
        const confirmation = await connection.confirmTransaction(
          signature,
          DBC_CONFIG.COMMITMENT
        );

        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
        }

        // Update token status in database if tokenId is provided
        if (tokenId && action) {
          // Map action to status
          const statusMap: Record<string, 'pending' | 'created' | 'minted' | 'transferred' | 'failed'> = {
            'create': 'created',
            'mint': 'minted',
            'transfer': 'transferred'
          };
          await updateTokenStatus(tokenId, statusMap[action] || 'pending', signature);
        }

        results.push({
          success: true,
          signature,
          action,
          tokenId,
        });

      } catch (error: any) {
        console.error('Transaction error:', error);
        
        if (tokenId) {
          await updateTokenStatus(tokenId, 'failed');
        }

        results.push({
          success: false,
          error: (error as Error).message || 'Transaction failed',
          code: 'TRANSACTION_ERROR',
          signature: undefined,
          action,
          tokenId,
        });
      }
    }

    // Check if all transactions succeeded
    const allSucceeded = results.every(result => result.success);
    const someSucceeded = results.some(result => result.success);

    return NextResponse.json({
      success: someSucceeded,
      allSucceeded,
      results,
    });

  } catch (error: any) {
    console.error('Send transaction error:', error);
    const status = 400;
    const message = (error as Error).message || 'Internal server error';
    
    return NextResponse.json(
      { 
        success: false,
        error: message,
        code: 'INTERNAL_ERROR',
      },
      { status }
    );
  }
}

async function updateTokenStatus(
  tokenId: string,
  status: 'pending' | 'created' | 'minted' | 'transferred' | 'failed',
  signature?: string
) {
  if (!supabase) {
    console.error('Supabase not configured, skipping token status update');
    return;
  }

  const updateData: any = { status };

  if (signature) {
    updateData.last_tx_signature = signature;
    updateData.updated_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('tokens')
    .update(updateData)
    .eq('id', tokenId);

  if (error) {
    console.error('Failed to update token status:', error);
    throw new Error('Database update failed');
  }
}