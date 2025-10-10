'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useWallet } from '@solana/wallet-adapter-react';
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
  const { signOut } = useAuth();
  const { disconnect, connected } = useWallet();
  const [notifications, setNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  const handleLogout = async () => {
    try {
      // Disconnect wallet if connected
      if (connected) {
        await disconnect();
      }
      // Sign out from Clerk
      await signOut();
      // Redirect to signin page
      router.push('/auth/signin');
    } catch (error) {
      console.error('Logout error:', error);
    }
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
      <div className="pb-20 md:pb-6 -mx-4 sm:mx-0">
        {/* Header with Profile */}
        <div className="px-4 sm:px-0 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-6">Settings</h1>
          
          {/* Profile Card */}
          <div className="bg-gradient-to-br from-card-bg to-card-bg/50 rounded-2xl p-6 border border-white/5">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-20 w-20 ring-4 ring-white/10">
                  <AvatarImage src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop" />
                  <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white font-bold text-2xl">
                    A
                  </AvatarFallback>
                </Avatar>
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-purple-600 hover:bg-purple-700 rounded-full flex items-center justify-center transition-colors">
                  <CameraIcon className="w-4 h-4 text-white" />
                </button>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-primary mb-1">Alex Morrison</h2>
                <p className="text-secondary text-sm mb-3">@alexmorrison</p>
                <Button 
                  size="sm" 
                  className="flexstream-gradient text-white"
                  onClick={() => router.push('/profile/edit')}
                >
                  Edit Profile
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {settingSections.map((section, idx) => (
            <div key={idx} className="px-4 sm:px-0">
              {/* Section Header */}
              <div className="flex items-center gap-2 mb-3">
                <section.icon className="w-5 h-5 text-secondary" />
                <h3 className="text-lg font-semibold text-primary">{section.title}</h3>
              </div>

              {/* Section Items */}
              <div className="space-y-2">
                {section.items.map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    onClick={'action' in item ? item.action : undefined}
                    className={`bg-card-bg rounded-xl p-4 border border-white/5 ${
                      'action' in item ? 'hover:border-white/10 cursor-pointer' : ''
                    } transition-all`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-primary font-medium mb-0.5">{item.label}</p>
                        {item.sublabel && (
                          <p className="text-secondary text-sm">{item.sublabel}</p>
                        )}
                      </div>
                      {'toggle' in item && item.onChange ? (
                        <Switch
                          checked={item.value}
                          onCheckedChange={item.onChange}
                        />
                      ) : 'action' in item ? (
                        <ArrowRightIcon className="w-5 h-5 text-secondary" />
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Danger Zone */}
        <div className="px-4 sm:px-0 mt-8">
          <div className="bg-red-900/10 rounded-2xl p-6 border border-red-500/20">
            <h3 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h3>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                onClick={handleLogout}
              >
                Log Out
              </Button>
              <Button 
                variant="outline" 
                className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
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
