'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

interface NavigationItem {
  label: string;
  href: string;
  icon?: string;
}

const navigationItems: NavigationItem[] = [
  { label: 'Feed', href: '/feed', icon: '📱' },
  { label: 'Trade', href: '/trading', icon: '💱' },
  { label: 'Leaderboard', href: '/leaderboard', icon: '🏆' },
  { label: 'Profile', href: '/profile', icon: '👤' },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <>
      {/* Header Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#0A0A0F]/90 backdrop-blur-xl">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo with hover glow effect */}
            <Link
              href="/"
              className="group flex items-center relative"
            >
              {/* Subtle glow on hover */}
              <div className="absolute -inset-2 bg-gradient-to-r from-[#00D4FF]/0 via-[#8B5CF6]/0 to-[#A855F7]/0 group-hover:from-[#00D4FF]/10 group-hover:via-[#8B5CF6]/10 group-hover:to-[#A855F7]/10 rounded-xl blur-xl transition-all duration-300" />

              <Image
                src="/logo/flexit-terminal-minimal.svg"
                alt="FlexIt"
                width={120}
                height={40}
                className="h-8 w-auto relative z-10 transition-transform duration-150 group-hover:scale-[1.02]"
                priority
              />
            </Link>

            {/* Desktop Navigation - Viral dopamine-optimized */}
            <nav className="hidden md:flex items-center gap-1">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative px-4 py-2 rounded-lg font-medium text-sm transition-all duration-150 ${
                      isActive
                        ? 'text-white'
                        : 'text-[#6B7B8E] hover:text-white'
                    }`}
                  >
                    {/* Active indicator glow */}
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-[#00D4FF]/15 to-[#8B5CF6]/15 rounded-lg" />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      <span className="text-base">{item.icon}</span>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Menu Button - 150ms snappy animation */}
            <button
              onClick={toggleMenu}
              className="md:hidden relative w-10 h-10 flex items-center justify-center rounded-xl bg-[#12121A] hover:bg-[#1A1A24] transition-all duration-150 border border-white/5"
              aria-label="Toggle menu"
            >
              <div className="w-5 h-4 flex flex-col justify-between">
                <span
                  className={`w-full h-0.5 bg-gradient-to-r from-[#00D4FF] to-[#8B5CF6] rounded-full transition-all duration-150 origin-center ${
                    isMenuOpen ? 'rotate-45 translate-y-[7px]' : ''
                  }`}
                />
                <span
                  className={`w-full h-0.5 bg-gradient-to-r from-[#00D4FF] to-[#8B5CF6] rounded-full transition-all duration-150 ${
                    isMenuOpen ? 'opacity-0 scale-0' : ''
                  }`}
                />
                <span
                  className={`w-full h-0.5 bg-gradient-to-r from-[#00D4FF] to-[#8B5CF6] rounded-full transition-all duration-150 origin-center ${
                    isMenuOpen ? '-rotate-45 -translate-y-[7px]' : ''
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay - Fast 150ms transitions */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-all duration-150 ${
          isMenuOpen ? 'visible' : 'invisible'
        }`}
      >
        {/* Backdrop with blur */}
        <div
          className={`absolute inset-0 bg-[#0A0A0F]/90 backdrop-blur-md transition-opacity duration-150 ${
            isMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={toggleMenu}
        />

        {/* Menu Panel - Slide in from right */}
        <div
          className={`absolute top-16 right-0 w-72 bg-[#12121A] border-l border-b border-white/5 shadow-2xl shadow-black/50 transition-transform duration-150 ${
            isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Top gradient accent */}
          <div className="h-[2px] bg-gradient-to-r from-[#00D4FF] via-[#8B5CF6] to-[#A855F7]" />

          <nav className="relative p-4 space-y-2">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={toggleMenu}
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-150 ${
                    isActive
                      ? 'text-white'
                      : 'text-[#6B7B8E] hover:text-white'
                  }`}
                >
                  {/* Active state glow */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-[#00D4FF]/15 to-[#8B5CF6]/15 rounded-xl border border-[#00D4FF]/20" />
                  )}
                  <span className="relative z-10 text-xl">{item.icon}</span>
                  <span className="relative z-10">{item.label}</span>
                  {/* Arrow indicator for active */}
                  {isActive && (
                    <span className="relative z-10 ml-auto text-[#00D4FF]">→</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom gradient accent */}
          <div className="h-[2px] bg-gradient-to-r from-[#00D4FF] via-[#8B5CF6] to-[#A855F7] opacity-50" />
        </div>
      </div>
    </>
  );
}
