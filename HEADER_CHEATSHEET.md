# 🚀 Universal Header - Quick Reference

## ⚡ TL;DR

**New universal header** with logo, centered search, wallet, and hamburger menu.

---

## 🎯 Visual

```
Desktop:
┌──────────────────────────────────────────────┐
│ [F] FlexStream  [  Search...  ] [Wallet] [☰] │
└──────────────────────────────────────────────┘

Mobile:
┌──────────────────┐
│ [F]    [💰] [☰]  │
└──────────────────┘
```

---

## 🔧 Quick Use

```typescript
import { UniversalHeader } from '@/components/layout/UniversalHeader';

<UniversalHeader 
  onMenuClick={() => setMenuOpen(!menuOpen)}
/>
```

---

## 🎨 Features

- ✅ Logo (far left)
- ✅ Search (centered)
- ✅ Wallet (Solana)
- ✅ Menu (far right)
- ✅ Responsive
- ✅ Dark theme

---

## 📍 Demo

```bash
pnpm dev
# http://localhost:3000/dashboard
```

---

## ✅ Props

```typescript
className?: string       // Custom styles
onMenuClick?: () => void // Menu handler
showWallet?: boolean     // Toggle wallet (default: true)
showSearch?: boolean     // Toggle search (default: true)
```

---

## 🎨 Colors

```typescript
bg-app-bg (#0a0a0a)      // Header
bg-card-bg (#1a1a1a)     // Search, buttons
text-primary (#ffffff)    // Text
text-secondary (#888888)  // Icons
Gradient (purple→pink)    // Logo, wallet
```

---

## ✅ Status

**Production ready** ✅  
**No linting errors** ✅  
**Fully responsive** ✅  
**Design system applied** ✅

