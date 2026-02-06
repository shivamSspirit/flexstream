'use client';

import { motion } from 'framer-motion';

export type FeedTabId = 'all' | 'tokens' | 'following' | 'predictions';
export type SubFilter = 'latest' | 'hot' | 'top_24h' | 'top_7d' | 'top_all';

interface FeedTabConfig {
  id: FeedTabId;
  label: string;
  emoji: string;
  activeColor: string;
  activeBg: string;
  activeBorder: string;
  requiresAuth: boolean;
}

const FEED_TABS: FeedTabConfig[] = [
  {
    id: 'all',
    label: 'All Posts',
    emoji: '\u{1F4DD}',
    activeColor: '#E0FF62',
    activeBg: 'rgba(224, 255, 98, 0.15)',
    activeBorder: 'rgba(224, 255, 98, 0.3)',
    requiresAuth: false,
  },
  {
    id: 'tokens',
    label: 'Token Posts',
    emoji: '\u{1FA99}',
    activeColor: '#00F0FF',
    activeBg: 'rgba(0, 240, 255, 0.12)',
    activeBorder: 'rgba(0, 240, 255, 0.3)',
    requiresAuth: false,
  },
  {
    id: 'following',
    label: 'Following',
    emoji: '\u{1F465}',
    activeColor: '#FF2D92',
    activeBg: 'rgba(255, 45, 146, 0.12)',
    activeBorder: 'rgba(255, 45, 146, 0.3)',
    requiresAuth: true,
  },
  {
    id: 'predictions',
    label: 'Predictions',
    emoji: '\u{1F3AF}',
    activeColor: '#14b8a6',
    activeBg: 'rgba(20, 184, 166, 0.15)',
    activeBorder: 'rgba(20, 184, 166, 0.3)',
    requiresAuth: false,
  },
];

interface FeedTabsProps {
  activeTab: FeedTabId;
  onTabChange: (tab: FeedTabId) => void;
  isAuthenticated: boolean;
  onLoginRequired: () => void;
}

export function FeedTabs({
  activeTab,
  onTabChange,
  isAuthenticated,
  onLoginRequired,
}: FeedTabsProps) {
  const handleTabClick = (tab: FeedTabConfig) => {
    if (tab.requiresAuth && !isAuthenticated) {
      onLoginRequired();
      return;
    }
    onTabChange(tab.id);
  };

  return (
    <div
      className="sticky top-16 z-30 px-4 pt-3 pb-3"
      style={{
        background: 'rgba(5, 5, 5, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div
        className="flex gap-1 p-1 rounded-lg overflow-x-auto scrollbar-hide"
        style={{ background: 'rgba(255,255,255,0.03)' }}
      >
        {FEED_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className="relative flex-1 min-w-0 flex-shrink-0 py-2.5 rounded-md text-[12px] sm:text-[13px] font-medium transition-colors duration-150 whitespace-nowrap"
              style={{
                background: isActive ? tab.activeBg : 'transparent',
                color: isActive ? tab.activeColor : 'rgba(255,255,255,0.5)',
                border: isActive
                  ? `0.5px solid ${tab.activeBorder}`
                  : '0.5px solid transparent',
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="feedTabBg"
                  className="absolute inset-0 rounded-md"
                  style={{ background: tab.activeBg }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10 flex items-center justify-center gap-1">
                <span>{tab.emoji}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                {tab.requiresAuth && !isAuthenticated && (
                  <svg
                    className="w-3 h-3 opacity-50"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                    />
                  </svg>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
