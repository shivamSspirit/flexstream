# 📋 Sidebar Cheatsheet - Ultra Quick Reference

## 🎯 Breakpoints

```
< 640px    → Bottom nav only
640-767px  → 64px sidebar (compact)
768-1023px → 80px sidebar (full)
1024px+    → 80px sidebar + right panel + tooltips
```

---

## 📱 Device Guide

| Device | Width | Sidebar | Nav |
|--------|-------|---------|-----|
| iPhone | 375px | ❌ | Bottom |
| iPad Mini | 768px | ✅ 80px | Left |
| Laptop | 1280px | ✅ 80px | Left |
| Desktop | 1920px | ✅ 80px | Left |

---

## 🎨 Colors (Use These Always)

```typescript
bg-app-bg        // #0a0a0a
bg-card-bg       // #1a1a1a
text-primary     // #ffffff
text-secondary   // #888888
text-link-blue   // #3b82f6
text-metric-green // #10b981
text-metric-red   // #ef4444
border-white/10  // Borders
```

---

## 🔧 Quick Test

```bash
pnpm dev
# Visit: http://localhost:3000/home
# Resize browser: 375 → 640 → 768 → 1024
```

---

## ✅ Status

**All screens optimized** ✅  
**No linting errors** ✅  
**Production ready** ✅

