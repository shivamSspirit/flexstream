'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet, UnifiedWalletButton } from '@jup-ag/wallet-adapter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  MagnifyingGlassIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { Logo } from './Logo';

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
  const { connected, publicKey } = useWallet();
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);

  // Only render wallet-dependent UI after mount to avoid hydration errors
  useEffect(() => {
    setMounted(true);
  }, []);

  // Debug wallet connection state
  useEffect(() => {
    if (mounted) {
      console.log('🔍 [Wallet] UniversalHeader - Connected:', connected);
      console.log('🔍 [Wallet] UniversalHeader - PublicKey:', publicKey?.toBase58());
    }
  }, [connected, publicKey, mounted]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explore?q=${encodeURIComponent(searchQuery)}`);
    }
  };


  return (
    <header
      className={cn(
        'sticky top-0 z-50 bg-app-bg/95 backdrop-blur-xl border-b border-white/10 shadow-lg',
        className
      )}
    >
      <div className="max-w-[1920px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          {/* Logo - Mobile only (desktop has sidebar) */}
          <div className="flex items-center md:hidden">
            <Logo size="md" showText={false} />
          </div>

          {/* Search Bar - Mobile First */}
          <div className="flex items-center gap-2 sm:gap-4 md:gap-6 flex-1">
            {showSearch && (
              <div className="flex-1 max-w-xs sm:max-w-sm md:max-w-md">
                <form onSubmit={handleSearch}>
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-text-muted pointer-events-none" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search..."
                      className="w-full pl-9 sm:pl-12 pr-3 sm:pr-4 h-9 sm:h-10 bg-card-bg border-white/10 rounded-full text-text-primary text-sm sm:text-base placeholder:text-text-muted focus:border-accent-purple/50 focus:ring-2 focus:ring-accent-purple/20 hover:border-white/20 transition-all font-medium"
                    />
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Wallet Button - Simple & Clean */}
            {showWallet && mounted && (
              <div className="relative scale-75 sm:scale-90 md:scale-100 origin-right" data-wallet-button>
                <UnifiedWalletButton />
              </div>
            )}

            {/* Hamburger Menu */}
            <Button
              onClick={onMenuClick}
              variant="ghost"
              size="icon"
              className="btn-icon w-9 h-9 sm:w-10 sm:h-10"
              aria-label="Menu"
            >
              <Bars3Icon className="w-5 h-5 sm:w-6 sm:h-6" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
