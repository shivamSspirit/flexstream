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
        // Shadcn UI compatibility
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

        // ═══════════════════════════════════════════════════════════════════
        // THE OBSIDIAN VAULT — Color System
        // ═══════════════════════════════════════════════════════════════════

        // Ink Backgrounds
        'ink': '#050505',
        'charcoal': '#121212',
        'elevated': '#1A1A1A',
        'surface': '#0A0A0A',

        // Legacy background aliases
        'app-bg': '#050505',
        'card-bg': '#121212',
        'card-hover': '#1A1A1A',

        // Text Hierarchy
        'text-primary': '#FAFAFA',
        'text-secondary': '#A0A0A0',
        'text-muted': '#666666',
        'text-ghost': '#404040',

        // Mint Frost — Primary Accent
        'mint-frost': '#E0FF62',
        'mint': '#E0FF62',
        'accent-green': '#E0FF62',
        'accent-cyan': '#E0FF62',

        // Privacy Glow — Deep Violet
        'privacy-glow': '#2D1B4E',
        'accent-purple': '#2D1B4E',
        'accent-pink': '#3D2B5E',

        // Functional Colors
        'success': '#E0FF62',
        'success-muted': '#C4E650',
        'danger': '#FF6B6B',
        'danger-muted': '#E55555',
        'warning': '#FFB84D',
        'warning-muted': '#E5A03D',
        'info': '#A0A0A0',
        'info-muted': '#666666',

        // Legacy aliases
        'accent-blue': '#A0A0A0',
        'brand-primary': '#E0FF62',
        'brand-secondary': '#2D1B4E',
        'brand-accent': '#E0FF62',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "1rem",
        "2xl": "1.5rem",
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(0, 0, 0, 0.5)',
        'md': '0 4px 16px rgba(0, 0, 0, 0.4)',
        'lg': '0 8px 32px rgba(0, 0, 0, 0.5)',
        'glow': '0 0 40px rgba(224, 255, 98, 0.15)',
        'glow-mint': '0 0 40px rgba(224, 255, 98, 0.15)',
        'glow-violet': '0 0 40px rgba(45, 27, 78, 0.4)',
        // Legacy aliases
        'card': '0 1px 2px rgba(0, 0, 0, 0.5)',
        'card-hover': '0 4px 16px rgba(0, 0, 0, 0.4)',
        'card-lg': '0 8px 32px rgba(0, 0, 0, 0.5)',
        'glow-primary': '0 0 40px rgba(224, 255, 98, 0.15)',
        'glow-secondary': '0 0 40px rgba(45, 27, 78, 0.4)',
        'glow-success': '0 0 40px rgba(224, 255, 98, 0.15)',
        'glow-green': '0 0 40px rgba(224, 255, 98, 0.15)',
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
        "vault-fade-in": {
          "0%": { opacity: 0, transform: "translateY(8px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        "vault-fade-up": {
          "0%": { opacity: 0, transform: "translateY(20px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        "vault-scale-in": {
          "0%": { opacity: 0, transform: "scale(0.96)" },
          "100%": { opacity: 1, transform: "scale(1)" },
        },
        "vault-blur-reveal": {
          "0%": { filter: "blur(12px)", opacity: 0 },
          "100%": { filter: "blur(0)", opacity: 1 },
        },
        "vault-breathe": {
          "0%, 100%": { opacity: 0.4 },
          "50%": { opacity: 1 },
        },
        "vault-glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(224, 255, 98, 0.15)" },
          "50%": { boxShadow: "0 0 40px rgba(224, 255, 98, 0.15)" },
        },
        "gradient-mesh": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "vault-fade": "vault-fade-in 0.5s ease-out forwards",
        "vault-fade-up": "vault-fade-up 0.6s ease-out forwards",
        "vault-scale": "vault-scale-in 0.4s ease-out forwards",
        "vault-blur": "vault-blur-reveal 0.6s ease-out forwards",
        "vault-breathe": "vault-breathe 4s ease-in-out infinite",
        "vault-glow": "vault-glow-pulse 3s ease-in-out infinite",
        "gradient-mesh": "gradient-mesh 8s ease infinite",
      },
      backgroundSize: {
        '200': '200%',
        '200%': '200% 200%',
      },
      fontFamily: {
        // Obsidian Vault Typography
        serif: ['Cormorant Garamond', 'Times New Roman', 'serif'],
        sans: ['var(--font-sans)', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['IBM Plex Mono', 'SF Mono', 'monospace'],
      },
      fontSize: {
        // Refined Typography Scale
        'xs': ['0.6875rem', { lineHeight: '1.4', letterSpacing: '0.02em' }],     // 11px
        'sm': ['0.8125rem', { lineHeight: '1.5', letterSpacing: '-0.01em' }],    // 13px
        'base': ['0.9375rem', { lineHeight: '1.6', letterSpacing: '-0.02em' }],  // 15px
        'lg': ['1.125rem', { lineHeight: '1.6', letterSpacing: '-0.02em' }],     // 18px
        'xl': ['1.25rem', { lineHeight: '1.5', letterSpacing: '-0.02em' }],      // 20px
        '2xl': ['1.5rem', { lineHeight: '1.4', letterSpacing: '-0.02em' }],      // 24px
        '3xl': ['2rem', { lineHeight: '1.2', letterSpacing: '-0.03em' }],        // 32px
        '4xl': ['2.5rem', { lineHeight: '1.1', letterSpacing: '-0.03em' }],      // 40px
        '5xl': ['3.5rem', { lineHeight: '1.05', letterSpacing: '-0.03em' }],     // 56px
        '6xl': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.03em' }],        // 72px
      },
      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      letterSpacing: {
        tighter: '-0.03em',
        tight: '-0.02em',
        normal: '-0.01em',
        wide: '0.02em',
        wider: '0.05em',
        widest: '0.08em',
      },
      transitionDuration: {
        'soft': '400ms',
        'snap': '200ms',
      },
      transitionTimingFunction: {
        'soft': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      borderWidth: {
        'hairline': '0.5px',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
