'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
import { LogoIcon } from './Logo';

interface MinimalSidebarProps {
  className?: string;
}

export function MinimalSidebar({ className }: MinimalSidebarProps) {
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
        'hidden sm:flex flex-col items-center',
        // Higher z-index to be above everything except modals
        'z-50',
        // Responsive padding
        'py-4 md:py-6',
        className
      )}
      style={{ zIndex: 50 }}
    >
      {/* Brand Logo at Top */}
      <div className="mb-6 md:mb-8">
        <LogoIcon size="sm" />
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 flex flex-col items-center space-y-3 md:space-y-4">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = active ? item.iconSolid : item.icon;

          return (
            <Link
              key={item.path}
              href={item.path}
              prefetch={true}
              className={cn(
                'relative rounded-xl flex items-center justify-center transition-all duration-200',
                // Responsive button size
                'w-10 h-10 md:w-12 md:h-12',
                'group cursor-pointer',
                active
                  ? 'bg-gradient-to-br from-white/10 to-white/5 text-white shadow-lg shadow-white/5 backdrop-blur-sm'
                  : 'text-white/60 hover:text-white hover:bg-gradient-to-br hover:from-white/5 hover:to-transparent'
              )}
              aria-label={item.label}
            >
              <Icon className="w-5 h-5 md:w-6 md:h-6 relative z-10" />

              {/* Gradient overlay on hover */}
              {!active && (
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-600/0 to-pink-600/0 group-hover:from-purple-600/10 group-hover:to-pink-600/10 transition-all duration-300" />
              )}

              {/* Notification Badge */}
              {item.badge && item.badge > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-0.5 -right-0.5 md:-top-1 md:-right-1 w-4 h-4 md:w-5 md:h-5 p-0 flex items-center justify-center text-[10px] md:text-xs bg-red-500 border-2 border-app-bg z-10"
                >
                  {item.badge}
                </Badge>
              )}

              {/* Active Indicator */}
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 md:h-8 bg-gradient-to-b from-white to-white/50 rounded-r-full shadow-lg shadow-white/20" />
              )}

              {/* Tooltip - Hidden on small screens */}
              <div className="hidden lg:block absolute left-full ml-3 md:ml-4 px-2 md:px-3 py-1 md:py-1.5 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-lg text-xs md:text-sm text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-xl">
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Profile Avatar at Bottom */}
      <div className="mt-auto">
        <Link
          href="/profile"
          prefetch={true}
          className="relative group cursor-pointer block"
          aria-label="Go to profile"
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
        </Link>
      </div>
    </aside>
  );
}

