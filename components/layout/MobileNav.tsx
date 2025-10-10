'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
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
  const router = useRouter();
  const pathname = usePathname();
  const { connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();

  const handleWalletClick = async () => {
    if (connected) {
      await disconnect();
    } else {
      setVisible(true);
    }
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
      active: connected,
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
              <button
                key={item.label}
                onClick={() => router.push(item.path!)}
                className="relative w-12 h-12 -mt-6 flexstream-gradient rounded-full flex items-center justify-center shadow-lg shadow-purple-500/50 hover:scale-110 transition-transform"
                aria-label={item.label}
              >
                <Icon className="w-6 h-6 text-white stroke-[2.5]" />
              </button>
            );
          }

          // Wallet button
          if (item.isWallet) {
            return (
              <button
                key={item.label}
                onClick={handleWalletClick}
                className={`relative flex items-center justify-center w-12 h-12 rounded-xl transition-all ${
                  connected
                    ? 'text-primary bg-purple-500/20'
                    : 'text-secondary hover:text-primary hover:bg-white/5'
                }`}
                aria-label={item.label}
              >
                <Icon className="w-6 h-6" />
                {connected && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-metric-green rounded-full ring-2 ring-app-bg" />
                )}
              </button>
            );
          }

          // Regular nav items
          return (
            <button
              key={item.label}
              onClick={() => router.push(item.path!)}
              className={`relative flex items-center justify-center w-12 h-12 rounded-xl transition-colors ${
                item.active
                  ? 'text-primary'
                  : 'text-secondary hover:text-primary hover:bg-white/5'
              }`}
              aria-label={item.label}
            >
              <Icon className="w-6 h-6" />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
