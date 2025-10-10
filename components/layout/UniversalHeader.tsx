'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  MagnifyingGlassIcon,
  WalletIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface UniversalHeaderProps {
  className?: string;
  onMenuClick?: () => void;
  showWallet?: boolean;
  showSearch?: boolean;
}

export function UniversalHeader({
  className,
  onMenuClick,
  showWallet = true,
  showSearch = true,
}: UniversalHeaderProps) {
  const router = useRouter();
  const { connected, publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explore?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleWalletClick = async () => {
    if (connected) {
      await disconnect();
    } else {
      // Open wallet modal to select wallet (including Jupiter)
      setVisible(true);
    }
  };

  const truncateAddress = (address: string) => {
    // Show 6 characters total: first 3 and last 3
    return `${address.slice(0, 3)}...${address.slice(-3)}`;
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-50 bg-app-bg/95 backdrop-blur-md border-b border-white/10',
        className
      )}
    >
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Search Bar - Left Side */}
          {showSearch ? (
            <div className="flex-1 max-w-3xl">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary pointer-events-none" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tokens, creators, posts..."
                    className="w-full pl-12 pr-4 h-11 bg-card-bg border-white/10 rounded-full text-primary placeholder:text-secondary focus:border-white/20 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  />
                </div>
              </form>
            </div>
          ) : (
            <div className="flex-1" />
          )}

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Wallet Button - Desktop */}
            {showWallet && (
              <Button
                onClick={handleWalletClick}
                variant={connected ? 'default' : 'outline'}
                className={cn(
                  'hidden sm:flex items-center gap-2 h-10 px-4 rounded-xl transition-all',
                  connected
                    ? 'flexstream-gradient text-white border-0 hover:opacity-90'
                    : 'bg-card-bg border-white/20 text-primary hover:bg-card-bg/80 hover:border-white/30'
                )}
              >
                <WalletIcon className="w-5 h-5" />
                <span className="font-medium">
                  {connected && publicKey
                    ? truncateAddress(publicKey.toBase58())
                    : 'Connect Wallet'}
                </span>
              </Button>
            )}

            {/* Wallet Icon - Mobile */}
            {showWallet && (
              <Button
                onClick={handleWalletClick}
                variant="ghost"
                size="icon"
                className={cn(
                  'sm:hidden w-10 h-10 rounded-xl transition-colors relative',
                  connected
                    ? 'flexstream-gradient text-white'
                    : 'bg-card-bg text-secondary hover:text-primary hover:bg-card-bg/80'
                )}
              >
                <WalletIcon className="w-5 h-5" />
                {connected && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-metric-green rounded-full border-2 border-app-bg" />
                )}
              </Button>
            )}

            {/* Hamburger Menu */}
            <Button
              onClick={onMenuClick}
              variant="ghost"
              size="icon"
              className="w-10 h-10 rounded-xl bg-card-bg text-secondary hover:text-primary hover:bg-card-bg/80 transition-colors"
              aria-label="Menu"
            >
              <Bars3Icon className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
