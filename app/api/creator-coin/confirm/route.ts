import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    console.log('✅ [CREATOR COIN CONFIRM] Request received');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();

    const { signature, walletAddress, tokenData } = body;

    if (!signature || !walletAddress || !tokenData) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
      }, { status: 400 });
    }

    console.log('📝 [CREATOR COIN CONFIRM] Saving creator coin data:', {
      wallet: walletAddress,
      mint: tokenData.mint,
      signature
    });

    // Update user with creator coin information
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        creator_coin_enabled: true,
        creator_coin_mint: tokenData.mint,
        creator_coin_pool: tokenData.pool,
        creator_coin_bonding_curve: tokenData.bondingCurve,
        creator_coin_metadata_uri: tokenData.metadataUri,
        creator_coin_creation_signature: signature,
        creator_coin_created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('wallet_address', walletAddress)
      .select()
      .single();

    if (updateError) {
      console.error('❌ [CREATOR COIN CONFIRM] Update error:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Failed to save creator coin data',
      }, { status: 500 });
    }

    console.log('✅ [CREATOR COIN CONFIRM] Creator coin activated successfully');

    return NextResponse.json({
      success: true,
      data: {
        user: updatedUser,
        signature,
        token: tokenData,
        message: 'Creator coin activated successfully!'
      }
    });

  } catch (error) {
    console.error('❌ [CREATOR COIN CONFIRM] Error:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to confirm creator coin',
    }, { status: 500 });
  }
}
