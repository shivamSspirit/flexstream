'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useWallet } from '@/hooks/useWalletCompat';
import { useUser } from '@/contexts/UserContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  HomeIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  BellIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  MagnifyingGlassIcon as MagnifyingGlassIconSolid,
  PlusIcon as PlusIconSolid,
  BellIcon as BellIconSolid,
} from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';
import { LogoIcon } from './Logo';

// ═══════════════════════════════════════════════════════════════════════════════
// MINIMAL SIDEBAR — NOUVEAU-NOIR EDITION
// Clean, visible navigation with luxury aesthetic
// ═══════════════════════════════════════════════════════════════════════════════

interface MinimalSidebarProps {
  className?: string;
}

export function MinimalSidebar({ className }: MinimalSidebarProps) {
  const pathname = usePathname();
  const { publicKey, connected } = useWallet();
  const [unreadNotifications] = useState(1);

  // Use global user context instead of independent fetch
  const { user: currentUser } = useUser();

  const isActive = (path: string) => pathname === path;

  const getProfileUrl = () => {
    if (!publicKey) return '/profile';
    return `/profile/${publicKey.toBase58()}`;
  };

  const navItems = [
    {
      icon: HomeIcon,
      iconSolid: HomeIconSolid,
      path: '/',
      label: 'Home',
    },
    {
      icon: MagnifyingGlassIcon,
      iconSolid: MagnifyingGlassIconSolid,
      path: '/explore',
      label: 'Search',
    },
    {
      icon: PlusIcon,
      iconSolid: PlusIconSolid,
      path: '/create',
      label: 'Create',
      isSpecial: true,
    },
    {
      icon: BellIcon,
      iconSolid: BellIconSolid,
      path: '/notifications',
      label: 'Notifications',
      badge: unreadNotifications,
    },
  ];

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 bottom-0',
        'w-16 md:w-20',
        'hidden sm:flex flex-col items-center',
        'z-50',
        'py-4 md:py-6',
        className
      )}
      style={{
        background: '#0A0A0B',
        borderRight: '0.5px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      {/* Brand Logo */}
      <div className="relative mb-8 group">
        <LogoIcon size="sm" />
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl rounded-full"
          style={{ background: 'rgba(224, 255, 98, 0.2)' }}
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col items-center space-y-2">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = active ? item.iconSolid : item.icon;

          // Special Create button
          if (item.isSpecial) {
            return (
              <Link
                key={item.path}
                href={item.path}
                prefetch={true}
                className="relative rounded-xl flex items-center justify-center transition-all duration-200 w-11 h-11 md:w-12 md:h-12 group cursor-pointer hover:scale-105 active:scale-95"
                style={{
                  background: '#E0FF62',
                  boxShadow: '0 0 20px rgba(224, 255, 98, 0.3)',
                }}
                aria-label={item.label}
              >
                <Icon className="w-5 h-5 md:w-6 md:h-6 text-black stroke-[2.5]" />

                {/* Tooltip */}
                <div
                  className="hidden lg:block absolute left-full ml-4 px-3 py-1.5 rounded-lg text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity"
                  style={{
                    background: '#0D0D0E',
                    border: '0.5px solid rgba(224, 255, 98, 0.3)',
                    color: '#E0FF62',
                  }}
                >
                  {item.label}
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.path}
              href={item.path}
              prefetch={true}
              className="relative rounded-xl flex items-center justify-center transition-all duration-200 w-11 h-11 md:w-12 md:h-12 group cursor-pointer"
              style={{
                background: active ? 'rgba(224, 255, 98, 0.1)' : 'transparent',
                border: active ? '0.5px solid rgba(224, 255, 98, 0.3)' : '0.5px solid transparent',
              }}
              aria-label={item.label}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.border = '0.5px solid rgba(255, 255, 255, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.border = '0.5px solid transparent';
                }
              }}
            >
              <Icon
                className="w-5 h-5 md:w-6 md:h-6 transition-colors duration-200"
                style={{
                  color: active ? '#E0FF62' : '#A1A1AA',
                }}
              />

              {/* Notification Badge */}
              {item.badge && item.badge > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded-full"
                  style={{
                    background: '#FF6B6B',
                    color: '#FFFFFF',
                    border: '2px solid #0A0A0B',
                  }}
                >
                  {item.badge}
                </span>
              )}

              {/* Active Indicator */}
              {active && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full"
                  style={{
                    background: '#E0FF62',
                    boxShadow: '0 0 8px rgba(224, 255, 98, 0.5)',
                  }}
                />
              )}

              {/* Tooltip */}
              <div
                className="hidden lg:block absolute left-full ml-4 px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity"
                style={{
                  background: '#0D0D0E',
                  border: '0.5px solid rgba(255, 255, 255, 0.1)',
                  color: '#E5E5E5',
                }}
              >
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Profile Avatar */}
      <div className="relative mt-auto">
        {connected ? (
          <Link
            href={getProfileUrl()}
            prefetch={true}
            className="relative group cursor-pointer block"
            aria-label="Go to profile"
          >
            <div className="relative">
              <Avatar
                key={currentUser?.avatar_url || 'default'}
                className="h-10 w-10 md:h-11 md:w-11 cursor-pointer transition-all duration-200 group-hover:scale-105"
                style={{
                  border: '2px solid rgba(255, 255, 255, 0.15)',
                }}
              >
                <AvatarImage
                  src={currentUser?.avatar_url ? `${currentUser.avatar_url}?t=${currentUser.updated_at || Date.now()}` : ''}
                  alt={currentUser?.display_name || 'Profile'}
                />
                <AvatarFallback
                  style={{
                    background: 'linear-gradient(135deg, rgba(224, 255, 98, 0.2) 0%, #0D0D0E 100%)',
                    color: '#A1A1AA',
                    fontWeight: 600,
                  }}
                >
                  {currentUser?.display_name?.[0]?.toUpperCase() || currentUser?.username?.[0]?.toUpperCase() || (publicKey ? publicKey.toBase58().slice(0, 2).toUpperCase() : 'U')}
                </AvatarFallback>
              </Avatar>

              {/* Online Indicator */}
              <div
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full"
                style={{
                  background: '#E0FF62',
                  border: '2px solid #0A0A0B',
                  boxShadow: '0 0 6px rgba(224, 255, 98, 0.5)',
                }}
              />
            </div>

            {/* Tooltip */}
            <div
              className="hidden lg:block absolute left-full ml-4 px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity"
              style={{
                background: '#0D0D0E',
                border: '0.5px solid rgba(255, 255, 255, 0.1)',
                color: '#E5E5E5',
              }}
            >
              {currentUser?.display_name || 'Profile'}
            </div>
          </Link>
        ) : (
          <div className="h-10 w-10 md:h-11 md:w-11 opacity-40">
            <Avatar
              className="h-full w-full"
              style={{ border: '2px solid rgba(255, 255, 255, 0.1)' }}
            >
              <AvatarFallback
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  color: '#6B6B70',
                  fontWeight: 600,
                }}
              >
                U
              </AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>
    </aside>
  );
}
