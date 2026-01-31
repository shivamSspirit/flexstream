'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from './Logo';
import { PrivyWalletButton } from '@/components/wallet/PrivyWalletButton';

// ═══════════════════════════════════════════════════════════════════════════
// UniversalHeader — The Obsidian Vault
// Clean, minimal, premium. Search centered, actions on right.
// ═══════════════════════════════════════════════════════════════════════════

interface UniversalHeaderProps {
  className?: string;
  onMenuClick?: () => void;
  showWallet?: boolean;
  showSearch?: boolean;
  onSearchClick?: () => void;
}

export function UniversalHeader({
  className,
  onMenuClick,
  showWallet = true,
  showSearch = true,
  onSearchClick,
}: UniversalHeaderProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-50',
        className
      )}
      style={{
        background: 'rgba(5, 5, 5, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '0.5px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      <div className="max-w-[1400px] mx-auto">
        <div className="px-4 md:px-6">
          <div className="flex items-center justify-between h-14 gap-4">

            {/* ════════════════════════════════════════════════════════════
                LEFT — Logo (mobile only)
                ════════════════════════════════════════════════════════════ */}
            <div className="flex items-center md:hidden">
              <Logo size="sm" showText={false} />
            </div>

            {/* ════════════════════════════════════════════════════════════
                CENTER — Search Bar (Premium, Visible)
                ════════════════════════════════════════════════════════════ */}
            {showSearch && (
              <div className="hidden sm:flex flex-1 max-w-xl">
                <button
                  onClick={onSearchClick}
                  className="w-full group"
                >
                  <div
                    className="flex items-center gap-3 w-full px-4 h-10 rounded-xl transition-all duration-300"
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.borderColor = 'rgba(224, 255, 98, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    }}
                  >
                    <Search
                      className="w-4 h-4 transition-colors duration-300"
                      style={{ color: '#8A8A90' }}
                    />
                    <span
                      className="flex-1 text-left text-[13px] transition-colors duration-300"
                      style={{ color: '#8A8A90' }}
                    >
                      Search creators, tokens...
                    </span>
                    <kbd
                      className="hidden md:flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium"
                      style={{
                        background: 'rgba(255, 255, 255, 0.06)',
                        color: '#6A6A70',
                        fontFamily: "'IBM Plex Mono', monospace",
                      }}
                    >
                      ⌘K
                    </kbd>
                  </div>
                </button>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════
                RIGHT — Notifications + Wallet
                ════════════════════════════════════════════════════════════ */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <button
                className="relative h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-300"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '0.5px solid rgba(255, 255, 255, 0.08)',
                  color: '#6A6A70',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.color = '#E8E8E8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  e.currentTarget.style.color = '#6A6A70';
                }}
              >
                <Bell className="w-4 h-4" />
                {/* Notification dot */}
                <div
                  className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                  style={{ background: '#E0FF62' }}
                />
              </button>

              {/* Wallet */}
              {showWallet && mounted && (
                <div className="relative" style={{ zIndex: 50 }}>
                  <PrivyWalletButton />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
