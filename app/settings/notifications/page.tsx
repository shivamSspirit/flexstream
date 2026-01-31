'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { ArrowLeftIcon, BellIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export default function NotificationSettingsPage() {
  const router = useRouter();

  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: 'trades',
      label: 'Trade Activity',
      description: 'When someone buys or sells your tokens',
      enabled: true,
    },
    {
      id: 'likes',
      label: 'Likes',
      description: 'When someone likes your posts',
      enabled: true,
    },
    {
      id: 'comments',
      label: 'Comments',
      description: 'When someone comments on your posts',
      enabled: true,
    },
    {
      id: 'follows',
      label: 'New Followers',
      description: 'When someone follows you',
      enabled: true,
    },
    {
      id: 'mentions',
      label: 'Mentions',
      description: 'When someone mentions you',
      enabled: true,
    },
    {
      id: 'price_alerts',
      label: 'Price Alerts',
      description: 'Significant price movements on your tokens',
      enabled: false,
    },
    {
      id: 'earnings',
      label: 'Earnings Updates',
      description: 'Daily/weekly earnings summaries',
      enabled: true,
    },
    {
      id: 'predictions',
      label: 'Prediction Results',
      description: 'When predictions you bet on resolve',
      enabled: true,
    },
    {
      id: 'live',
      label: 'Creator Live Streams',
      description: 'When creators you follow go live',
      enabled: false,
    },
  ]);

  const toggleSetting = (id: string) => {
    setSettings(prev =>
      prev.map(s =>
        s.id === id ? { ...s, enabled: !s.enabled } : s
      )
    );
  };

  const [pushEnabled, setPushEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);

  return (
    <AppLayout showWallet={true} showSearch={false}>
      <div className="max-w-2xl mx-auto pb-20 md:pb-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="heading-3">Notifications</h1>
            <p className="body-sm">Choose what you want to be notified about</p>
          </div>
        </div>

        {/* Notification Channels */}
        <div className="mb-8">
          <h2 className="font-semibold text-white mb-4">Notification Channels</h2>
          <div className="space-y-3">
            {/* Push Notifications */}
            <div className="bg-card-bg border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">Push Notifications</p>
                  <p className="text-sm text-text-muted">Receive notifications in your browser</p>
                </div>
                <button
                  onClick={() => setPushEnabled(!pushEnabled)}
                  className={cn(
                    'w-12 h-7 rounded-full relative transition-colors',
                    pushEnabled ? 'bg-accent-green' : 'bg-white/20'
                  )}
                >
                  <div className={cn(
                    'absolute top-1 w-5 h-5 rounded-full bg-white transition-all',
                    pushEnabled ? 'right-1' : 'left-1'
                  )} />
                </button>
              </div>
            </div>

            {/* Email Notifications */}
            <div className="bg-card-bg border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">Email Notifications</p>
                  <p className="text-sm text-text-muted">Get daily digests and important updates</p>
                </div>
                <button
                  onClick={() => setEmailEnabled(!emailEnabled)}
                  className={cn(
                    'w-12 h-7 rounded-full relative transition-colors',
                    emailEnabled ? 'bg-accent-green' : 'bg-white/20'
                  )}
                >
                  <div className={cn(
                    'absolute top-1 w-5 h-5 rounded-full bg-white transition-all',
                    emailEnabled ? 'right-1' : 'left-1'
                  )} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Types */}
        <div>
          <h2 className="font-semibold text-white mb-4">Notification Types</h2>
          <div className="space-y-3">
            {settings.map((setting) => (
              <div
                key={setting.id}
                className="bg-card-bg border border-white/10 rounded-xl p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">{setting.label}</p>
                    <p className="text-sm text-text-muted">{setting.description}</p>
                  </div>
                  <button
                    onClick={() => toggleSetting(setting.id)}
                    className={cn(
                      'w-12 h-7 rounded-full relative transition-colors shrink-0',
                      setting.enabled ? 'bg-accent-green' : 'bg-white/20'
                    )}
                  >
                    <div className={cn(
                      'absolute top-1 w-5 h-5 rounded-full bg-white transition-all',
                      setting.enabled ? 'right-1' : 'left-1'
                    )} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
