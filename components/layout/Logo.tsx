'use client';

import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

/* eslint-disable @next/next/no-img-element */

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showText?: boolean;
  variant?: 'full' | 'icon' | 'wordmark';
}

/**
 * FlexIt Logo Component
 * Terminal/Cyberpunk style with neon green (#00FF9F) glow effects
 * Dark background (#0D0D0D) with scanlines and grid patterns
 */
export function Logo({
  className,
  size = 'md',
  showIcon = true,
  showText = true,
  variant = 'full'
}: LogoProps) {
  const router = useRouter();

  // Size configurations for the terminal SVG logo
  // The terminal logo has viewBox of 545x280, so we maintain that aspect ratio
  const sizes = {
    sm: {
      logo: { width: 100, height: 52 },
      icon: { width: 32, height: 32 },
      containerClass: 'h-8'
    },
    md: {
      logo: { width: 130, height: 67 },
      icon: { width: 40, height: 40 },
      containerClass: 'h-10'
    },
    lg: {
      logo: { width: 180, height: 93 },
      icon: { width: 56, height: 56 },
      containerClass: 'h-14'
    }
  };

  const currentSize = sizes[size];

  // Determine what to render based on variant
  const renderIcon = variant === 'icon' || (variant === 'full' && showIcon && !showText);
  const renderWordmark = variant === 'wordmark' || (variant === 'full' && showText);

  return (
    <button
      onClick={() => router.push('/')}
      className={cn(
        'group flex items-center relative transition-all duration-150',
        className
      )}
      aria-label="FlexIt Home"
    >
      {/* Terminal green glow on hover */}
      <div className="absolute -inset-2 bg-[#00FF9F]/0 group-hover:bg-[#00FF9F]/10 rounded-xl blur-xl transition-all duration-300 pointer-events-none" />

      {renderIcon && (
        <img
          src="/logo/flexit-terminal-icon.svg"
          alt="FlexIt"
          width={currentSize.icon.width}
          height={currentSize.icon.height}
          className={cn(
            'relative z-10 transition-transform duration-150 group-hover:scale-[1.02]',
            currentSize.containerClass
          )}
          style={{ width: 'auto' }}
        />
      )}

      {renderWordmark && (
        <img
          src="/logo/flexit-terminal.svg"
          alt="FlexIt"
          width={currentSize.logo.width}
          height={currentSize.logo.height}
          className={cn(
            'relative z-10 transition-transform duration-150 group-hover:scale-[1.02]',
            currentSize.containerClass
          )}
          style={{ width: 'auto' }}
        />
      )}
    </button>
  );
}

/**
 * Logo variants for different use cases
 */

// Icon only - for mobile nav, favicon, small spaces
export function LogoIcon(props: Omit<LogoProps, 'variant' | 'showText' | 'showIcon'>) {
  return <Logo {...props} variant="icon" />;
}

// Wordmark only - for headers
export function LogoWordmark(props: Omit<LogoProps, 'variant' | 'showText' | 'showIcon'>) {
  return <Logo {...props} variant="wordmark" />;
}

// Text only (alias for LogoWordmark)
export function LogoText(props: Omit<LogoProps, 'showIcon'>) {
  return <Logo {...props} showIcon={false} />;
}

// Minimal version - terminal style text (fallback)
export function LogoMinimal({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push('/')}
      className={cn(
        'group font-mono font-bold text-2xl tracking-tight transition-all duration-150 relative',
        className
      )}
    >
      {/* Terminal green hover glow */}
      <div className="absolute -inset-2 bg-[#00FF9F]/0 group-hover:bg-[#00FF9F]/10 rounded-lg blur-lg transition-all duration-300" />
      <span className="relative text-[#00FF9F] drop-shadow-[0_0_10px_rgba(0,255,159,0.5)]">
        FlexIt
      </span>
    </button>
  );
}
