# 🎨 Color Migration Guide - Old vs New

## Quick Reference: Old → New Color Mapping

| Old (Generic) | New (Design System) | Hex Code | Usage |
|--------------|---------------------|----------|-------|
| `bg-black` | `bg-app-bg` | #0a0a0a | Page backgrounds |
| `bg-gray-900` | `bg-app-bg` | #0a0a0a | Page backgrounds |
| `bg-gray-800` | `bg-card-bg` | #1a1a1a | Card backgrounds |
| `text-white` | `text-primary` | #ffffff | Headings, body text |
| `text-gray-400` | `text-secondary` | #888888 | Labels, timestamps |
| `text-gray-500` | `text-secondary` | #888888 | Tertiary text |
| `text-blue-400` | `text-link-blue` | #3b82f6 | Links |
| `text-green-400` | `text-metric-green` | #10b981 | Positive metrics |
| `text-red-400` | `text-metric-red` | #ef4444 | Negative metrics |
| `border-gray-700` | `border-white/10` | rgba(255,255,255,0.1) | Card borders |
| `border-gray-600` | `border-white/20` | rgba(255,255,255,0.2) | Hover borders |

---

## Before & After Examples

### Example 1: Card Component

#### ❌ BEFORE (Old)
```typescript
<Card className="bg-gray-800 border-gray-700 hover:border-gray-600">
  <CardHeader>
    <h3 className="text-white font-bold">Title</h3>
    <p className="text-gray-400 text-sm">Description</p>
  </CardHeader>
  <CardContent>
    <span className="text-white">Content</span>
    <span className="text-gray-500">Info</span>
  </CardContent>
</Card>
```

#### ✅ AFTER (New)
```typescript
<Card className="bg-card-bg border-white/10 hover:border-white/20 transition-colors">
  <CardHeader>
    <h3 className="text-primary font-bold">Title</h3>
    <p className="text-secondary text-sm">Description</p>
  </CardHeader>
  <CardContent>
    <span className="text-primary">Content</span>
    <span className="text-secondary">Info</span>
  </CardContent>
</Card>
```

---

### Example 2: Page Layout

#### ❌ BEFORE (Old)
```typescript
<div className="min-h-screen bg-gray-900">
  <header className="bg-black border-b border-gray-800">
    <h1 className="text-white">FlexStream</h1>
  </header>
  <main className="p-6">
    <h2 className="text-white text-2xl">Welcome</h2>
    <p className="text-gray-400">Your dashboard</p>
  </main>
</div>
```

#### ✅ AFTER (New)
```typescript
<div className="min-h-screen bg-app-bg">
  <header className="bg-app-bg/95 border-b border-white/10">
    <h1 className="text-primary">FlexStream</h1>
  </header>
  <main className="p-6">
    <h2 className="text-primary text-2xl">Welcome</h2>
    <p className="text-secondary">Your dashboard</p>
  </main>
</div>
```

---

### Example 3: Stats Display

#### ❌ BEFORE (Old)
```typescript
<div className="bg-gray-800 rounded-lg p-4">
  <div className="text-green-400 font-bold">+24.5%</div>
  <div className="text-gray-400 text-xs">24h Change</div>
  
  <div className="text-blue-400 mt-2">$1.2M</div>
  <div className="text-gray-500 text-xs">Volume</div>
</div>
```

#### ✅ AFTER (New)
```typescript
<div className="bg-card-bg border border-white/10 rounded-lg p-4">
  <div className="text-metric-green font-bold">+24.5%</div>
  <div className="text-secondary text-xs">24h Change</div>
  
  <div className="text-link-blue mt-2">$1.2M</div>
  <div className="text-secondary text-xs">Volume</div>
</div>
```

---

### Example 4: Button with Hover States

#### ❌ BEFORE (Old)
```typescript
<Button 
  variant="ghost" 
  className="text-gray-400 hover:text-white"
>
  <Heart className="w-4 h-4" />
  Like
</Button>
```

#### ✅ AFTER (New)
```typescript
<Button 
  variant="ghost" 
  className="text-secondary hover:text-primary transition-colors"
>
  <Heart className="w-4 h-4" />
  Like
</Button>
```

---

### Example 5: Links

#### ❌ BEFORE (Old)
```typescript
<a 
  href="/profile" 
  className="text-blue-400 hover:text-blue-300"
>
  View Profile
</a>
```

#### ✅ AFTER (New)
```typescript
<a 
  href="/profile" 
  className="text-link-blue hover:text-link-blue/80 transition-colors"
>
  View Profile
</a>
```

---

### Example 6: Sidebar Navigation

#### ❌ BEFORE (Old)
```typescript
<aside className="bg-gray-900 border-r border-gray-800">
  <nav className="p-4">
    <button className="text-gray-400 hover:text-white hover:bg-gray-800">
      Home
    </button>
    <button className="text-gray-400 hover:text-white hover:bg-gray-800">
      Profile
    </button>
  </nav>
</aside>
```

#### ✅ AFTER (New)
```typescript
<aside className="bg-app-bg border-r border-white/10">
  <nav className="p-4">
    <button className="text-secondary hover:text-primary hover:bg-card-bg transition-colors">
      Home
    </button>
    <button className="text-secondary hover:text-primary hover:bg-card-bg transition-colors">
      Profile
    </button>
  </nav>
</aside>
```

---

### Example 7: Metric Cards

#### ❌ BEFORE (Old)
```typescript
<div className="grid grid-cols-2 gap-4">
  <div className="bg-gray-800 p-4 rounded-lg">
    <div className="text-green-400 text-lg font-bold">$50K</div>
    <div className="text-gray-400 text-sm">Earnings</div>
  </div>
  
  <div className="bg-gray-800 p-4 rounded-lg">
    <div className="text-red-400 text-lg font-bold">-$2K</div>
    <div className="text-gray-400 text-sm">Losses</div>
  </div>
</div>
```

#### ✅ AFTER (New)
```typescript
<div className="grid grid-cols-2 gap-4">
  <div className="bg-card-bg border border-white/10 p-4 rounded-lg">
    <div className="text-metric-green text-lg font-bold">$50K</div>
    <div className="text-secondary text-sm">Earnings</div>
  </div>
  
  <div className="bg-card-bg border border-white/10 p-4 rounded-lg">
    <div className="text-metric-red text-lg font-bold">-$2K</div>
    <div className="text-secondary text-sm">Losses</div>
  </div>
</div>
```

---

## Migration Checklist

Use this checklist when updating any component:

- [ ] Replace `bg-black` or `bg-gray-900` with `bg-app-bg`
- [ ] Replace `bg-gray-800` with `bg-card-bg`
- [ ] Replace `text-white` with `text-primary`
- [ ] Replace `text-gray-400` or `text-gray-500` with `text-secondary`
- [ ] Replace `text-blue-400` with `text-link-blue`
- [ ] Replace `text-green-400` with `text-metric-green`
- [ ] Replace `text-red-400` with `text-metric-red`
- [ ] Replace `border-gray-700` with `border-white/10`
- [ ] Replace `border-gray-600` with `border-white/20`
- [ ] Add `transition-colors` to interactive elements
- [ ] Test hover states

---

## Find & Replace Guide

Use these find/replace commands in your editor:

```bash
# Backgrounds
Find:    bg-gray-900
Replace: bg-app-bg

Find:    bg-gray-800
Replace: bg-card-bg

# Text
Find:    text-white
Replace: text-primary

Find:    text-gray-400
Replace: text-secondary

Find:    text-gray-500
Replace: text-secondary

# Links
Find:    text-blue-400
Replace: text-link-blue

# Metrics
Find:    text-green-400
Replace: text-metric-green

Find:    text-red-400
Replace: text-metric-red

# Borders
Find:    border-gray-800
Replace: border-white/10

Find:    border-gray-700
Replace: border-white/10

Find:    border-gray-600
Replace: border-white/20
```

---

## Benefits Summary

### Before (Generic Colors)
- ❌ Hard to maintain
- ❌ Inconsistent across components
- ❌ No semantic meaning
- ❌ Difficult to change theme

### After (Design System)
- ✅ Easy to maintain
- ✅ Consistent everywhere
- ✅ Clear semantic meaning
- ✅ Simple theme updates
- ✅ Better readability
- ✅ Type-safe with Tailwind

---

**Quick Tip**: When in doubt, refer to `/DESIGN_SYSTEM.md` for the complete guide!

