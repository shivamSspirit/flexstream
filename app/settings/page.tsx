'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import {
  UserCircleIcon,
  BellIcon,
  ShieldCheckIcon,
  WalletIcon,
  PaintBrushIcon,
  GlobeAltIcon,
  ArrowRightIcon,
  CameraIcon
} from '@heroicons/react/24/outline';

export default function SettingsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  const handleLogout = async () => {
    alert('Logout functionality will be added later');
  };

  const settingSections = [
    {
      title: 'Profile',
      icon: UserCircleIcon,
      items: [
        { label: 'Edit Profile', sublabel: 'Update your photo and details', action: () => router.push('/profile/edit') },
        { label: 'Username', sublabel: '@alexmorrison' },
        { label: 'Bio', sublabel: 'Tell people about yourself' },
      ]
    },
    {
      title: 'Notifications',
      icon: BellIcon,
      items: [
        { label: 'Push Notifications', sublabel: 'Get notified about activity', toggle: true, value: notifications, onChange: setNotifications },
        { label: 'Email Updates', sublabel: 'Receive updates via email', toggle: true, value: emailUpdates, onChange: setEmailUpdates },
        { label: 'Notification Preferences', sublabel: 'Customize what you see' },
      ]
    },
    {
      title: 'Wallet & Security',
      icon: WalletIcon,
      items: [
        { label: 'Connected Wallet', sublabel: '0x1234...5678' },
        { label: 'Two-Factor Authentication', sublabel: 'Add extra security' },
        { label: 'Privacy Settings', sublabel: 'Control your data' },
      ]
    },
    {
      title: 'Appearance',
      icon: PaintBrushIcon,
      items: [
        { label: 'Dark Mode', sublabel: 'Use dark theme', toggle: true, value: darkMode, onChange: setDarkMode },
        { label: 'Language', sublabel: 'English' },
      ]
    },
    {
      title: 'About',
      icon: GlobeAltIcon,
      items: [
        { label: 'Terms of Service', action: () => {} },
        { label: 'Privacy Policy', action: () => {} },
        { label: 'Help Center', action: () => {} },
        { label: 'Version', sublabel: 'v1.0.0' },
      ]
    },
  ];

  return (
    <AppLayout showWallet={true} showSearch={true}>
      <div className="max-w-3xl mx-auto pb-20 md:pb-6">
        {/* Header with Profile */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary mb-4 sm:mb-6">Settings</h1>

          {/* Profile Card */}
          <div className="bg-gradient-to-br from-card-bg to-card-bg/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/5">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative shrink-0">
                <Avatar className="h-16 w-16 sm:h-20 sm:w-20 ring-2 sm:ring-4 ring-white/10">
                  <AvatarImage src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop" />
                  <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white font-bold text-xl sm:text-2xl">
                    A
                  </AvatarFallback>
                </Avatar>
                <button className="absolute bottom-0 right-0 w-6 h-6 sm:w-8 sm:h-8 bg-purple-600 hover:bg-purple-700 rounded-full flex items-center justify-center transition-colors">
                  <CameraIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-primary mb-0.5 sm:mb-1 truncate">Alex Morrison</h2>
                <p className="text-secondary text-xs sm:text-sm mb-2 sm:mb-3 truncate">@alexmorrison</p>
                <Button
                  size="sm"
                  className="flexstream-gradient text-white text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4"
                  onClick={() => router.push('/profile/edit')}
                >
                  Edit Profile
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-4 sm:space-y-6">
          {settingSections.map((section, idx) => (
            <div key={idx}>
              {/* Section Header */}
              <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                <section.icon className="w-4 h-4 sm:w-5 sm:h-5 text-secondary" />
                <h3 className="text-base sm:text-lg font-semibold text-primary">{section.title}</h3>
              </div>

              {/* Section Items */}
              <div className="space-y-1.5 sm:space-y-2">
                {section.items.map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    onClick={'action' in item ? item.action : undefined}
                    className={`bg-card-bg rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/5 ${
                      'action' in item ? 'hover:border-white/10 cursor-pointer active:scale-[0.98]' : ''
                    } transition-all`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-primary font-medium mb-0.5 text-sm sm:text-base">{item.label}</p>
                        {item.sublabel && (
                          <p className="text-secondary text-xs sm:text-sm truncate">{item.sublabel}</p>
                        )}
                      </div>
                      {'toggle' in item && item.onChange ? (
                        <Switch
                          checked={item.value}
                          onCheckedChange={item.onChange}
                          className="shrink-0"
                        />
                      ) : 'action' in item ? (
                        <ArrowRightIcon className="w-4 h-4 sm:w-5 sm:h-5 text-secondary shrink-0" />
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Danger Zone */}
        <div className="mt-6 sm:mt-8">
          <div className="bg-red-900/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-red-500/20">
            <h3 className="text-base sm:text-lg font-semibold text-red-400 mb-3 sm:mb-4">Danger Zone</h3>
            <div className="space-y-2 sm:space-y-3">
              <Button
                variant="outline"
                className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 h-10 sm:h-11 text-sm sm:text-base"
                onClick={handleLogout}
              >
                Log Out
              </Button>
              <Button
                variant="outline"
                className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 h-10 sm:h-11 text-sm sm:text-base"
                onClick={() => {
                  if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                    console.log('Delete account confirmed');
                  }
                }}
              >
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
