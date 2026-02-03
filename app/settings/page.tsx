'use client';

import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { useWallet } from '@/hooks/useWalletCompat';
import {
  UserCircleIcon,
  WalletIcon,
  BellIcon,
  PaintBrushIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

const settingsSections = [
  {
    id: 'profile',
    label: 'Profile Settings',
    description: 'Edit your display name, bio, and social links',
    icon: UserCircleIcon,
    href: '/settings/profile',
  },
  {
    id: 'wallet',
    label: 'Wallet & Security',
    description: 'Manage connected wallets and security settings',
    icon: WalletIcon,
    href: '/settings/wallet',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    description: 'Configure push and email notifications',
    icon: BellIcon,
    href: '/settings/notifications',
  },
  {
    id: 'appearance',
    label: 'Appearance',
    description: 'Theme, display preferences',
    icon: PaintBrushIcon,
    href: '/settings/appearance',
  },
  {
    id: 'trading',
    label: 'Trading Preferences',
    description: 'Slippage, default amounts, fast mode',
    icon: Cog6ToothIcon,
    href: '/settings/trading',
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const { disconnect, connected } = useWallet();

  const handleLogout = async () => {
    if (connected) {
      await disconnect();
    }
    sessionStorage.removeItem('current_user');
    sessionStorage.removeItem('current_username');
    router.push('/');
  };

  return (
    <AppLayout showWallet={true} showSearch={false}>
      <div className="max-w-2xl mx-auto pb-20 md:pb-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="heading-2 mb-2">Settings</h1>
          <p className="body-sm">Manage your account and preferences</p>
        </div>

        {/* Settings List */}
        <div className="space-y-3">
          {settingsSections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => router.push(section.href)}
                className="w-full bg-card-bg hover:bg-card-hover border border-white/10 hover:border-white/20 rounded-xl p-4 transition-all text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-white/10 transition-colors">
                    <Icon className="w-6 h-6 text-text-secondary group-hover:text-white transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white mb-0.5">{section.label}</h3>
                    <p className="text-sm text-text-muted truncate">{section.description}</p>
                  </div>
                  <ChevronRightIcon className="w-5 h-5 text-text-muted group-hover:text-white transition-colors shrink-0" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Logout Button */}
        <div className="mt-8 pt-8 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full bg-metric-red/10 hover:bg-metric-red/20 border border-metric-red/30 hover:border-metric-red/50 rounded-xl p-4 transition-all text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-metric-red/10 flex items-center justify-center shrink-0">
                <ArrowRightOnRectangleIcon className="w-6 h-6 text-metric-red" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-metric-red">Log Out</h3>
                <p className="text-sm text-metric-red/70">Disconnect wallet and sign out</p>
              </div>
            </div>
          </button>
        </div>

        {/* Version Info */}
        <div className="mt-8 text-center">
          <p className="text-xs text-text-muted">Flexit v0.1.0 (Beta)</p>
        </div>
      </div>
    </AppLayout>
  );
}
