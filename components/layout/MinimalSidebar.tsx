'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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

interface MinimalSidebarProps {
  className?: string;
}

export function MinimalSidebar({ className }: MinimalSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [unreadNotifications] = useState(1);

  const isActive = (path: string) => pathname === path;

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
        'fixed left-0 top-0 bottom-0 bg-app-bg border-r border-white/10',
        // Responsive width: 16 on md, 20 on lg+
        'w-16 md:w-20',
        // Hidden on small mobile (< 640px), visible from sm onwards
        'hidden sm:flex flex-col items-center z-40',
        // Responsive padding
        'py-4 md:py-6',
        className
      )}
    >
      {/* Brand Icon at Top */}
      <div className="mb-6 md:mb-8">
        <button
          onClick={() => router.push('/')}
          className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-purple-500/25"
        >
          <span className="text-white font-bold text-lg md:text-xl">F</span>
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 flex flex-col items-center space-y-3 md:space-y-4">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = active ? item.iconSolid : item.icon;

          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={cn(
                'relative rounded-xl flex items-center justify-center transition-all duration-200',
                // Responsive button size
                'w-10 h-10 md:w-12 md:h-12',
                'hover:bg-card-bg group',
                active
                  ? 'bg-card-bg text-primary shadow-lg shadow-purple-500/10'
                  : 'text-secondary hover:text-primary'
              )}
              aria-label={item.label}
            >
              <Icon className="w-5 h-5 md:w-6 md:h-6" />
              
              {/* Notification Badge */}
              {item.badge && item.badge > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-0.5 -right-0.5 md:-top-1 md:-right-1 w-4 h-4 md:w-5 md:h-5 p-0 flex items-center justify-center text-[10px] md:text-xs bg-metric-red border-2 border-app-bg"
                >
                  {item.badge}
                </Badge>
              )}

              {/* Active Indicator */}
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 md:h-8 bg-gradient-to-b from-purple-600 to-pink-600 rounded-r-full" />
              )}

              {/* Tooltip - Hidden on small screens */}
              <div className="hidden lg:block absolute left-full ml-3 md:ml-4 px-2 md:px-3 py-1 md:py-1.5 bg-card-bg border border-white/10 rounded-lg text-xs md:text-sm text-primary whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-xl">
                {item.label}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Profile Avatar at Bottom */}
      <div className="mt-auto">
        <button
          onClick={() => router.push('/profile')}
          className="relative group"
        >
          <Avatar className="h-9 w-9 md:h-11 md:w-11 cursor-pointer border-2 border-white/10 hover:border-white/20 transition-all duration-200 hover:scale-105">
            <AvatarImage
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"
              alt="Profile"
            />
            <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white font-semibold text-sm md:text-base">
              U
            </AvatarFallback>
          </Avatar>

          {/* Online Status Indicator */}
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 md:w-3 md:h-3 bg-metric-green rounded-full border-2 border-app-bg" />

          {/* Tooltip - Hidden on small screens */}
          <div className="hidden lg:block absolute left-full ml-3 md:ml-4 px-2 md:px-3 py-1 md:py-1.5 bg-card-bg border border-white/10 rounded-lg text-xs md:text-sm text-primary whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-xl">
            Profile
          </div>
        </button>
      </div>
    </aside>
  );
}

