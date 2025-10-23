# ExploreCard Component

A reusable React card component inspired by Zora's explore page design, built with Next.js and Tailwind CSS.

## Features

✅ **Responsive Design** - Scales perfectly from mobile to desktop
✅ **Accessibility** - Full keyboard navigation, ARIA labels, proper semantic HTML
✅ **Customizable** - Easy to extend with additional fields or actions
✅ **Badge Support** - Optional NEW/HOT/TRENDING badges
✅ **Hover Effects** - Smooth transitions and visual feedback
✅ **Action Button** - Customizable CTA with click handling
✅ **Stats Display** - Current price, floor price, and holders count with icons
✅ **Time Badge** - Shows relative time ("3m", "1h", etc.)
✅ **Image Optimization** - Lazy loading, aspect ratio preservation
✅ **Clean & Modular** - Production-ready TypeScript code

## Usage

```tsx
import { ExploreCard } from '@/components/explore/ExploreCard';

function MyPage() {
  const cardData = {
    id: '1',
    image: 'https://example.com/image.jpg',
    title: 'Amazing NFT',
    creator: 'artist123',
    badge: { label: 'HOT', variant: 'hot' }, // Optional
    stats: {
      currentPrice: '$150.00',
      floorPrice: '$12.50',
      holders: 25
    },
    timeAgo: '2h',
    actionLabel: 'Buy Now', // Optional, defaults to "View"
    href: '/post/1', // Optional
    onAction: () => console.log('Card clicked!'), // Optional
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <ExploreCard {...cardData} />
    </div>
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `id` | string | ✅ | Unique identifier for the card |
| `image` | string | ✅ | URL of the thumbnail/image |
| `title` | string | ✅ | Asset or post name (bold, large) |
| `creator` | string | ✅ | Creator username or wallet address |
| `badge` | object | ❌ | Optional badge config: `{ label: string, variant: 'new' \| 'hot' \| 'trending' }` |
| `stats` | object | ✅ | Stats object: `{ currentPrice: string, floorPrice: string, holders: number }` |
| `timeAgo` | string | ✅ | Relative time string (e.g., "3m", "1h") |
| `actionLabel` | string | ❌ | Button text (default: "View") |
| `onAction` | function | ❌ | Custom click handler |
| `href` | string | ❌ | Navigation URL (uses Next.js router) |

## Badge Variants

- `new` - Blue badge for new items
- `hot` - Orange badge for hot/popular items
- `trending` - Purple badge for trending items

## Accessibility Features

- ✅ Keyboard navigable (Tab, Enter, Space)
- ✅ ARIA labels for all interactive elements
- ✅ Alt text for images
- ✅ Focus indicators
- ✅ Semantic HTML structure
- ✅ Screen reader friendly

## Customization

The component uses Tailwind CSS classes, making it easy to customize:

```tsx
// Example: Larger cards
<div className="grid grid-cols-2 gap-6">
  <ExploreCard {...data} />
</div>

// Example: Full width on mobile
<div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
  <ExploreCard {...data} />
</div>
```

## Extending the Component

Add new fields by extending the `ExploreCardProps` interface:

```tsx
export interface ExploreCardProps {
  // ... existing props
  customField?: string; // Add your new prop
}

export function ExploreCard({ customField, ...props }: ExploreCardProps) {
  // Use customField in your component
}
```

## Design Tokens

- Background: `#1a1a1a`
- Border: `white/12%` (hover: `white/25%`)
- Border radius: `0.75rem` (xl)
- Text: White with varying opacity
- Accent: Green for prices (`text-green-400`)
- Shadow: `shadow-lg` (hover: `shadow-xl`)

## Performance

- ✅ Lazy loading images
- ✅ Optimized re-renders
- ✅ Minimal bundle size
- ✅ CSS-only transitions
- ✅ No external dependencies (except Next.js & Tailwind)
