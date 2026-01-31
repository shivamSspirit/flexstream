'use client';

import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { ArrowLeftIcon, SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

export default function AppearanceSettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const themeOptions = [
    {
      id: 'dark',
      label: 'Dark',
      description: 'Dark background with light text',
      icon: MoonIcon,
    },
    {
      id: 'light',
      label: 'Light',
      description: 'Light background with dark text',
      icon: SunIcon,
    },
  ];

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
            <h1 className="heading-3">Appearance</h1>
            <p className="body-sm">Customize how FlexStream looks</p>
          </div>
        </div>

        {/* Theme Selection */}
        <div className="mb-8">
          <h2 className="font-semibold text-white mb-4">Theme</h2>
          <div className="grid grid-cols-2 gap-4">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = theme === option.id;

              return (
                <button
                  key={option.id}
                  onClick={() => setTheme(option.id as 'dark' | 'light')}
                  className={cn(
                    'relative p-4 rounded-xl border-2 transition-all text-left',
                    isSelected
                      ? 'border-accent-green bg-accent-green/10'
                      : 'border-white/10 hover:border-white/20 bg-card-bg'
                  )}
                >
                  {/* Preview */}
                  <div className={cn(
                    'w-full aspect-video rounded-lg mb-3 overflow-hidden',
                    option.id === 'dark' ? 'bg-gray-900' : 'bg-gray-100'
                  )}>
                    <div className={cn(
                      'h-3 w-full',
                      option.id === 'dark' ? 'bg-gray-800' : 'bg-white border-b border-gray-200'
                    )} />
                    <div className="p-2 space-y-1">
                      <div className={cn(
                        'h-2 w-3/4 rounded',
                        option.id === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                      )} />
                      <div className={cn(
                        'h-2 w-1/2 rounded',
                        option.id === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                      )} />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Icon className={cn(
                      'w-5 h-5',
                      isSelected ? 'text-accent-green' : 'text-text-secondary'
                    )} />
                    <div>
                      <p className={cn(
                        'font-semibold',
                        isSelected ? 'text-accent-green' : 'text-white'
                      )}>
                        {option.label}
                      </p>
                      <p className="text-xs text-text-muted">{option.description}</p>
                    </div>
                  </div>

                  {/* Checkmark */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-accent-green flex items-center justify-center">
                      <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Display Options */}
        <div>
          <h2 className="font-semibold text-white mb-4">Display</h2>
          <div className="space-y-4">
            {/* Compact Mode */}
            <div className="flex items-center justify-between p-4 bg-card-bg border border-white/10 rounded-xl">
              <div>
                <p className="font-medium text-white">Compact Mode</p>
                <p className="text-sm text-text-muted">Show more content with smaller spacing</p>
              </div>
              <button className="w-12 h-7 rounded-full bg-white/20 relative transition-colors">
                <div className="absolute left-1 top-1 w-5 h-5 rounded-full bg-white transition-all" />
              </button>
            </div>

            {/* Animations */}
            <div className="flex items-center justify-between p-4 bg-card-bg border border-white/10 rounded-xl">
              <div>
                <p className="font-medium text-white">Reduce Animations</p>
                <p className="text-sm text-text-muted">Disable motion for accessibility</p>
              </div>
              <button className="w-12 h-7 rounded-full bg-white/20 relative transition-colors">
                <div className="absolute left-1 top-1 w-5 h-5 rounded-full bg-white transition-all" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
