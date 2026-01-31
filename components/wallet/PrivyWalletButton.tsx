'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useWallets as useSolanaWallets } from '@privy-io/react-auth/solana';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  WalletIcon,
  ArrowRightOnRectangleIcon,
  ClipboardDocumentIcon,
  Cog6ToothIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

/**
 * PrivyWalletButton - Wallet connection button using Privy
 *
 * Features:
 * - Shows "Connect" when disconnected
 * - Shows wallet address when connected
 * - Dropdown with wallet actions
 * - Copy address to clipboard
 */
export function PrivyWalletButton() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useSolanaWallets();
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get active wallet (first available wallet)
  const activeWallet = wallets?.[0];
  const walletAddress = activeWallet?.address;

  // Get user display info from linked accounts
  const googleAccount = user?.linkedAccounts?.find((a: any) => a.type === 'google_oauth') as any;
  const twitterAccount = user?.linkedAccounts?.find((a: any) => a.type === 'twitter_oauth') as any;

  const displayName = googleAccount?.name || twitterAccount?.name || null;
  const avatarUrl = twitterAccount?.profilePictureUrl || null;

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  // Copy address to clipboard
  const copyAddress = async () => {
    if (!walletAddress) return;

    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      toast.success('Address copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy address');
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      // Clear session storage
      sessionStorage.removeItem('current_user');
      sessionStorage.removeItem('current_username');
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  // Loading state
  if (!mounted || !ready) {
    return (
      <div className="h-10 w-32 bg-card-bg animate-pulse rounded-xl" />
    );
  }

  // Not authenticated - show connect button
  if (!authenticated) {
    return (
      <Button
        onClick={login}
        className="bg-gradient-to-r from-accent-green via-accent-cyan to-accent-blue hover:from-accent-green/90 hover:via-accent-cyan/90 hover:to-accent-blue/90 text-black font-bold px-4 sm:px-6 h-9 sm:h-10 rounded-xl transition-all shadow-lg hover:shadow-accent-green/20"
      >
        <WalletIcon className="w-4 h-4 mr-2" />
        Connect
      </Button>
    );
  }

  // Authenticated - show wallet dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="bg-card-bg hover:bg-card-hover border-white/10 hover:border-white/20 text-white font-medium px-3 sm:px-4 h-9 sm:h-10 rounded-xl transition-all"
        >
          <Avatar className="w-5 h-5 mr-2">
            {avatarUrl && <AvatarImage src={avatarUrl} />}
            <AvatarFallback className="bg-gradient-to-br from-accent-green to-accent-cyan text-black text-xs">
              {displayName?.[0] || walletAddress?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline">
            {displayName || (walletAddress && formatAddress(walletAddress)) || 'Connected'}
          </span>
          <span className="sm:hidden">
            {walletAddress ? formatAddress(walletAddress) : 'Connected'}
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-56 bg-card-bg border-white/10"
      >
        {/* Wallet Address */}
        {walletAddress && (
          <>
            <div className="px-3 py-2">
              <p className="text-xs text-text-muted mb-1">Wallet Address</p>
              <p className="text-sm text-white font-mono">{formatAddress(walletAddress)}</p>
            </div>
            <DropdownMenuSeparator className="bg-white/10" />
          </>
        )}

        {/* Copy Address */}
        <DropdownMenuItem
          onClick={copyAddress}
          className="cursor-pointer hover:bg-white/5"
        >
          {copied ? (
            <CheckIcon className="w-4 h-4 mr-2 text-accent-green" />
          ) : (
            <ClipboardDocumentIcon className="w-4 h-4 mr-2" />
          )}
          {copied ? 'Copied!' : 'Copy Address'}
        </DropdownMenuItem>

        {/* Wallet Settings */}
        <DropdownMenuItem
          onClick={() => window.open('https://privy.io/wallet', '_blank')}
          className="cursor-pointer hover:bg-white/5"
        >
          <Cog6ToothIcon className="w-4 h-4 mr-2" />
          Wallet Settings
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-white/10" />

        {/* Logout */}
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer hover:bg-white/5 text-metric-red focus:text-metric-red"
        >
          <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
          Log Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * ConnectWalletButton - Simple connect button for CTAs
 */
export function ConnectWalletButton({ className }: { className?: string }) {
  const { ready, authenticated, login } = usePrivy();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !ready) {
    return null;
  }

  if (authenticated) {
    return null;
  }

  return (
    <Button
      onClick={login}
      className={className || "bg-gradient-to-r from-accent-green via-accent-cyan to-accent-blue hover:from-accent-green/90 hover:via-accent-cyan/90 hover:to-accent-blue/90 text-black font-bold px-6 h-12 rounded-xl transition-all shadow-lg hover:shadow-accent-green/20"}
    >
      <WalletIcon className="w-5 h-5 mr-2" />
      Connect Wallet
    </Button>
  );
}
