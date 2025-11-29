'use client';

import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showText?: boolean;
}

/**
 * FlexIt Logo - Modern streaming wave icon with Solana gradient
 * Represents content flowing/streaming on the platform
 */
function FlexItIcon({ className }: { className?: string }) {
  const id = Math.random().toString(36).substr(2, 9);
  const gradientId = `streamGradient-${id}`;
  const glowId = `streamGlow-${id}`;

  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Green-violet-green gradient */}
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="20%" stopColor="#3B0764" />
          <stop offset="40%" stopColor="#5B21B6" />
          <stop offset="60%" stopColor="#7C3AED" />
          <stop offset="80%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#14F195" />
        </linearGradient>

        {/* Meme-style glow */}
        <filter id={glowId} x="-70%" y="-70%" width="240%" height="240%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feFlood floodColor="#9945FF" floodOpacity="0.6" />
          <feComposite in2="blur" operator="in" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Capsule/Elliptic "F" design */}

      {/* Top horizontal capsule - elongated pill shape */}
      <ellipse
        cx="28"
        cy="10"
        rx="18"
        ry="5"
        fill={`url(#${gradientId})`}
        transform="rotate(-2 28 10)"
      />

      {/* Middle horizontal capsule - medium pill */}
      <ellipse
        cx="22"
        cy="24"
        rx="13"
        ry="5"
        fill={`url(#${gradientId})`}
        opacity="0.95"
        transform="rotate(-3 22 24)"
      />

      {/* Vertical capsule spine - tall pill connecting bars */}
      <ellipse
        cx="12"
        cy="24"
        rx="5"
        ry="18"
        fill={`url(#${gradientId})`}
      />
    </svg>
  );
}

/**
 * FlexIt Logo - Modern, Vibrant SocialFi Streaming Platform
 */
export function Logo({
  className,
  size = 'md',
  showIcon = true,
  showText = true
}: LogoProps) {
  const router = useRouter();

  const sizes = {
    sm: {
      icon: 'w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16',
      text: 'text-lg sm:text-xl md:text-2xl',
      gap: 'gap-2.5 sm:gap-3'
    },
    md: {
      icon: 'w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20',
      text: 'text-xl sm:text-2xl md:text-3xl lg:text-4xl',
      gap: 'gap-3 sm:gap-3.5 md:gap-4'
    },
    lg: {
      icon: 'w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28',
      text: 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl',
      gap: 'gap-4 sm:gap-4.5 md:gap-5'
    }
  };

  return (
    <button
      onClick={() => router.push('/')}
      className={cn(
        'flex items-center transition-all duration-300 hover:opacity-80 group',
        sizes[size].gap,
        className
      )}
      aria-label="FlexIt Home"
    >
      {showIcon && (
        <div className="relative">
          <div className={cn(
            'relative flex items-center justify-center',
            'group-hover:scale-110 group-hover:rotate-2',
            'transition-all duration-300 ease-out'
          )}>
            <FlexItIcon className={sizes[size].icon} />
          </div>
        </div>
      )}

      {showText && (
        <span className={cn(
          'font-extrabold tracking-tight',
          sizes[size].text
        )}>
          <span className="bg-gradient-to-r from-[#9945FF] via-[#8A2BE2] to-[#14F195] bg-clip-text text-transparent">
            Flex
          </span>
          <span className="text-white/95">
            It
          </span>
        </span>
      )}
    </button>
  );
}

/**
 * Logo variants for different use cases
 */

// Icon only - for mobile nav, small spaces
export function LogoIcon(props: Omit<LogoProps, 'showText'>) {
  return <Logo {...props} showText={false} />;
}

// Text only - for compact headers
export function LogoText(props: Omit<LogoProps, 'showIcon'>) {
  return <Logo {...props} showIcon={false} />;
}

// Minimal version - just the wordmark with gradient
export function LogoMinimal({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push('/')}
      className={cn(
        'font-black text-2xl tracking-tight hover:opacity-80 transition-all duration-300',
        className
      )}
    >
      <span className="bg-gradient-to-r from-[#9945FF] via-[#8A2BE2] to-[#14F195] bg-clip-text text-transparent">
        Flex
      </span>
      <span className="text-white/95">
        It
      </span>
    </button>
  );
}
