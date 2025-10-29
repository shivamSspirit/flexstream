'use client';

import { useState, useRef, useEffect } from 'react';
import { useWallet } from '@jup-ag/wallet-adapter';
import { useRouter } from 'next/navigation';
import { 
  Settings, 
  LogOut, 
  ChevronDown,
  UserCircle
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function UserDropdown() {
  const { publicKey, connected, disconnect } = useWallet();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const address = publicKey ? publicKey.toBase58() : '';
  const addressLabel = address ? `${address.slice(0, 4)}...${address.slice(-4)}` : 'Not connected';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDisconnect = async () => {
    try {
      await disconnect();
      router.push('/');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  const menuItems = [
    {
      icon: UserCircle,
      label: 'Profile',
      onClick: () => {
        router.push('/profile');
        setIsOpen(false);
      }
    },
    {
      icon: Settings,
      label: 'Settings',
      onClick: () => {
        router.push('/settings');
        setIsOpen(false);
      }
    },
    ...(connected
      ? [{
          icon: LogOut,
          label: 'Disconnect',
          onClick: handleDisconnect,
          className: 'text-red-400 hover:text-red-300 hover:bg-red-900/20'
        }]
      : [])
  ];

  if (!connected) {
    // When not connected, render a minimal placeholder (connect handled elsewhere)
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 hover:bg-gray-800 rounded-lg px-2 py-1 transition-colors"
      >
        <Avatar className="h-8 w-8">
          <AvatarImage src={''} alt={addressLabel} />
          <AvatarFallback>
            {address ? address.slice(0, 2).toUpperCase() : 'W'}
          </AvatarFallback>
        </Avatar>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-white">
            {addressLabel}
          </p>
          <p className="text-xs text-gray-400">
            Connected
          </p>
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
          <div className="py-2">
            {/* User Info Header */}
            <div className="px-4 py-3 border-b border-gray-700">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={''} alt={addressLabel} />
                  <AvatarFallback>
                    {address ? address.slice(0, 2).toUpperCase() : 'W'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-white">
                    {addressLabel}
                  </p>
                  <p className="text-xs text-gray-400">
                    Wallet connected
                  </p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              {menuItems.map((item, index) => (
                <button
                  key={index}
                  onClick={item.onClick}
                  className={`w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors ${item.className || ''}`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
