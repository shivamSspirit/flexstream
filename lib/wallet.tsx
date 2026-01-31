'use client';

/**
 * Wallet Context Provider - Now powered by Privy
 *
 * This file provides backwards compatibility for code that was using
 * the old @solana/wallet-adapter setup. It re-exports Privy components
 * and hooks with similar interfaces.
 */

import React, { FC, ReactNode } from 'react';
import { PrivyWalletButton, ConnectWalletButton } from '@/components/wallet/PrivyWalletButton';

/**
 * WalletContextProvider - Legacy wrapper (no-op with Privy)
 *
 * Privy is configured at the app level in providers.tsx,
 * so this just passes children through for backwards compatibility.
 */
export const WalletContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

/**
 * WalletMultiButton - Re-export Privy wallet button
 */
export const WalletMultiButton = PrivyWalletButton;

/**
 * WalletDisconnectButton - Re-export connect button (shows when disconnected)
 */
export const WalletDisconnectButton = ConnectWalletButton;

// Re-export the useWallet hook for convenience
export { useWallet } from '@/hooks/useWalletCompat';
