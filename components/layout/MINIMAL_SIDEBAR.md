# 🎨 Minimal Sidebar Component

## Overview

A sleek, icon-only left sidebar designed for desktop crypto trading/social app navigation. Features vertical icon alignment, hover effects, and seamless dark theme integration.

---

## 🎯 Features

### ✅ Implemented
- **Rounded brand icon** at top (gradient "F" logo)
- **Home icon** button with active state
- **Search icon** button
- **Plus icon** for creating posts
- **Notification icon** with unread badge (shows "1")
- **Profile avatar** at bottom with online status
- **Hover tooltips** for each icon
- **Active state indicator** (left gradient bar)
- **Smooth transitions** on all interactions
- **Design system colors** throughout

---

## 📐 Layout

```
┌────────────┐
│     F      │  ← Brand icon (gradient)
│            │
│    🏠      │  ← Home (active)
│  ──        │  ← Active indicator
│            │
│    🔍      │  ← Search
│            │
│    ➕      │  ← Create
│            │
│    🔔 ①   │  ← Notifications (with badge)
│            │
│            │
│     •      │
│            │
│    [@]     │  ← Profile avatar (bottom)
│     •      │  ← Online status
└────────────┘
```

---

## 🎨 Design Details

### Dimensions
```typescript
Width: 80px (w-20)
Height: 100vh (full screen)
Position: Fixed left
Z-index: 40
```

### Colors (Design System)
```typescript
Background: bg-app-bg (#0a0a0a)
Border: border-white/10
Icons (inactive): text-secondary (#888888)
Icons (active): text-primary (#ffffff)
Hover background: bg-card-bg (#1a1a1a)
Brand gradient: purple-600 to pink-600
Badge: bg-metric-red (#ef4444)
Online status: bg-metric-green (#10b981)
```

### Spacing
```typescript
Padding: py-6 (vertical)
Icon size: w-12 h-12 (48px)
Icon inner: w-6 h-6 (24px)
Space between: space-y-4 (16px)
Brand margin: mb-8
```

---

## 💡 Interactive States

### Default State
- Icons in `text-secondary` (#888888)
- No background
- No active indicator

### Hover State
- Background: `bg-card-bg` (#1a1a1a)
- Icon color: `text-primary` (#ffffff)
- Tooltip appears (left side)
- Scale: `hover:scale-105` on brand/avatar
- Transition: 200ms

### Active State
- Background: `bg-card-bg`
- Icon color: `text-primary`
- Filled icon (solid version)
- Left gradient bar (purple to pink)
- Subtle shadow

---

## 🔔 Notification Badge

```typescript
Position: absolute -top-1 -right-1
Size: w-5 h-5 (20px)
Background: bg-metric-red
Border: 2px border-app-bg
Text: text-xs
Number: {unreadNotifications}
```

---

## 👤 Profile Avatar Features

### Avatar
- Size: h-11 w-11 (44px)
- Border: 2px border-white/10
- Hover: border-white/20 + scale-105
- Fallback: Gradient background with "U"

### Online Status
- Position: absolute bottom-0 right-0
- Size: w-3 h-3 (12px)
- Color: bg-metric-green (#10b981)
- Border: 2px border-app-bg
- Always visible

---

## 🖱️ Hover Tooltips

All buttons have tooltips that appear on hover:

```typescript
Style: 
- Background: bg-card-bg
- Border: border-white/10
- Text: text-primary text-sm
- Position: left-full ml-4
- Shadow: shadow-xl
- Transition: opacity

Labels:
- "Home"
- "Search"
- "Create"
- "Notifications"
- "Profile"
```

---

## 📱 Responsive Behavior

```typescript
Mobile (< lg): 
  - Sidebar hidden (hidden lg:flex)
  - Bottom navigation used instead

Desktop (>= lg):
  - Sidebar visible
  - Fixed to left side
  - Main content has lg:pl-20 offset
```

---

## 🔧 Usage

### Import
```typescript
import { MinimalSidebar } from '@/components/layout/MinimalSidebar';
```

### Basic Usage
```typescript
<MinimalSidebar />
```

### With Custom Class
```typescript
<MinimalSidebar className="custom-class" />
```

### In Layout
```typescript
<div className="min-h-screen bg-app-bg">
  <MinimalSidebar />
  
  <div className="lg:pl-20">
    {/* Main content with offset */}
    <main>...</main>
  </div>
</div>
```

---

## 🎯 Component Props

```typescript
interface MinimalSidebarProps {
  className?: string;  // Optional additional classes
}
```

---

## 🎨 Customization

### Change Brand Icon
```typescript
// Line 37-43
<button className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600">
  <span className="text-white font-bold text-xl">F</span>
  {/* Replace "F" with your logo/icon */}
</button>
```

### Update Navigation Items
```typescript
// Line 21-43
const navItems = [
  {
    icon: HomeIcon,
    iconSolid: HomeIconSolid,
    path: '/home',
    label: 'Home',
  },
  // Add more items...
];
```

### Change Notification Count
```typescript
// Line 19
const [unreadNotifications] = useState(1);
// Update state or pass as prop
```

### Update Profile Avatar
```typescript
// Line 116-121
<AvatarImage
  src="YOUR_IMAGE_URL"
  alt="Profile"
/>
```

---

## ✨ Animations

### Brand Icon
```typescript
hover:scale-105 transition-transform
shadow-lg shadow-purple-500/25
```

### Navigation Buttons
```typescript
transition-all duration-200
hover:bg-card-bg
```

### Active Indicator
```typescript
// Gradient bar
w-1 h-8 bg-gradient-to-b from-purple-600 to-pink-600 rounded-r-full
```

### Tooltips
```typescript
opacity-0 → group-hover:opacity-100
transition-opacity
```

### Avatar
```typescript
hover:border-white/20 transition-all duration-200 hover:scale-105
```

---

## 🎯 Active State Logic

```typescript
const isActive = (path: string) => pathname === path;

// For each item:
const active = isActive(item.path);
const Icon = active ? item.iconSolid : item.icon;
```

Uses solid icons when active, outline icons when inactive.

---

## 📊 Icon Library

Uses Heroicons:
```typescript
import {
  HomeIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  BellIcon,
} from '@heroicons/react/24/outline';

import {
  HomeIcon as HomeIconSolid,
  MagnifyingGlassIcon as MagnifyingGlassIconSolid,
  PlusIcon as PlusIconSolid,
  BellIcon as BellIconSolid,
} from '@heroicons/react/24/solid';
```

---

## 🔗 Related Components

- **Home Page**: `app/home/page.tsx` (uses MinimalSidebar)
- **Mobile Nav**: Bottom navigation for mobile
- **Avatar**: `components/ui/avatar.tsx`
- **Badge**: `components/ui/badge.tsx`

---

## 📝 Notes

### Design Decisions
1. **Icon-only**: Keeps sidebar minimal at 80px
2. **Tooltips**: Show labels on hover instead of text
3. **Fixed position**: Always visible while scrolling
4. **Vertical layout**: Natural top-to-bottom flow
5. **Brand at top**: Establishes hierarchy
6. **Profile at bottom**: Common UX pattern

### Accessibility
- `aria-label` on all buttons
- Keyboard navigation support
- Hover states for visual feedback
- High contrast ratios
- Large touch targets (48px)

### Performance
- Client component (`'use client'`)
- Minimal re-renders (uses `usePathname`)
- Optimized transitions (GPU-accelerated)
- No external dependencies

---

## 🚀 Future Enhancements

Potential additions:
- [ ] Collapse/expand functionality
- [ ] User settings in avatar menu
- [ ] Keyboard shortcuts
- [ ] More navigation items
- [ ] Custom theme colors
- [ ] Animation on mount
- [ ] Notification dropdown
- [ ] Quick actions menu

---

**Component**: MinimalSidebar  
**Location**: `components/layout/MinimalSidebar.tsx`  
**Status**: ✅ Production Ready  
**Version**: 1.0.0

