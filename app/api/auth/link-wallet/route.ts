import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { auth as serverAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await serverAuth(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { walletAddress } = await request.json();
    if (!walletAddress) {
      return NextResponse.json({ success: false, error: 'walletAddress required' }, { status: 400 });
    }

    // Enforce 1:1 mapping
    const { data: existing, error: existingError } = await supabase
      .from('users')
      .select('id, clerk_user_id')
      .eq('wallet_address', walletAddress)
      .maybeSingle();

    if (existing && existing.clerk_user_id !== userId) {
      return NextResponse.json({ success: false, error: 'Wallet already linked to another account' }, { status: 409 });
    }

    // Upsert user profile row by clerk_user_id
    const { data: upserted, error: upsertError } = await supabase
      .from('users')
      .upsert({ clerk_user_id: userId, wallet_address: walletAddress }, { onConflict: 'clerk_user_id' })
      .select('id, wallet_address')
      .single();

    if (upsertError) {
      return NextResponse.json({ success: false, error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, walletAddress: upserted.wallet_address });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Unknown error' }, { status: 500 });
  }
}


