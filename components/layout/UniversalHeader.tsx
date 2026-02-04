'use client';

import { useState, useEffect } from 'react';
import { Search, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from './Logo';
import { PrivyWalletButton } from '@/components/wallet/PrivyWalletButton';

// ═══════════════════════════════════════════════════════════════════════════
// UniversalHeader — Terminal Command Center
// Cyberpunk terminal aesthetic. Neon green accents, dark immersive backdrop.
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
        background: 'rgba(13, 13, 13, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0, 255, 159, 0.1)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5), 0 1px 0 rgba(0, 255, 159, 0.05) inset',
      }}
    >
      {/* Terminal accent line at top */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(0, 255, 159, 0.5) 20%, rgba(0, 255, 159, 0.8) 50%, rgba(0, 255, 159, 0.5) 80%, transparent)',
        }}
      />

      <div className="max-w-[1400px] mx-auto">
        <div className="px-4 md:px-6">
          <div className="flex items-center justify-between h-16 gap-4">

            {/* ════════════════════════════════════════════════════════════
                LEFT — Logo with Terminal Glow
                Mobile: Icon only | Desktop: Full wordmark
                ════════════════════════════════════════════════════════════ */}
            <div className="flex items-center shrink-0">
              {/* Mobile: Icon only */}
              <div className="md:hidden relative group">
                <div
                  className="absolute -inset-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: 'radial-gradient(circle, rgba(0, 255, 159, 0.15) 0%, transparent 70%)',
                  }}
                />
                <Logo size="sm" variant="icon" />
              </div>
              {/* Desktop: Full wordmark with glow */}
              <div className="hidden md:block relative group">
                <div
                  className="absolute -inset-3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: 'radial-gradient(ellipse 150% 100% at center, rgba(0, 255, 159, 0.12) 0%, transparent 60%)',
                  }}
                />
                <Logo size="md" variant="wordmark" />
              </div>
            </div>

            {/* ════════════════════════════════════════════════════════════
                CENTER — Terminal Search Bar
                ════════════════════════════════════════════════════════════ */}
            {showSearch && (
              <div className="hidden sm:flex flex-1 max-w-xl">
                <button
                  onClick={onSearchClick}
                  className="w-full group"
                >
                  <div
                    className="flex items-center gap-3 w-full px-4 h-10 rounded-lg transition-all duration-200"
                    style={{
                      background: 'rgba(0, 255, 159, 0.03)',
                      border: '1px solid rgba(0, 255, 159, 0.15)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(0, 255, 159, 0.06)';
                      e.currentTarget.style.borderColor = 'rgba(0, 255, 159, 0.3)';
                      e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 159, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(0, 255, 159, 0.03)';
                      e.currentTarget.style.borderColor = 'rgba(0, 255, 159, 0.15)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <Search
                      className="w-4 h-4 transition-colors duration-200"
                      style={{ color: 'rgba(0, 255, 159, 0.5)' }}
                    />
                    <span
                      className="flex-1 text-left text-[13px] font-mono transition-colors duration-200"
                      style={{ color: 'rgba(0, 255, 159, 0.4)' }}
                    >
                      search creators, tokens...
                    </span>
                    <kbd
                      className="hidden md:flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium"
                      style={{
                        background: 'rgba(0, 255, 159, 0.08)',
                        color: 'rgba(0, 255, 159, 0.6)',
                        border: '1px solid rgba(0, 255, 159, 0.15)',
                      }}
                    >
                      ⌘K
                    </kbd>
                  </div>
                </button>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════
                RIGHT — Terminal Controls (Notifications + Wallet)
                ════════════════════════════════════════════════════════════ */}
            <div className="flex items-center gap-3">
              {/* Notifications - Terminal Style */}
              <button
                className="relative h-9 w-9 rounded-lg flex items-center justify-center transition-all duration-200 group"
                style={{
                  background: 'rgba(0, 255, 159, 0.03)',
                  border: '1px solid rgba(0, 255, 159, 0.15)',
                  color: 'rgba(0, 255, 159, 0.5)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 255, 159, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(0, 255, 159, 0.3)';
                  e.currentTarget.style.color = '#00FF9F';
                  e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 255, 159, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 255, 159, 0.03)';
                  e.currentTarget.style.borderColor = 'rgba(0, 255, 159, 0.15)';
                  e.currentTarget.style.color = 'rgba(0, 255, 159, 0.5)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <Bell className="w-4 h-4" />
                {/* Notification dot - Pulsing terminal green */}
                <div
                  className="absolute top-1 right-1 w-2 h-2 rounded-full animate-pulse"
                  style={{
                    background: '#00FF9F',
                    boxShadow: '0 0 8px #00FF9F',
                  }}
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
