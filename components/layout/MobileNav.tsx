'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Home, Search, Plus, User, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function MobileNav() {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { icon: Home, label: 'Home', path: '/', active: pathname === '/' },
    { icon: Search, label: 'Discover', path: '/discover', active: pathname === '/discover' },
    { icon: Plus, label: 'Create', path: '/create', active: pathname === '/create' },
    { icon: TrendingUp, label: 'Leaderboard', path: '/leaderboard', active: pathname === '/leaderboard' },
    { icon: User, label: 'Profile', path: '/profile', active: pathname.startsWith('/profile') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-800 md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => (
          <Button
            key={item.path}
            variant="ghost"
            size="sm"
            onClick={() => router.push(item.path)}
            className={`flex flex-col items-center space-y-1 px-3 py-2 ${
              item.active
                ? 'text-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs">{item.label}</span>
          </Button>
        ))}
      </div>
    </nav>
  );
}
