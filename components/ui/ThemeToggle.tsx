'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ThemeToggle({ className, size = 'md' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'relative flex items-center justify-center rounded-full transition-all duration-300',
        'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20',
        'text-text-secondary hover:text-text-primary',
        sizeClasses[size],
        className
      )}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <div className="relative">
        {/* Sun icon (for light mode) */}
        <SunIcon
          className={cn(
            iconSizes[size],
            'absolute inset-0 transition-all duration-300',
            theme === 'dark'
              ? 'opacity-100 rotate-0 scale-100'
              : 'opacity-0 rotate-90 scale-0'
          )}
        />

        {/* Moon icon (for dark mode) */}
        <MoonIcon
          className={cn(
            iconSizes[size],
            'transition-all duration-300',
            theme === 'light'
              ? 'opacity-100 rotate-0 scale-100'
              : 'opacity-0 -rotate-90 scale-0'
          )}
        />
      </div>
    </button>
  );
}
