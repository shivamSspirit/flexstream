'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  BoltIcon,
  AdjustmentsHorizontalIcon,
  CogIcon,
  UserPlusIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface UserMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserMenu({ isOpen, onClose }: UserMenuProps) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  // TODO: Add authentication state
  const authenticated = false;
  const user = null;
  const solanaWallet = null;

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  const handleSignOut = async () => {
    onClose();
    alert('Sign out functionality will be added later');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />
      
      {/* Menu */}
      <div
        ref={menuRef}
        className="fixed top-16 right-4 z-50 w-72 bg-gray-800 border border-gray-700 rounded-lg shadow-xl"
      >
        {/* User Profile Section */}
        {authenticated && (
          <div className="px-4 py-3 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src="" />
                <AvatarFallback className="bg-purple-600 text-white">
                  U
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium truncate">
                  User
                </div>
                <div className="text-gray-400 text-sm truncate font-mono">
                  Not connected
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Menu Items */}
        <div className="py-2">
          {/* Quick buy */}
          <button
            onClick={() => {
              router.push('/trade');
              onClose();
            }}
            className="w-full flex items-center justify-between px-4 py-3 text-white hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <BoltIcon className="w-5 h-5" />
              <span className="font-medium">Quick buy</span>
            </div>
            <ArrowRightOnRectangleIcon className="w-4 h-4 rotate-90" />
          </button>

          {/* Preferences */}
          <button
            onClick={() => {
              router.push('/settings');
              onClose();
            }}
            className="w-full flex items-center justify-between px-4 py-3 text-white hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <AdjustmentsHorizontalIcon className="w-5 h-5" />
              <span className="font-medium">Preferences</span>
            </div>
            <ArrowRightOnRectangleIcon className="w-4 h-4 rotate-90" />
          </button>

          {/* Settings */}
          <button
            onClick={() => {
              router.push('/settings');
              onClose();
            }}
            className="w-full flex items-center justify-between px-4 py-3 text-white hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <CogIcon className="w-5 h-5" />
              <span className="font-medium">Settings</span>
            </div>
            <ArrowRightOnRectangleIcon className="w-4 h-4 rotate-90" />
          </button>

          {/* Invite */}
          <button
            onClick={() => {
              // Handle invite functionality
              onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-gray-700 transition-colors"
          >
            <UserPlusIcon className="w-5 h-5" />
            <span className="font-medium">Invite</span>
          </button>

          {/* Log out */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-gray-700 transition-colors"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            <span className="font-medium">Log out</span>
          </button>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 px-4 py-3">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400 mb-2">
            <a href="#" className="hover:text-white transition-colors">About</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Help</a>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">© Zora Labs, 2025</span>
            <div className="flex items-center gap-3">
              {/* X (Twitter) Icon */}
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              {/* Instagram Icon */}
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323c-.875.807-2.026 1.297-3.323 1.297zm7.83-9.281H6.721c-.745 0-1.351.606-1.351 1.351v8.916c0 .745.606 1.351 1.351 1.351h9.558c.745 0 1.351-.606 1.351-1.351V9.058c0-.745-.606-1.351-1.351-1.351zM12.014 15.312c-1.811 0-3.281-1.47-3.281-3.281s1.47-3.281 3.281-3.281 3.281 1.47 3.281 3.281-1.47 3.281-3.281 3.281zm3.391-5.898c-.423 0-.766-.343-.766-.766s.343-.766.766-.766.766.343.766.766-.343.766-.766.766z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
