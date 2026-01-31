'use client';

/**
 * Wallet Compatibility Layer
 *
 * This module provides compatibility between Privy and the Jupiter wallet adapter.
 * It exports the same interface as @jup-ag/wallet-adapter but uses Privy under the hood.
 *
 * Usage:
 * Replace: import { useWallet } from '@jup-ag/wallet-adapter'
 * With:    import { useWallet } from '@/hooks/useWalletCompat'
 */

import { usePrivy } from '@privy-io/react-auth';
import { useCallback, useMemo, useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { PublicKey, Transaction, VersionedTransaction, Connection } from '@solana/web3.js';

export interface WalletContextState {
  publicKey: PublicKey | null;
  connected: boolean;
  connecting: boolean;
  disconnecting: boolean;
  ready: boolean; // True when Privy SDK is ready and auth state is determined
  wallet: any;
  wallets: any[];
  select: (walletName: string) => void;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signTransaction: <T extends Transaction | VersionedTransaction>(transaction: T) => Promise<T>;
  signAllTransactions: <T extends Transaction | VersionedTransaction>(transactions: T[]) => Promise<T[]>;
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
  sendTransaction: (transaction: Transaction | VersionedTransaction, connection: Connection, options?: any) => Promise<string>;
}

// Context for Solana wallets data (populated by provider after mount)
const SolanaWalletsContext = createContext<{ wallets: any[]; ready: boolean }>({
  wallets: [],
  ready: false,
});

/**
 * SolanaWalletsProvider - Wraps children and provides Solana wallet data
 * This component handles the dynamic import of Privy Solana hooks
 */
export function SolanaWalletsProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <SolanaWalletsContext.Provider value={{ wallets: [], ready: false }}>
        {children}
      </SolanaWalletsContext.Provider>
    );
  }

  return <SolanaWalletsProviderInner>{children}</SolanaWalletsProviderInner>;
}

// Inner component that can safely use the Privy Solana hooks after mount
function SolanaWalletsProviderInner({ children }: { children: ReactNode }) {
  const [walletsData, setWalletsData] = useState<{ wallets: any[]; ready: boolean }>({
    wallets: [],
    ready: false,
  });

  useEffect(() => {
    let mounted = true;

    // Dynamically import and use the hook via a polling mechanism
    const loadWallets = async () => {
      try {
        const { useWallets } = await import('@privy-io/react-auth/solana');
        // We can't call hooks here directly, so we'll use a different approach
        // The hook needs to be called in a component
        if (mounted) {
          // Signal that the module is loaded
          setWalletsData(prev => ({ ...prev, ready: false }));
        }
      } catch (err) {
        console.warn('[SolanaWalletsProvider] Failed to load:', err);
      }
    };

    loadWallets();
    return () => { mounted = false; };
  }, []);

  return (
    <SolanaWalletsContext.Provider value={walletsData}>
      <WalletsHookBridge onWalletsChange={setWalletsData}>
        {children}
      </WalletsHookBridge>
    </SolanaWalletsContext.Provider>
  );
}

// Bridge component that calls the actual hook
function WalletsHookBridge({
  children,
  onWalletsChange
}: {
  children: ReactNode;
  onWalletsChange: (data: { wallets: any[]; ready: boolean }) => void;
}) {
  const [HookComponent, setHookComponent] = useState<React.ComponentType<{
    children: ReactNode;
    onWalletsChange: (data: { wallets: any[]; ready: boolean }) => void;
  }> | null>(null);

  useEffect(() => {
    import('@privy-io/react-auth/solana')
      .then(({ useWallets }) => {
        // Create a component that uses the hook
        const WalletsConsumer = ({
          children,
          onWalletsChange
        }: {
          children: ReactNode;
          onWalletsChange: (data: { wallets: any[]; ready: boolean }) => void;
        }) => {
          const { wallets, ready } = useWallets();

          useEffect(() => {
            onWalletsChange({ wallets: wallets || [], ready });
          }, [wallets, ready, onWalletsChange]);

          return <>{children}</>;
        };

        setHookComponent(() => WalletsConsumer);
      })
      .catch((err) => {
        console.warn('[WalletsHookBridge] Failed to load useWallets:', err);
      });
  }, []);

  if (!HookComponent) {
    return <>{children}</>;
  }

  return <HookComponent onWalletsChange={onWalletsChange}>{children}</HookComponent>;
}

/**
 * useWallet - Compatibility hook that mirrors @jup-ag/wallet-adapter's useWallet
 * but uses Privy for wallet management
 */
export function useWallet(): WalletContextState {
  const { ready, authenticated, login, logout } = usePrivy();
  const { wallets, ready: walletsReady } = useContext(SolanaWalletsContext);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get active Solana wallet (prefer embedded - check by wallet type or first wallet)
  const activeWallet = useMemo(() => {
    if (!wallets || wallets.length === 0) return null;
    // Find embedded wallet by checking meta or default to first wallet
    const embedded = wallets.find((w: any) =>
      w.walletClientType === 'privy' ||
      w.meta?.name?.toLowerCase()?.includes('privy')
    );
    return embedded || wallets[0];
  }, [wallets]);

  // Get public key
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
    return mounted && authenticated && !!publicKey;
  }, [mounted, authenticated, publicKey]);

  // Sign transaction - Use any type to handle SDK differences
  const signTransaction = useCallback(async <T extends Transaction | VersionedTransaction>(
    transaction: T
  ): Promise<T> => {
    if (!activeWallet) {
      throw new Error('No wallet connected');
    }
    // Cast to any to handle different Privy SDK versions
    const wallet = activeWallet as any;
    const result = await wallet.signTransaction(transaction);
    // Handle both direct return and object return formats
    return (result?.signedTransaction || result) as T;
  }, [activeWallet]);

  // Sign all transactions
  const signAllTransactions = useCallback(async <T extends Transaction | VersionedTransaction>(
    transactions: T[]
  ): Promise<T[]> => {
    if (!activeWallet) {
      throw new Error('No wallet connected');
    }
    const wallet = activeWallet as any;
    const signed = await Promise.all(
      transactions.map(async (tx) => {
        const result = await wallet.signTransaction(tx);
        return (result?.signedTransaction || result) as T;
      })
    );
    return signed;
  }, [activeWallet]);

  // Sign message - Use any type to handle SDK differences
  const signMessage = useCallback(async (message: Uint8Array): Promise<Uint8Array> => {
    if (!activeWallet) {
      throw new Error('No wallet connected');
    }
    const wallet = activeWallet as any;
    const result = await wallet.signMessage(message);
    // Handle both direct return and object return formats
    return result?.signature || result;
  }, [activeWallet]);

  // Send transaction
  const sendTransaction = useCallback(async (
    transaction: Transaction | VersionedTransaction,
    connection: Connection,
    options?: { skipPreflight?: boolean }
  ): Promise<string> => {
    if (!activeWallet) {
      throw new Error('No wallet connected');
    }

    const wallet = activeWallet as any;
    const result = await wallet.signTransaction(transaction);
    const signedTx = result?.signedTransaction || result;

    // Serialize and send
    const serialized = typeof signedTx.serialize === 'function'
      ? signedTx.serialize()
      : signedTx;

    const signature = await connection.sendRawTransaction(
      serialized,
      {
        skipPreflight: options?.skipPreflight ?? false,
        preflightCommitment: 'confirmed',
      }
    );

    return signature;
  }, [activeWallet]);

  // Connect (opens Privy login)
  const connect = useCallback(async () => {
    login();
  }, [login]);

  // Disconnect
  const disconnect = useCallback(async () => {
    await logout();
  }, [logout]);

  // Select wallet (no-op for Privy - wallet is managed by Privy)
  const select = useCallback((walletName: string) => {
    console.log('[WalletCompat] select called with:', walletName);
  }, []);

  return {
    publicKey,
    connected,
    connecting: !ready || !walletsReady,
    disconnecting: false,
    ready: ready && walletsReady && mounted, // True when everything is initialized
    wallet: activeWallet,
    wallets,
    select,
    connect,
    disconnect,
    signTransaction,
    signAllTransactions,
    signMessage,
    sendTransaction,
  };
}

/**
 * useUnifiedWalletContext - Compatibility for Jupiter's wallet context
 */
export function useUnifiedWalletContext() {
  const { login } = usePrivy();

  return {
    setShowModal: (show: boolean) => {
      if (show) {
        login();
      }
    },
  };
}

/**
 * UnifiedWalletButton - Re-export PrivyWalletButton with Jupiter's name
 */
export { PrivyWalletButton as UnifiedWalletButton } from '@/components/wallet/PrivyWalletButton';
