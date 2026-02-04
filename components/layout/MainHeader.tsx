'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PrivyWalletButton } from '@/components/wallet/PrivyWalletButton';
import { CommandPalette, useCommandPalette } from '@/components/search/CommandPalette';

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN HEADER — Viral Design System
// Nikita Bier: FOMO indicators, instant recognition, dopamine-optimized
// ═══════════════════════════════════════════════════════════════════════════════

interface MainHeaderProps {
  /** Number of users currently online */
  onlineCount?: number;
  /** Show search bar (hidden on mobile by default) */
  showSearch?: boolean;
  /** Show notifications bell */
  showNotifications?: boolean;
  /** Show wallet button */
  showWallet?: boolean;
  /** Additional className */
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// LIVE PULSE — FOMO indicator for online users
// ─────────────────────────────────────────────────────────────────────────────
function LivePulse({ color = '#10b981', size = 6 }: { color?: string; size?: number }) {
  return (
    <span className="relative flex" style={{ width: size, height: size }}>
      <motion.span
        className="absolute rounded-full"
        style={{
          width: size,
          height: size,
          backgroundColor: color,
        }}
        animate={{
          scale: [1, 1.8, 1],
          opacity: [0.8, 0, 0.8],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <span
        className="relative rounded-full"
        style={{
          width: size,
          height: size,
          backgroundColor: color,
        }}
      />
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ONLINE COUNTER — Animated FOMO badge
// ─────────────────────────────────────────────────────────────────────────────
function OnlineCounter({ count }: { count: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all duration-150 hover:bg-emerald-500/15"
      style={{ background: 'rgba(16, 185, 129, 0.08)' }}
    >
      <LivePulse color="#10b981" size={5} />
      <motion.span
        key={count}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-[11px] font-semibold font-mono tabular-nums"
        style={{ color: '#10b981' }}
      >
        {count.toLocaleString()}
      </motion.span>
      <span className="text-[9px] uppercase tracking-wide" style={{ color: 'rgba(16, 185, 129, 0.6)' }}>
        live
      </span>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION BELL — With animated badge
// ─────────────────────────────────────────────────────────────────────────────
function NotificationBell({ hasNew = true }: { hasNew?: boolean }) {
  const router = useRouter();

  return (
    <motion.button
      onClick={() => router.push('/notifications')}
      whileTap={{ scale: 0.95 }}
      className="relative h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-150 hover:bg-white/[0.06]"
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '0.5px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <Bell className="w-4 h-4 text-[#6A6A70] hover:text-[#E8E8E8] transition-colors" />
      <AnimatePresence>
        {hasNew && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{
              background: '#00D4FF',
              boxShadow: '0 0 8px rgba(0, 212, 255, 0.6)',
            }}
          >
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ background: '#00D4FF' }}
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH BAR — Opens Command Palette (⌘K)
// ─────────────────────────────────────────────────────────────────────────────
function SearchBar({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="w-full group"
    >
      <div
        className="flex items-center gap-3 w-full px-4 h-10 rounded-xl transition-all duration-150 hover:border-[#00D4FF]/30"
        style={{
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <Search className="w-4 h-4 text-[#6A6A70] group-hover:text-[#00D4FF] transition-colors duration-150" />
        <span className="flex-1 text-left text-[13px] text-[#6A6A70] group-hover:text-[#8A8A90] transition-colors">
          Search creators, tokens...
        </span>
        <kbd
          className="hidden md:flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors duration-150 group-hover:bg-[#00D4FF]/10 group-hover:text-[#00D4FF]"
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            color: '#5A5A60',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          ⌘K
        </kbd>
      </div>
    </motion.button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN HEADER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export function MainHeader({
  onlineCount = 0,
  showSearch = true,
  showNotifications = true,
  showWallet = true,
  className,
}: MainHeaderProps) {
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const commandPalette = useCommandPalette();

  useEffect(() => {
    setMounted(true);

    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className={cn('fixed top-0 left-0 right-0 z-40 h-14', className)}
        style={{
          background: scrolled ? 'rgba(10, 10, 15, 0.92)' : 'rgba(10, 10, 15, 0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: scrolled
            ? '0.5px solid rgba(0, 212, 255, 0.1)'
            : '0.5px solid rgba(255, 255, 255, 0.06)',
          transition: 'background 0.2s ease, border-color 0.2s ease',
        }}
      >
        <div className="h-full max-w-[1400px] mx-auto px-4 md:px-6 flex items-center justify-between gap-4">
          {/* ════ LEFT — Logo ════ */}
          <Link href="/" className="flex items-center gap-2.5 group relative">
            {/* Glow effect on hover */}
            <div className="absolute -inset-3 bg-[#00D4FF]/0 group-hover:bg-[#00D4FF]/5 rounded-2xl blur-xl transition-all duration-300 pointer-events-none" />

            {/* Logo Image */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="relative"
            >
              <Image
                src="/logo/flexit-terminal.svg"
                alt="Flexit"
                width={120}
                height={32}
                className="h-8 w-auto relative z-10"
                priority
              />
            </motion.div>

            {/* Beta badge */}
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
              style={{
                background: 'rgba(0, 212, 255, 0.1)',
                color: '#00D4FF',
                border: '1px solid rgba(0, 212, 255, 0.2)',
              }}
            >
              <Sparkles className="w-2.5 h-2.5" />
              Beta
            </motion.span>
          </Link>

          {/* ════ CENTER — Search Bar (Desktop only) ════ */}
          {showSearch && (
            <div className="hidden sm:flex flex-1 max-w-xl">
              <SearchBar onClick={commandPalette.open} />
            </div>
          )}

          {/* ════ RIGHT — Actions ════ */}
          <div className="flex items-center gap-2">
            {/* Live Online Badge — FOMO */}
            {onlineCount > 0 && <OnlineCounter count={onlineCount} />}

            {/* Mobile Search Button */}
            {showSearch && (
              <motion.button
                onClick={commandPalette.open}
                whileTap={{ scale: 0.95 }}
                className="sm:hidden h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-150 hover:bg-white/[0.06]"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '0.5px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <Search className="w-4 h-4 text-[#6A6A70]" />
              </motion.button>
            )}

            {/* Notifications Bell */}
            {showNotifications && <NotificationBell hasNew />}

            {/* Wallet Button */}
            {showWallet && mounted && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="relative"
                style={{ zIndex: 50 }}
              >
                <PrivyWalletButton />
              </motion.div>
            )}
          </div>
        </div>
      </motion.header>

      {/* Command Palette (⌘K Search) */}
      <CommandPalette isOpen={commandPalette.isOpen} onClose={commandPalette.close} />
    </>
  );
}
