import { NextRequest, NextResponse } from 'next/server';
import { verifyPumpFunToken } from '@/lib/jwt';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get('authorization');
    if (!auth?.startsWith('Bearer ')) return NextResponse.json({ success: false, error: 'Missing token' }, { status: 401 });
    const token = auth.slice('Bearer '.length);
    const payload = verifyPumpFunToken(token);

    const { mint, amount } = await request.json();
    if (!mint || !amount) return NextResponse.json({ success: false, error: 'mint and amount required' }, { status: 400 });

    // Validate wallet mapping
    const { data: profile, error } = await supabase
      .from('users')
      .select('wallet_address')
      .eq('clerk_user_id', payload.userId)
      .single();
    if (error || !profile?.wallet_address) return NextResponse.json({ success: false, error: 'Wallet missing' }, { status: 400 });

    // TODO: integrate on-chain buy via wallet adapter/server wallet
    // For now, echo success
    return NextResponse.json({ success: true, action: 'buy', mint, amount, walletAddress: profile.wallet_address });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Unknown error' }, { status: 500 });
  }
}


