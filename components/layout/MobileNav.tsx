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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-t-2 border-white/10 md:hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/95 to-transparent pointer-events-none" />

      <div className="relative flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.active ? item.activeIcon : item.icon;

          // Special Create button - Neon Lime elevated design
          if (item.isSpecial) {
            return (
              <Link
                key={item.label}
                href={item.path!}
                prefetch={true}
                className="relative w-14 h-14 -mt-7 group"
                aria-label={item.label}
              >
                {/* Outer glow ring */}
                <div className="absolute inset-0 bg-neon-lime/20 rounded-full blur-xl group-hover:bg-neon-lime/30 transition-all" />

                {/* Main button */}
                <div className={cn(
                  'relative w-full h-full rounded-full flex items-center justify-center',
                  'bg-neon-lime text-black',
                  'border-2 border-neon-lime',
                  'shadow-glow-lime',
                  'group-hover:bg-[#E5FF4D] group-hover:shadow-glow-lime-lg',
                  'group-hover:scale-110 group-active:scale-95',
                  'transition-all duration-150'
                )}>
                  <Icon className="relative z-10 w-7 h-7 stroke-[2.5]" />
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
                  'transition-all duration-150 active:scale-95',
                  'border-2',
                  item.active
                    ? 'bg-white/5 text-neon-cyan border-neon-cyan/50 shadow-glow-cyan'
                    : 'text-white/50 border-transparent hover:text-white hover:bg-white/5 hover:border-white/20'
                )}
                aria-label={item.label}
              >
                <Icon className="w-6 h-6" />
                {/* Active Indicator */}
                {item.active && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-1 bg-neon-cyan rounded-t-full shadow-glow-cyan" />
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
                className="relative flex items-center justify-center w-12 h-12 rounded-xl transition-all active:scale-95"
                aria-label={item.label}
              >
                <Avatar
                  key={currentUser?.avatar_url || 'default'}
                  className={cn(
                    'w-9 h-9 border-2 transition-all duration-150',
                    item.active
                      ? 'border-neon-lime/50 shadow-glow-lime'
                      : 'border-white/20 opacity-60 hover:opacity-100 hover:border-white/40'
                  )}
                >
                  <AvatarImage
                    src={currentUser?.avatar_url ? `${currentUser.avatar_url}?t=${currentUser.updated_at || Date.now()}` : ''}
                    alt={currentUser?.display_name || 'Profile'}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-neon-purple to-neon-coral text-white font-bold text-xs">
                    {currentUser?.display_name?.[0]?.toUpperCase() || currentUser?.username?.[0]?.toUpperCase() || (publicKey ? publicKey.toBase58().slice(0, 2).toUpperCase() : 'U')}
                  </AvatarFallback>
                </Avatar>
                {/* Active Indicator */}
                {item.active && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-1 bg-neon-lime rounded-t-full shadow-glow-lime" />
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
                'transition-all duration-150 active:scale-95',
                'border-2',
                item.active
                  ? 'bg-white/5 text-neon-lime border-neon-lime/50 shadow-glow-lime'
                  : 'text-white/50 border-transparent hover:text-white hover:bg-white/5 hover:border-white/20'
              )}
              aria-label={item.label}
            >
              <Icon className="w-6 h-6" />
              {/* Active Indicator */}
              {item.active && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-1 bg-neon-lime rounded-t-full shadow-glow-lime" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
