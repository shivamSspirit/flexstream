# FlexStream Design System Guide

## 🚀 Quick Reference - Use These Colors ALWAYS

```typescript
// BACKGROUNDS
bg-app-bg      // #0a0a0a - All page/body backgrounds
bg-card-bg     // #1a1a1a - All card/section backgrounds

// TEXT
text-primary   // #ffffff - All headings and body text
text-secondary // #888888 - All labels, timestamps, secondary info

// ACCENTS
text-link-blue   // #3b82f6 - All clickable links
text-metric-green // #10b981 - Positive numbers, gains, success
text-metric-red   // #ef4444 - Negative numbers, losses, errors

// BORDERS
border-white/10  // Default borders on cards
border-white/20  // Hover/focus state borders
```

## 📋 Overview
This guide provides instructions for AI assistants and developers on how to use the FlexStream design system. Follow these patterns to maintain consistency across the application.

---

## 🎨 Design Tokens

### Color Palette

#### Primary Colors (FlexStream Design System)
```typescript
// ALWAYS USE THESE COLORS FOR CONSISTENCY
'bg-app-bg'        // #0a0a0a - Main app background (ALWAYS use for body/pages)
'bg-card-bg'       // #1a1a1a - Card backgrounds (ALWAYS use for cards/sections)
'text-primary'     // #ffffff - Primary text (ALWAYS use for headings/body text)
'text-secondary'   // #888888 - Secondary text (ALWAYS use for timestamps/labels)
'text-link-blue'   // #3b82f6 - Links (ALWAYS use for clickable links)
'text-metric-green'// #10b981 - Positive metrics (ALWAYS use for gains/success)
'text-metric-red'  // #ef4444 - Negative metrics (ALWAYS use for losses/errors)
```

#### Brand Gradients
```typescript
// Use for CTAs, highlights, and brand emphasis
className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-800"
// OR use utility class:
className="flexstream-gradient"

// Text gradient
className="flexstream-gradient-text" // bg-clip-text text-transparent
```

#### Success Tiers (Gamification)
```typescript
// Use for user badges, achievements
'bronze'  → className="success-tier-bronze"  // Amber gradient
'silver'  → className="success-tier-silver"  // Gray gradient  
'gold'    → className="success-tier-gold"    // Yellow gradient
'diamond' → className="success-tier-diamond" // Blue to purple gradient
```

#### Semantic Colors (Use Sparingly - Prefer Primary Colors Above)
```typescript
// Backgrounds (prefer primary colors above)
'bg-app-bg'        // #0a0a0a - Main app background
'bg-card-bg'       // #1a1a1a - Card backgrounds
'bg-white/5'       // Glass morphism overlays (for subtle effects)

// Text (prefer primary colors above)
'text-primary'     // #ffffff - Primary text
'text-secondary'   // #888888 - Secondary text
'text-link-blue'   // #3b82f6 - Links

// Status colors
'text-metric-green'// #10b981 - Positive/earnings/success
'text-metric-red'  // #ef4444 - Negative/warnings
'text-link-blue'   // #3b82f6 - Info/links
'text-yellow-400'  // Pending/in-progress (legacy)
```

#### Borders
```typescript
'border-white/10'  // Subtle borders (DEFAULT for cards)
'border-white/20'  // Emphasized borders (hover/focus states)
'border-white/30'  // Strong emphasis borders
```

### Spacing & Layout
```typescript
// Container max-widths
'max-w-2xl'  // Feed content (main column)
'max-w-7xl'  // Full-width layouts
'w-64'       // Left sidebar width
'w-80'       // Right sidebar width

// Padding standards
'p-4'  'p-6'  // Card padding
'px-4' 'py-6' // Layout padding
'space-x-3'   // Horizontal item spacing
'space-y-4'   // Vertical section spacing
```

### Typography
```typescript
// Font family (already applied globally)
font-sans // Inter font

// Headings
'text-2xl font-bold'       // Page titles
'text-xl font-semibold'    // Section headers
'text-lg font-medium'      // Card titles

// Body text
'text-base'                // Default body (16px)
'text-sm'                  // Secondary text (14px)
'text-xs'                  // Tertiary text (12px)

// Monospace (wallet addresses, code)
'font-mono text-xs'
```

### Effects & Animations
```typescript
// Glass morphism
className="glass-effect" 
// Equals: bg-white/10 backdrop-blur-md border border-white/20

// Earnings glow
className="earnings-glow"
// Equals: shadow-lg shadow-green-500/25

// Transitions
'transition-colors'     // Color transitions
'transition-all'        // All properties
'hover:bg-gray-700'     // Hover states

// Animations (defined in tailwind.config.js)
'animate-fade-in'       // Fade in entrance
'animate-slide-in'      // Slide from left
'animate-pulse-glow'    // Pulsing glow effect
```

---

## 📁 File Structure

### Component Organization
```
/components
  /ui/                    # Base Shadcn components (DO NOT modify directly)
    - avatar.tsx
    - badge.tsx
    - button.tsx
    - card.tsx
    - dialog.tsx
    - input.tsx
    - switch.tsx
    - tabs.tsx
    - textarea.tsx
    - toast.tsx
  
  /posts/                 # Feature: Social posts
    - PostCard.tsx        # Main post component
    - PostComments.tsx    # Comments section
    - EarningsDisplay.tsx # Earnings verification widget
    - VerificationBadge.tsx
  
  /pump-fun/              # Feature: Live streaming
    - LiveStreamCard.tsx  # Token stream card
    - LiveStreamsGrid.tsx # Grid layout
    - LiveStreamFilters.tsx
    - PaginationControls.tsx
  
  /layout/                # App shell components
    - AppLayout.tsx       # Main layout wrapper
    - Header.tsx          # Top header
    - DesktopSidebar.tsx  # Left navigation
    - MobileNav.tsx       # Bottom mobile nav
  
  /solana/                # Blockchain integration
    - SolanaProvider.tsx  # Wallet adapter provider
  
  /feed/                  # Feed-specific components
    - MainFeed.tsx
    - FeedFilters.tsx
    - EmptyState.tsx

/lib
  - utils.ts              # Utility functions (cn, formatters)
  - auth.ts               # Auth helpers
  - supabase.ts           # Database client + types
  - pump-fun.ts           # API client
  /hooks/                 # Custom React hooks
    - useWalletLink.ts
    - usePumpFunLiveStreams.ts

/types
  - index.ts              # TypeScript interfaces
```

### When to Create New Components

**Create in `/components/ui/`**: NEVER (these are Shadcn base components)

**Create in `/components/[feature]/`**: 
- Reusable feature-specific components
- Components used across multiple pages
- Complex UI patterns (modals, cards, forms)

**Create in `/app/[route]/`**:
- Single-use page components
- Route-specific layouts

---

## 🧩 Component Patterns

### 1. Using Base UI Components

#### Button Component
```typescript
import { Button } from '@/components/ui/button';

// Variants
<Button variant="default">Primary Action</Button>
<Button variant="gradient">Brand CTA</Button>
<Button variant="outline">Secondary</Button>
<Button variant="ghost">Tertiary</Button>
<Button variant="success">Success</Button>
<Button variant="destructive">Delete</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="xl">Extra Large</Button>
<Button size="icon">
  <Icon className="h-4 w-4" />
</Button>

// Custom styling (always use cn utility)
<Button className={cn("custom-class", conditionalClass && "another-class")}>
  Click Me
</Button>
```

#### Card Component
```typescript
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// Standard pattern (ALWAYS USE THIS)
<Card className="bg-card-bg border-white/10 hover:border-white/20 transition-colors">
  <CardHeader>
    <CardTitle className="text-primary">Card Title</CardTitle>
    <CardDescription className="text-secondary">Optional description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content here */}
  </CardContent>
</Card>

// Glass effect card (for overlays/modals)
<Card className="bg-white/5 backdrop-blur-md border-white/10">
  <CardContent className="p-6">
    {/* Content */}
  </CardContent>
</Card>
```

#### Badge Component
```typescript
import { Badge } from '@/components/ui/badge';

// Variants
<Badge variant="default">Default</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="destructive">Error</Badge>

// Success tiers (special for this app)
<Badge variant="bronze">🥉 Bronze</Badge>
<Badge variant="silver">🥈 Silver</Badge>
<Badge variant="gold">🥇 Gold</Badge>
<Badge variant="diamond">💎 Diamond</Badge>

// Status badges
<Badge variant="verified">✓ Verified</Badge>
<Badge variant="pending">⏱ Pending</Badge>
<Badge variant="rejected">✗ Rejected</Badge>
```

### 2. Building Complex Components

#### Component Structure Template
```typescript
'use client'; // Add if using hooks/browser APIs

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SomeIcon } from 'lucide-react'; // Preferred icon library
// OR
import { SomeIcon } from '@heroicons/react/24/outline'; // Alternative

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn, formatTimeAgo } from '@/lib/utils'; // Always import utilities
import { MyType } from '@/types'; // TypeScript types

interface MyComponentProps {
  data: MyType;
  onAction?: () => void;
  className?: string; // Always accept className for composability
}

export function MyComponent({ data, onAction, className }: MyComponentProps) {
  const router = useRouter();
  const [state, setState] = useState(false);

  const handleClick = () => {
    // Handle action
    onAction?.();
  };

  return (
    <Card className={cn("bg-card-bg border-white/10 hover:border-white/20 transition-colors", className)}>
      <CardContent className="p-6 space-y-4">
        <h3 className="text-primary font-semibold">Title</h3>
        <p className="text-secondary text-sm">Description</p>
        {/* Content */}
      </CardContent>
    </Card>
  );
}
```

#### PostCard Pattern (Reference: `/components/posts/PostCard.tsx`)
```typescript
// Key patterns used:
1. Avatar with click handler → navigates to profile
2. Relative timestamps using formatTimeAgo()
3. Success tier badges with icons
4. Conditional rendering (media, earnings, social links)
5. Interactive actions (like, comment, share)
6. State management for optimistic updates
7. Nested components (PostComments, EarningsDisplay)
```

#### LiveStreamCard Pattern (Reference: `/components/pump-fun/LiveStreamCard.tsx`)
```typescript
// Key patterns used:
1. Token image with fallback to symbol initials
2. Number formatting (formatNumber for currency)
3. Price change indicators (color + icon based on value)
4. Copy-to-clipboard functionality
5. Grid layouts for stats (grid-cols-2)
6. External links with icon buttons
7. Badge for live status with pulse animation
```

### 3. Layout Patterns

#### Page Layout
```typescript
import { AppLayout } from '@/components/layout/AppLayout';

export default function MyPage() {
  return (
    <AppLayout>
      {/* Content automatically centered with max-w-2xl */}
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-primary">Page Title</h1>
        <p className="text-secondary">Subtitle or description</p>
        {/* Page content */}
      </div>
    </AppLayout>
  );
}
```

#### Grid Layouts
```typescript
// Responsive grid for cards
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => (
    <ItemCard key={item.id} item={item} />
  ))}
</div>

// Stats display (2-column)
<div className="grid grid-cols-2 gap-4">
  <div className="text-center">
    <div className="text-gray-400 text-xs mb-1">Label</div>
    <div className="text-white font-semibold text-sm">Value</div>
  </div>
  {/* More stats */}
</div>
```

#### Flex Layouts
```typescript
// Horizontal layout with space between
<div className="flex items-center justify-between">
  <div>Left content</div>
  <div>Right content</div>
</div>

// Centered content
<div className="flex items-center justify-center min-h-screen">
  <div>Centered content</div>
</div>

// Action buttons row
<div className="flex items-center space-x-4">
  <Button>Action 1</Button>
  <Button>Action 2</Button>
</div>
```

---

## 🛠 Utility Functions

### Formatting Utilities (`/lib/utils.ts`)

```typescript
import { 
  cn,              // Class name merger (ALWAYS use for className)
  formatNumber,    // 1234 → "1.2K", 1234567 → "1.2M"
  formatCurrency,  // 1234 → "$1,234.00"
  formatEarnings,  // 1234 → "$1K"
  formatTimeAgo,   // Date → "2h ago", "3d ago"
  truncateAddress, // "abc...xyz" (wallet addresses)
  getSuccessTierColor,  // Returns tier className
  getSuccessTierIcon,   // Returns tier emoji
} from '@/lib/utils';

// Usage examples:
const displayAmount = formatEarnings(150000); // "$150K"
const timeAgo = formatTimeAgo(post.created_at); // "2h ago"
const address = truncateAddress(walletAddress, 4, 4); // "abcd...wxyz"

// ALWAYS use cn() for className composition:
<div className={cn(
  "base-classes",
  isActive && "active-classes",
  className // Accept from props
)} />
```

### Type Safety
```typescript
// Import types from /types/index.ts
import { User, FlexPost, PumpFunLiveStream } from '@/types';

// Define component props with TypeScript
interface ComponentProps {
  user: User;
  onUpdate?: (user: User) => void;
  className?: string;
}

// Use type-safe data structures
const post: FlexPost = {
  id: '123',
  user_id: 'abc',
  type: 'earnings_flex', // Type-checked enum
  content: 'My post',
  // ... all required fields
};
```

---

## 🎯 Specific Component Guidelines

### Earnings Display
```typescript
import { EarningsDisplay } from '@/components/posts/EarningsDisplay';

// Use for displaying verified/unverified earnings
<EarningsDisplay 
  amount={50000}
  verified={true}
  tokenAddress="CzX..." // Optional
/>

// Features:
// - Green gradient background
// - Verification badge (verified/pending)
// - Optional token link to Solscan
// - Auto-formatted amount ($50K)
```

### Verification Badge
```typescript
import { VerificationBadge } from '@/components/posts/VerificationBadge';

// Shows checkmark for verified users/posts
{post.verified && <VerificationBadge />}
```

### Avatar with Fallback
```typescript
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

<Avatar className="h-10 w-10">
  <AvatarImage src={user.avatar_url} alt={user.display_name} />
  <AvatarFallback>
    {user.display_name?.charAt(0) || 'U'}
  </AvatarFallback>
</Avatar>
```

### Empty States
```typescript
// Use for empty data scenarios
<div className="flex flex-col items-center justify-center min-h-[400px] text-center">
  <div className="text-6xl mb-4">📭</div>
  <h3 className="text-xl font-semibold text-primary mb-2">No posts yet</h3>
  <p className="text-secondary mb-6">Be the first to share something!</p>
  <Button variant="gradient">Create Post</Button>
</div>
```

### Loading States
```typescript
// Skeleton loaders (use existing PostSkeleton.tsx as reference)
<div className="space-y-4">
  {[1, 2, 3].map(i => (
    <div key={i} className="bg-card-bg rounded-lg p-6 animate-pulse border border-white/10">
      <div className="h-4 bg-white/10 rounded w-3/4 mb-4" />
      <div className="h-20 bg-white/10 rounded" />
    </div>
  ))}
</div>
```

---

## 🚨 Important Rules

### DO's ✅
1. **Always use design system colors**:
   - `bg-app-bg` for page backgrounds (#0a0a0a)
   - `bg-card-bg` for cards (#1a1a1a)
   - `text-primary` for main text (#ffffff)
   - `text-secondary` for secondary text (#888888)
   - `text-link-blue` for links (#3b82f6)
   - `text-metric-green` for gains (#10b981)
   - `text-metric-red` for losses (#ef4444)
2. **Always use `'use client'`** at top of components using hooks/browser APIs
3. **Use `cn()` utility** for all className merging
4. **Import icons** from `lucide-react` OR `@heroicons/react/24/outline`
5. **Accept `className` prop** for composability
6. **Use TypeScript types** from `/types/index.ts`
7. **Format numbers** with utility functions (formatEarnings, formatNumber)
8. **Add transitions** to interactive elements (`transition-colors`)
9. **Follow naming conventions**: PascalCase for components, camelCase for functions
10. **Keep components in correct folders** by feature

### DON'Ts ❌
1. **Never use** `bg-black`, `bg-gray-900`, `bg-gray-800` - use `bg-app-bg` or `bg-card-bg` instead
2. **Never use** `text-white`, `text-gray-400` - use `text-primary` or `text-secondary` instead
3. **Never modify** `/components/ui/*` directly (these are Shadcn base components)
4. **Don't use inline styles** - use Tailwind classes
5. **Don't use arbitrary values** unless absolutely necessary
6. **Don't hardcode colors** - use design system tokens
7. **Don't forget dark mode** - all colors should work on dark background
8. **Don't use generic class names** - be specific
9. **Don't forget loading/error states**
10. **Don't skip TypeScript types** - always define interfaces

---

## 🎨 Common Patterns

### Interactive Cards
```typescript
// Card with hover state and click handler
<Card 
  className="bg-card-bg border-white/10 hover:border-white/20 transition-colors cursor-pointer"
  onClick={() => handleClick()}
>
  <CardContent className="p-6">
    {/* Content */}
  </CardContent>
</Card>
```

### Icon + Text Buttons
```typescript
<Button variant="ghost" size="sm" className="text-secondary hover:text-primary transition-colors">
  <Heart className="h-4 w-4 mr-2" />
  <span>Like</span>
</Button>
```

### Stat Displays
```typescript
<div className="bg-card-bg/50 rounded-lg p-4 text-center border border-white/10">
  <div className="text-metric-green font-bold text-lg">$2.3M</div>
  <div className="text-secondary text-xs">Total Volume</div>
</div>
```

### Live Indicators
```typescript
<Badge className="bg-red-500/20 text-red-300 border-red-500/30 animate-pulse">
  <SignalIcon className="w-3 h-3 mr-1" />
  LIVE
</Badge>
```

### Copy to Clipboard
```typescript
const [copied, setCopied] = useState(false);

const copyToClipboard = async (text: string) => {
  await navigator.clipboard.writeText(text);
  setCopied(true);
  setTimeout(() => setCopied(false), 2000);
};

<Button 
  variant="outline" 
  size="sm"
  onClick={() => copyToClipboard(address)}
>
  {copied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
</Button>
```

---

## 📱 Responsive Design

### Breakpoints (Tailwind default)
```typescript
sm: 640px   // Small devices
md: 768px   // Medium devices  
lg: 1024px  // Large devices
xl: 1280px  // Extra large
2xl: 1536px // 2X Extra large
```

### Common Responsive Patterns
```typescript
// Hide on mobile, show on desktop
<div className="hidden lg:block">Desktop only</div>

// Show on mobile, hide on desktop
<div className="block lg:hidden">Mobile only</div>

// Responsive grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

// Responsive text sizes
<h1 className="text-xl sm:text-2xl lg:text-3xl">

// Responsive padding
<div className="p-4 lg:p-6">
```

---

## 🔗 External Resources

- **Tailwind CSS Docs**: https://tailwindcss.com/docs
- **Shadcn/ui**: https://ui.shadcn.com/
- **Lucide Icons**: https://lucide.dev/icons/
- **Heroicons**: https://heroicons.com/
- **Radix UI**: https://www.radix-ui.com/ (primitives used by Shadcn)

---

## 📝 Quick Reference Checklist

When creating a new component:
- [ ] Add `'use client'` if needed
- [ ] Import necessary UI components from `/components/ui/`
- [ ] Import utilities from `/lib/utils`
- [ ] Define TypeScript interface for props
- [ ] Accept `className` prop
- [ ] Use `cn()` for className composition
- [ ] Add proper TypeScript types
- [ ] Use semantic colors (gray-800 for cards, gray-400 for secondary text)
- [ ] Add transitions to interactive elements
- [ ] Handle loading and error states
- [ ] Test on mobile and desktop
- [ ] Follow existing component patterns in same feature folder

---

**Last Updated**: 2025-10-10
**Version**: 1.0.0

