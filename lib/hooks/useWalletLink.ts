'use client';

import { useCallback, useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

export function useWalletLink() {
  const { publicKey, connected } = useWallet();
  const [linked, setLinked] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const link = useCallback(async () => {
    setError(null);
    if (!connected || !publicKey) return;
    try {
      const res = await fetch('/api/auth/link-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: publicKey.toBase58() })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to link wallet');
      setLinked(true);
    } catch (e: any) {
      setError(e?.message || 'Failed to link wallet');
      setLinked(false);
    }
  }, [connected, publicKey]);

  useEffect(() => {
    if (connected && publicKey && !linked) {
      link();
    }
  }, [connected, publicKey, linked, link]);

  return { linked, error, link };
}


