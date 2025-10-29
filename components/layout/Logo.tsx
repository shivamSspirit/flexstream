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
 * FlexStream Logo - Modern, Vibrant SocialFi Branding
 *
 * Design Philosophy:
 * - Icon: Abstract "F" + "S" merge creating a flex/stream symbol
 * - Colors: Gradient green→cyan (energy, growth, money)
 * - Typography: Bold, modern, confident
 * - Style: Clean, memorable, scales perfectly
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
      icon: 'w-12 h-12',
      text: 'text-lg',
      gap: 'gap-2'
    },
    md: {
      icon: 'w-14 h-14',
      text: 'text-xl',
      gap: 'gap-2.5'
    },
    lg: {
      icon: 'w-20 h-20',
      text: 'text-3xl',
      gap: 'gap-3'
    }
  };

  return (
    <button
      onClick={() => router.push('/')}
      className={cn(
        'flex items-center transition-all duration-200 hover:opacity-80 group',
        sizes[size].gap,
        className
      )}
      aria-label="FlexStream Home"
    >
      {/* Icon - Modern "FS" Symbol with Flow */}
      {showIcon && (
        <div className="relative">
          {/* Glow effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-accent-green to-accent-cyan rounded-xl blur-lg opacity-0 group-hover:opacity-40 transition-opacity duration-300"></div>

          {/* Icon Container */}
          <div className={cn(
            'relative rounded-xl bg-gradient-to-br from-accent-green via-accent-cyan to-accent-blue flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-200',
            sizes[size].icon
          )}>
            <svg
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-[90%] h-[90%]"
            >
              {/*
                🔥 GENIUS LEVEL CONCEPT: "THE INFINITY FLEX"

                A HEXAGONAL COIN that transforms into an INFINITY SYMBOL (∞)
                with ENERGY STREAMS flowing through it!

                Revolutionary Symbolism:
                - Hexagon = Blockchain (like crypto wallets/networks)
                - Infinity loop = Endless stream of content & profits
                - Center gap forms "F" negative space = FlexStream
                - Energy flowing = Social posts converting to money
                - Dynamic movement = Never stops, always growing

                Genius touches:
                - Hexagon = Tech/Crypto (all crypto logos use geometric shapes)
                - Infinity = Perpetual earnings machine
                - Hidden "F" = Subliminal branding
                - Gradient flow = Value streaming through the system
                - 3D depth = Premium, sophisticated

                Like FedEx arrow or Amazon smile - HIDDEN MEANING!
              */}

              <defs>
                {/* Premium metallic gradient */}
                <linearGradient id="coinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="1" />
                  <stop offset="35%" stopColor="#06b6d4" stopOpacity="1" />
                  <stop offset="70%" stopColor="#3b82f6" stopOpacity="1" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="1" />
                </linearGradient>

                {/* Flow gradient - left to right */}
                <linearGradient id="flowGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
                  <stop offset="50%" stopColor="#06b6d4" stopOpacity="1" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>

                {/* Flow gradient - right to left */}
                <linearGradient id="flowGrad2" x1="100%" y1="0%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0" />
                  <stop offset="50%" stopColor="#3b82f6" stopOpacity="1" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                </linearGradient>

                {/* Glow effect */}
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* MAIN SYMBOL: Infinity Loop made from hexagonal crypto coin */}

              {/* Left loop of infinity - THICK & BOLD */}
              <path
                d="M 25 50 Q 25 30 35 25 Q 40 23 45 25 Q 50 27 50 35 Q 50 43 45 45 Q 40 47 35 45 Q 25 43 25 50"
                fill="none"
                stroke="url(#coinGrad)"
                strokeWidth="11"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glow)"
              />

              {/* Right loop of infinity - THICK & BOLD */}
              <path
                d="M 75 50 Q 75 57 65 55 Q 60 53 55 55 Q 50 57 50 65 Q 50 73 55 75 Q 60 77 65 75 Q 75 73 75 50"
                fill="none"
                stroke="url(#coinGrad)"
                strokeWidth="11"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glow)"
              />

              {/* Center crossover - creates the infinity junction */}
              <ellipse
                cx="50"
                cy="50"
                rx="6"
                ry="10"
                fill="url(#coinGrad)"
                opacity="0.9"
              />

              {/* THE HIDDEN "F" - negative space in center! */}
              {/* Top horizontal line of F */}
              <line
                x1="48"
                y1="44"
                x2="56"
                y2="44"
                stroke="#000000"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Middle horizontal line of F */}
              <line
                x1="48"
                y1="50"
                x2="54"
                y2="50"
                stroke="#000000"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Vertical line of F */}
              <line
                x1="48"
                y1="44"
                x2="48"
                y2="56"
                stroke="#000000"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* ANIMATED ENERGY PARTICLES flowing through the infinity loop */}

              {/* Left loop flow - particles moving clockwise */}
              <circle cx="30" cy="35" r="2" fill="#10b981">
                <animateMotion
                  path="M 30 35 Q 35 25 45 30 Q 50 35 45 42 Q 38 47 30 42 Q 25 38 30 35"
                  dur="3s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0;1;1;0"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </circle>

              <circle cx="42" cy="28" r="1.5" fill="#06b6d4">
                <animateMotion
                  path="M 42 28 Q 46 26 48 32 Q 48 38 44 40 Q 38 42 34 38 Q 30 34 42 28"
                  dur="2.5s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0;0.8;0.8;0"
                  dur="2.5s"
                  repeatCount="indefinite"
                />
              </circle>

              {/* Right loop flow - particles moving counter-clockwise */}
              <circle cx="70" cy="65" r="2" fill="#3b82f6">
                <animateMotion
                  path="M 70 65 Q 65 75 55 70 Q 50 65 55 58 Q 62 53 70 58 Q 75 62 70 65"
                  dur="3s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0;1;1;0"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </circle>

              <circle cx="58" cy="72" r="1.5" fill="#8b5cf6">
                <animateMotion
                  path="M 58 72 Q 54 74 52 68 Q 52 62 56 60 Q 62 58 66 62 Q 70 66 58 72"
                  dur="2.8s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0;0.8;0.8;0"
                  dur="2.8s"
                  repeatCount="indefinite"
                />
              </circle>

              {/* Center spark - where energy crosses */}
              <circle cx="50" cy="50" r="2.5" fill="#ffffff" opacity="0.9">
                <animate
                  attributeName="r"
                  values="2.5;4;2.5"
                  dur="1.5s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.9;0.4;0.9"
                  dur="1.5s"
                  repeatCount="indefinite"
                />
              </circle>

              {/* Hexagonal frame corners - subtle tech aesthetic */}
              <polygon
                points="50,15 65,22 65,35"
                fill="none"
                stroke="url(#coinGrad)"
                strokeWidth="1.5"
                opacity="0.3"
              />
              <polygon
                points="50,85 35,78 35,65"
                fill="none"
                stroke="url(#coinGrad)"
                strokeWidth="1.5"
                opacity="0.3"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Text - Bold, Modern Typography */}
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={cn(
            'font-black tracking-tight',
            sizes[size].text
          )}>
            <span className="bg-gradient-to-r from-accent-green via-accent-cyan to-accent-blue bg-clip-text text-transparent">
              Flex
            </span>
            <span className="text-white">
              Stream
            </span>
          </span>
        </div>
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
        'font-black text-2xl tracking-tight hover:opacity-80 transition-opacity',
        className
      )}
    >
      <span className="bg-gradient-to-r from-accent-green via-accent-cyan to-accent-blue bg-clip-text text-transparent">
        Flex
      </span>
      <span className="text-white">
        Stream
      </span>
    </button>
  );
}
