/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // FlexStream Design System - Zora-Inspired (Deep Black + Vibrant Accents)
        'app-bg': '#000000',           // Pure black background (Zora style)
        'card-bg': '#0A0A0A',          // Very deep gray for cards
        'card-hover': '#141414',       // Subtle hover state
        'text-primary': '#FFFFFF',     // Bright white for maximum contrast
        'text-secondary': '#A3A3A3',   // Medium gray for secondary content
        'text-muted': '#737373',       // Muted gray for labels/dividers

        // Vibrant Accent Colors (Zora-style bright, energetic)
        'accent-green': '#00FF00',     // Bright electric green (primary CTA)
        'accent-blue': '#0066FF',      // Bright blue (links, info)
        'accent-cyan': '#00E5FF',      // Bright cyan (highlights)
        'accent-purple': '#8B5CF6',    // Vibrant purple (premium)
        'accent-pink': '#FF0080',      // Hot pink (energy)

        // Functional Colors (High Contrast)
        'success': '#00FF00',          // Bright green (positive, growth)
        'success-muted': '#00CC00',    // Slightly muted green
        'danger': '#FF0000',           // Bright red (alerts, negative)
        'danger-muted': '#CC0000',     // Slightly muted red
        'warning': '#FFA500',          // Orange (warnings)
        'warning-muted': '#FF8C00',    // Dark orange
        'info': '#0066FF',             // Bright blue (informational)
        'info-muted': '#0052CC',       // Darker blue

        // Legacy support (map old names to new vibrant system)
        'brand-primary': '#0066FF',    // Bright blue
        'brand-secondary': '#8B5CF6',  // Vibrant purple
        'brand-accent': '#00FF00',     // Bright green
        purple: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c3aed',
          800: '#6b21a8',
          900: '#581c87',
        },
        pink: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
        },
        success: {
          DEFAULT: '#10b981',
          foreground: '#ffffff',
        },
        warning: {
          DEFAULT: '#f59e0b',
          foreground: '#ffffff',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "1rem",
        "2xl": "1.5rem",
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px 0 rgba(0, 0, 0, 0.3)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
        'card-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
        'glow-primary': '0 0 24px rgba(99, 102, 241, 0.4), 0 0 12px rgba(99, 102, 241, 0.2)',
        'glow-secondary': '0 0 24px rgba(139, 92, 246, 0.4), 0 0 12px rgba(139, 92, 246, 0.2)',
        'glow-accent': '0 0 24px rgba(236, 72, 153, 0.4), 0 0 12px rgba(236, 72, 153, 0.2)',
        'glow-success': '0 0 24px rgba(16, 185, 129, 0.4), 0 0 12px rgba(16, 185, 129, 0.2)',
        // Legacy aliases
        'glow-blue': '0 0 24px rgba(99, 102, 241, 0.4)',
        'glow-green': '0 0 24px rgba(16, 185, 129, 0.4)',
        'glow-gold': '0 0 24px rgba(236, 72, 153, 0.4)',
        'glow-turquoise': '0 0 24px rgba(59, 130, 246, 0.4)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
        '112': '28rem',
        '128': '32rem',
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "fade-in": {
          "0%": { opacity: 0, transform: "translateY(10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        "slide-in": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(168, 85, 247, 0.4)" },
          "50%": { boxShadow: "0 0 30px rgba(168, 85, 247, 0.8)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['var(--font-space-mono)', 'Space Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
      fontSize: {
        // Enhanced typography scale (based on 1.25 ratio - perfect fourth)
        'xs': ['0.75rem', { lineHeight: '1.5', letterSpacing: '0.01em' }],      // 12px
        'sm': ['0.875rem', { lineHeight: '1.5', letterSpacing: '0em' }],        // 14px
        'base': ['1rem', { lineHeight: '1.6', letterSpacing: '0em' }],          // 16px (body)
        'lg': ['1.125rem', { lineHeight: '1.6', letterSpacing: '-0.01em' }],    // 18px
        'xl': ['1.25rem', { lineHeight: '1.5', letterSpacing: '-0.01em' }],     // 20px
        '2xl': ['1.5rem', { lineHeight: '1.4', letterSpacing: '-0.015em' }],    // 24px
        '3xl': ['1.875rem', { lineHeight: '1.3', letterSpacing: '-0.02em' }],   // 30px
        '4xl': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }],    // 36px
        '5xl': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.025em' }],      // 48px
        '6xl': ['3.75rem', { lineHeight: '1', letterSpacing: '-0.025em' }],     // 60px
        '7xl': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.03em' }],       // 72px
      },
      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
