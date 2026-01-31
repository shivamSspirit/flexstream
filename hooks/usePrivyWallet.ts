'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useWallets as useSolanaWallets } from '@privy-io/react-auth/solana';
import { useCallback, useMemo, useEffect, useState } from 'react';
import { PublicKey, Transaction, VersionedTransaction, Connection } from '@solana/web3.js';

/**
 * usePrivyWallet - A hook that provides wallet functionality using Privy
 *
 * This hook provides a similar interface to @jup-ag/wallet-adapter's useWallet
 * but uses Privy for authentication and wallet management.
 *
 * Features:
 * - Embedded wallet support (no browser extension needed)
 * - Email/social login with automatic wallet creation
 * - External wallet support (Phantom, Solflare, etc.)
 */
export function usePrivyWallet() {
  const {
    ready,
    authenticated,
    user,
    login,
    logout,
    connectWallet,
  } = usePrivy();

  const { wallets } = useSolanaWallets();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get the active Solana wallet
  const activeWallet = useMemo(() => {
    if (!wallets || wallets.length === 0) return null;
    // Prefer embedded wallet, then external wallets
    const embedded = wallets.find((w: any) => w.walletClientType === 'privy');
    return embedded || wallets[0];
  }, [wallets]);

  // Get public key from active wallet
  const publicKey = useMemo(() => {
    if (!activeWallet?.address) return null;
    try {
      return new PublicKey(activeWallet.address);
    } catch {
      return null;
    }
  }, [activeWallet?.address]);

  // Connection status
  const connected = useMemo(() => {
    return authenticated && !!publicKey;
  }, [authenticated, publicKey]);

  // Sign a transaction
  const signTransaction = useCallback(async <T extends Transaction | VersionedTransaction>(
    transaction: T
  ): Promise<T> => {
    if (!activeWallet) {
      throw new Error('No wallet connected');
    }

    const signedTx = await (activeWallet as any).signTransaction(transaction);
    return signedTx as T;
  }, [activeWallet]);

  // Sign multiple transactions
  const signAllTransactions = useCallback(async <T extends Transaction | VersionedTransaction>(
    transactions: T[]
  ): Promise<T[]> => {
    if (!activeWallet) {
      throw new Error('No wallet connected');
    }

    const signedTxs = await Promise.all(
      transactions.map(tx => (activeWallet as any).signTransaction(tx))
    );
    return signedTxs as T[];
  }, [activeWallet]);

  // Sign and send a transaction
  const sendTransaction = useCallback(async (
    transaction: Transaction | VersionedTransaction,
    connection: Connection,
    options?: { skipPreflight?: boolean }
  ): Promise<string> => {
    if (!activeWallet) {
      throw new Error('No wallet connected');
    }

    const signedTx = await (activeWallet as any).signTransaction(transaction);

    const signature = await connection.sendRawTransaction(
      signedTx.serialize(),
      {
        skipPreflight: options?.skipPreflight ?? false,
        preflightCommitment: 'confirmed',
      }
    );

    return signature;
  }, [activeWallet]);

  // Sign a message
  const signMessage = useCallback(async (message: Uint8Array): Promise<Uint8Array> => {
    if (!activeWallet) {
      throw new Error('No wallet connected');
    }

    const signature = await (activeWallet as any).signMessage(message);
    return signature;
  }, [activeWallet]);

  // Connect wallet (opens Privy modal)
  const connect = useCallback(async () => {
    if (!authenticated) {
      login();
    } else if (wallets.length === 0) {
      connectWallet();
    }
  }, [authenticated, wallets.length, login, connectWallet]);

  // Disconnect wallet
  const disconnect = useCallback(async () => {
    await logout();
  }, [logout]);

  return {
    // Connection state
    ready: mounted && ready,
    connected,
    connecting: !ready,

    // Wallet info
    publicKey,
    wallet: activeWallet,
    wallets,

    // User info from Privy
    user,
    authenticated,

    // Actions
    connect,
    disconnect,
    signTransaction,
    signAllTransactions,
    sendTransaction,
    signMessage,

    // Privy-specific
    login,
    logout,
    connectWallet,

    // Helper to get wallet address as string
    walletAddress: publicKey?.toBase58() || null,
  };
}

/**
 * useWallet - Compatibility layer for existing code
 *
 * This provides the same interface as @jup-ag/wallet-adapter's useWallet
 * but uses Privy under the hood.
 */
export function useWallet() {
  const privyWallet = usePrivyWallet();

  return {
    publicKey: privyWallet.publicKey,
    connected: privyWallet.connected,
    connecting: privyWallet.connecting,
    disconnect: privyWallet.disconnect,
    signTransaction: privyWallet.signTransaction,
    signAllTransactions: privyWallet.signAllTransactions,
    signMessage: privyWallet.signMessage,
    sendTransaction: privyWallet.sendTransaction,
    wallet: privyWallet.wallet,
    wallets: privyWallet.wallets,
  };
}
