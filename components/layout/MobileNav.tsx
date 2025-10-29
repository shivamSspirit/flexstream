'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleWalletClick = () => {
    // Navigate to profile wallet tab
    router.push('/profile?tab=wallet');
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
      path: '/profile', 
      active: pathname.startsWith('/profile'),
      label: 'Profile'
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-app-bg/95 backdrop-blur-lg border-t border-white/10 md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item, index) => {
          const Icon = item.active ? item.activeIcon : item.icon;

          // Special styling for Create button (elevated)
          if (item.isSpecial) {
            return (
              <Link
                key={item.label}
                href={item.path!}
                prefetch={true}
                className="relative w-12 h-12 -mt-6 bg-gradient-to-br from-accent-purple to-accent-pink rounded-full flex items-center justify-center shadow-lg shadow-purple-500/50 hover:scale-110 active:scale-95 transition-transform"
                aria-label={item.label}
              >
                <Icon className="w-6 h-6 text-white stroke-[2.5]" />
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
                className={`relative flex items-center justify-center w-12 h-12 rounded-xl transition-all active:scale-95 ${
                  item.active
                    ? 'bg-gradient-to-br from-white/10 to-white/5 text-white shadow-lg shadow-white/5'
                    : 'text-white/60 hover:text-white hover:bg-gradient-to-br hover:from-white/5 hover:to-transparent'
                }`}
                aria-label={item.label}
              >
                <Icon className="w-6 h-6" />
                {/* Active Indicator */}
                {item.active && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-1 bg-gradient-to-r from-white to-white/50 rounded-t-full shadow-lg shadow-white/20" />
                )}
              </button>
            );
          }

          // Regular nav items
          return (
            <Link
              key={item.label}
              href={item.path!}
              prefetch={true}
              className={`relative flex items-center justify-center w-12 h-12 rounded-xl transition-all active:scale-95 ${
                item.active
                  ? 'bg-gradient-to-br from-white/10 to-white/5 text-white shadow-lg shadow-white/5'
                  : 'text-white/60 hover:text-white hover:bg-gradient-to-br hover:from-white/5 hover:to-transparent'
              }`}
              aria-label={item.label}
            >
              <Icon className="w-6 h-6" />
              {/* Active Indicator */}
              {item.active && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-1 bg-gradient-to-r from-white to-white/50 rounded-t-full shadow-lg shadow-white/20" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
