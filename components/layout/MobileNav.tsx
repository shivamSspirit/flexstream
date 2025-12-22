'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useWallet } from '@jup-ag/wallet-adapter';
import { useQuery } from '@tanstack/react-query';
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
  const { publicKey, connected } = useWallet();

  // Fetch current user data with real-time updates
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser', publicKey?.toBase58()],
    queryFn: async () => {
      if (!publicKey) return null;
      const response = await fetch(`/api/users/by-wallet?wallet=${publicKey.toBase58()}`);
      if (!response.ok) return null;
      const result = await response.json();
      return result.success ? result.data : null;
    },
    enabled: !!publicKey && connected,
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    staleTime: 1000, // Consider data stale after 1 second for faster updates
  });

  const handleWalletClick = () => {
    // Navigate to user's profile wallet tab
    if (currentUser?.username) {
      router.push(`/profile/${currentUser.username}?tab=wallet`);
    } else {
      router.push('/profile/edit'); // Redirect to edit if no username
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
      active: pathname.startsWith('/profile') && pathname.includes('wallet'),
      label: 'Wallet',
      isWallet: true
    },
    {
      icon: UserCircleIcon,
      activeIcon: UserSolidIcon,
      path: currentUser?.username ? `/profile/${currentUser.username}` : '/profile/edit',
      active: pathname.startsWith('/profile'),
      label: 'Profile'
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-app-bg/95 backdrop-blur-lg border-t border-white/10 md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item, index) => {
          const Icon = item.active ? item.activeIcon : item.icon;

          // Special styling for Create button (elevated) - Vibrant Sky Blue Design
          if (item.isSpecial) {
            return (
              <Link
                key={item.label}
                href={item.path!}
                prefetch={true}
                className="relative w-14 h-14 -mt-7 group"
                aria-label={item.label}
              >
                {/* Main button - Vibrant sky blue border */}
                <div className="relative w-full h-full bg-gradient-to-br from-gray-700/40 via-gray-800/60 to-gray-900/80 backdrop-blur-xl rounded-full flex items-center justify-center border-[3px] border-sky-400 group-hover:scale-110 group-active:scale-95 group-hover:border-sky-300 group-hover:shadow-[0_0_20px_rgba(56,189,248,0.4)] transition-all duration-300 ease-out">
                  {/* Top highlight (glass shine) */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-transparent rounded-full opacity-50"></div>

                  {/* Icon - Simple white */}
                  <Icon className="relative z-10 w-7 h-7 text-white stroke-[2.5]" />
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
