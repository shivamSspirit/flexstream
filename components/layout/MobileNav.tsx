'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useWallet } from '@/hooks/useWalletCompat';
import { useUser } from '@/contexts/UserContext';
import {
  HomeIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  WalletIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeSolidIcon,
  MagnifyingGlassIcon as SearchSolidIcon,
  UserCircleIcon as UserSolidIcon
} from '@heroicons/react/24/solid';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <MobileNavInner />;
}

function MobileNavInner() {
  const pathname = usePathname();
  const router = useRouter();
  const { publicKey } = useWallet();
  const [createPressed, setCreatePressed] = useState(false);

  // Use global user context instead of independent fetch
  const { user: currentUser } = useUser();

  // Get the correct profile URL - always use wallet address as the source of truth
  const getProfileUrl = () => {
    if (!publicKey) return '/profile';
    return `/profile/${publicKey.toBase58()}`;
  };

  const handleWalletClick = () => {
    const profileUrl = getProfileUrl();
    router.push(`${profileUrl}?tab=wallet`);
  };

  const handleCreateClick = () => {
    setCreatePressed(true);
    // Reset after animation
    setTimeout(() => setCreatePressed(false), 300);
  };

  const navItems = [
    {
      icon: HomeIcon,
      activeIcon: HomeSolidIcon,
      path: '/',
      active: pathname === '/',
      label: 'Home'
    },
    {
      icon: MagnifyingGlassIcon,
      activeIcon: SearchSolidIcon,
      path: '/explore',
      active: pathname === '/explore',
      label: 'Explore'
    },
    {
      icon: PlusIcon,
      activeIcon: PlusIcon,
      path: '/create',
      active: pathname === '/create',
      label: 'Create',
      isSpecial: true
    },
    {
      icon: WalletIcon,
      activeIcon: WalletIcon,
      path: null,
      active: pathname.startsWith('/profile') && pathname.includes('wallet'),
      label: 'Wallet',
      isWallet: true
    },
    {
      icon: UserCircleIcon,
      activeIcon: UserSolidIcon,
      path: getProfileUrl(),
      active: pathname.startsWith('/profile'),
      label: 'Profile'
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{
        background: 'rgba(5, 5, 5, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Subtle gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(5,5,5,0.98) 0%, rgba(5,5,5,0.9) 100%)',
        }}
      />

      <div className="relative flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.active ? item.activeIcon : item.icon;

          // Special Create button - Elevated Mint design with press depth animation
          if (item.isSpecial) {
            return (
              <Link
                key={item.label}
                href={item.path!}
                prefetch={true}
                onClick={handleCreateClick}
                className="relative w-14 h-14 -mt-7 group"
                aria-label={item.label}
              >
                {/* Outer glow ring - always visible */}
                <div
                  className="absolute inset-0 rounded-full transition-all duration-200"
                  style={{
                    background: 'rgba(224, 255, 98, 0.3)',
                    filter: 'blur(12px)',
                    transform: createPressed ? 'scale(0.9)' : 'scale(1)',
                    opacity: createPressed ? 0.5 : 1,
                  }}
                />

                {/* Main button with pressed depth effect */}
                <div
                  className="relative w-full h-full rounded-full flex items-center justify-center transition-all duration-100"
                  style={{
                    background: createPressed
                      ? 'linear-gradient(180deg, #a8c840 0%, #c8e85a 100%)'
                      : 'linear-gradient(180deg, #E0FF62 0%, #c8e85a 100%)',
                    border: '2px solid rgba(224, 255, 98, 0.8)',
                    boxShadow: createPressed
                      ? 'inset 0 4px 8px rgba(0, 0, 0, 0.3), inset 0 1px 3px rgba(0, 0, 0, 0.2), 0 0 15px rgba(224, 255, 98, 0.2)'
                      : '0 4px 12px rgba(0, 0, 0, 0.4), 0 0 20px rgba(224, 255, 98, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.1)',
                    transform: createPressed ? 'scale(0.95) translateY(2px)' : 'scale(1) translateY(0)',
                  }}
                >
                  <Icon
                    className="relative z-10 w-7 h-7 stroke-[2.5] transition-all duration-100"
                    style={{
                      color: '#050505',
                      transform: createPressed ? 'scale(0.9)' : 'scale(1)',
                    }}
                  />
                </div>
              </Link>
            );
          }

          // Wallet button
          if (item.isWallet) {
            return (
              <button
                key={item.label}
                onClick={handleWalletClick}
                type="button"
                className={cn(
                  'relative flex items-center justify-center w-12 h-12 rounded-xl',
                  'transition-all duration-150 active:scale-90'
                )}
                style={{
                  background: item.active ? 'rgba(224, 255, 98, 0.1)' : 'transparent',
                  border: item.active ? '1px solid rgba(224, 255, 98, 0.3)' : '1px solid transparent',
                  color: item.active ? '#E0FF62' : 'rgba(255, 255, 255, 0.5)',
                }}
                aria-label={item.label}
              >
                <Icon className="w-6 h-6" />
                {/* Active Indicator */}
                {item.active && (
                  <div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-1 rounded-t-full"
                    style={{ background: '#E0FF62', boxShadow: '0 0 8px rgba(224, 255, 98, 0.5)' }}
                  />
                )}
              </button>
            );
          }

          // Profile nav item - Show avatar
          if (item.label === 'Profile') {
            return (
              <Link
                key={item.label}
                href={item.path!}
                prefetch={true}
                className="relative flex items-center justify-center w-12 h-12 rounded-xl transition-all active:scale-90"
                aria-label={item.label}
              >
                <Avatar
                  key={currentUser?.avatar_url || 'default'}
                  className={cn(
                    'w-9 h-9 border-2 transition-all duration-150',
                    item.active
                      ? 'border-[#E0FF62]/50'
                      : 'border-white/20 opacity-60'
                  )}
                  style={{
                    boxShadow: item.active ? '0 0 12px rgba(224, 255, 98, 0.3)' : 'none',
                  }}
                >
                  <AvatarImage
                    src={currentUser?.avatar_url ? `${currentUser.avatar_url}?t=${currentUser.updated_at || Date.now()}` : ''}
                    alt={currentUser?.display_name || 'Profile'}
                  />
                  <AvatarFallback
                    className="font-bold text-xs"
                    style={{
                      background: 'linear-gradient(135deg, #E0FF62 0%, #14b8a6 100%)',
                      color: '#050505',
                    }}
                  >
                    {currentUser?.display_name?.[0]?.toUpperCase() || currentUser?.username?.[0]?.toUpperCase() || (publicKey ? publicKey.toBase58().slice(0, 2).toUpperCase() : 'U')}
                  </AvatarFallback>
                </Avatar>
                {/* Active Indicator */}
                {item.active && (
                  <div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-1 rounded-t-full"
                    style={{ background: '#E0FF62', boxShadow: '0 0 8px rgba(224, 255, 98, 0.5)' }}
                  />
                )}
              </Link>
            );
          }

          // Regular nav items
          return (
            <Link
              key={item.label}
              href={item.path!}
              prefetch={true}
              className={cn(
                'relative flex items-center justify-center w-12 h-12 rounded-xl',
                'transition-all duration-150 active:scale-90'
              )}
              style={{
                background: item.active ? 'rgba(224, 255, 98, 0.1)' : 'transparent',
                border: item.active ? '1px solid rgba(224, 255, 98, 0.3)' : '1px solid transparent',
                color: item.active ? '#E0FF62' : 'rgba(255, 255, 255, 0.5)',
              }}
              aria-label={item.label}
            >
              <Icon className="w-6 h-6" />
              {/* Active Indicator */}
              {item.active && (
                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-1 rounded-t-full"
                  style={{ background: '#E0FF62', boxShadow: '0 0 8px rgba(224, 255, 98, 0.5)' }}
                />
              )}
            </Link>
          );
        })}
      </div>

    </nav>
  );
}
