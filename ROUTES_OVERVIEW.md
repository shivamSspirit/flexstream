# 📍 FlexStream Routes Overview

## 📊 Total Routes: **37**

---

## 🎯 Production Routes (12)

### Main Pages
1. `/` - **Main Feed** (Root - Updated with new design)
2. `/dashboard` - **Dashboard** (New - with UniversalHeader)
3. `/feed` - Feed page
4. `/explore` - Explore page
5. `/discover` - Discover page
6. `/create` - Create post page

### User & Social
7. `/profile` - User profile
8. `/profile/edit` - Edit profile
9. `/profile/[username]` - Dynamic user profile
10. `/leaderboard` - Top earners leaderboard
11. `/notifications` - Notifications page
12. `/settings` - Settings page

---

## 🔐 Auth Routes (2)

13. `/auth/signin` - Sign in page
14. `/auth/signup` - Sign up page
15. `/verify` - Verification page

---

## 🎮 Live Streaming Routes (3)

16. `/live-streams` - Live streams main
17. `/live-streams-backup` - Backup version
18. `/streams` - Streams page
19. `/streams-simple` - Simple streams
20. `/streams-debug` - Debug streams

---

## 📊 Analytics & Demo Routes (4)

21. `/analytics` - Analytics dashboard
22. `/demo` - Demo page
23. `/demo-flow` - Demo flow
24. `/market-cap-demo` - Market cap demo
25. `/navigation` - Navigation demo

---

## 🧪 Test & Debug Routes (12)

### Test Pages
26. `/test` - Test page
27. `/test-basic` - Basic test
28. `/test-clerk` - Clerk auth test
29. `/test-data` - Data test
30. `/test-pagination` - Pagination test
31. `/test-route` - Route test
32. `/test-simple` - Simple test
33. `/test-wallet` - Wallet test
34. `/test-wallet-simple` - Simple wallet test
35. `/simple-test` - Another test page

### Debug Pages
36. `/debug-pump-fun` - Pump.fun debug
37. `/debug-ui` - UI debug

---

## 📊 Routes by Category

| Category | Count | Status |
|----------|-------|--------|
| **Production Pages** | 12 | ✅ Active |
| **Auth Pages** | 3 | ✅ Active |
| **Streaming Pages** | 5 | ✅ Active |
| **Analytics/Demo** | 5 | ✅ Active |
| **Test/Debug Pages** | 12 | 🔧 Development only |
| **Total** | **37** | |

---

## 🎯 Main User Flow Routes

### Public Routes (No Auth)
```
/                 → Main feed (home)
/explore          → Explore content
/discover         → Discover users
/auth/signin      → Sign in
/auth/signup      → Sign up
```

### Authenticated Routes
```
/                 → Main feed
/create           → Create post
/profile          → User profile
/profile/edit     → Edit profile
/profile/{user}   → View other profiles
/notifications    → Notifications
/settings         → Settings
/leaderboard      → Top earners
/dashboard        → Trading dashboard
```

### Streaming Routes
```
/live-streams     → Live token streams
/streams          → Streams overview
```

---

## 🗂️ Route Structure

```
app/
├── page.tsx                    → /
├── dashboard/page.tsx          → /dashboard
├── feed/page.tsx               → /feed
├── explore/page.tsx            → /explore
├── discover/page.tsx           → /discover
├── create/page.tsx             → /create
├── leaderboard/page.tsx        → /leaderboard
├── analytics/page.tsx          → /analytics
├── notifications/page.tsx      → /notifications
├── settings/page.tsx           → /settings
├── verify/page.tsx             → /verify
├── demo/page.tsx               → /demo
├── demo-flow/page.tsx          → /demo-flow
├── market-cap-demo/page.tsx    → /market-cap-demo
├── navigation/page.tsx         → /navigation
│
├── profile/
│   ├── page.tsx                → /profile
│   ├── edit/page.tsx           → /profile/edit
│   └── [username]/page.tsx     → /profile/{username}
│
├── auth/
│   ├── signin/page.tsx         → /auth/signin
│   └── signup/page.tsx         → /auth/signup
│
├── live-streams/page.tsx       → /live-streams
├── live-streams-backup/page.tsx → /live-streams-backup
├── streams/page.tsx            → /streams
├── streams-simple/page.tsx     → /streams-simple
├── streams-debug/page.tsx      → /streams-debug
│
└── test*/                      → /test* (12 test routes)
```

---

## 🎨 Updated Routes (Using New Design)

Routes now using **UniversalHeader + MinimalSidebar**:

### ✅ Updated
```
/                 → Main feed (NEW design)
/dashboard        → Dashboard (NEW)
Any page using <AppLayout> → Gets new header/sidebar
```

---

## 🔧 Routes to Clean Up (Optional)

### Test Routes (Can be removed in production)
```
/test
/test-basic
/test-clerk
/test-data
/test-pagination
/test-route
/test-simple
/test-wallet
/test-wallet-simple
/simple-test
/debug-pump-fun
/debug-ui
```

### Duplicate/Backup Routes
```
/live-streams-backup  (backup of /live-streams)
/streams-simple       (simple version)
/streams-debug        (debug version)
/feed                 (duplicate of /)
```

**Recommendation**: Remove test/debug routes before production deployment.

---

## 📱 Mobile Navigation Routes

Bottom nav links to:
```
[🏠] Home       → /
[🔍] Explore    → /explore  
[+]  Create     → /create
[🔔] Search     → /notifications (or /search)
[@]  Profile    → /profile
```

---

## 🎯 Recommended Route Cleanup

### Keep (Production)
```
✅ /                    (Main feed)
✅ /dashboard           (Dashboard)
✅ /explore             (Explore)
✅ /discover            (Discover)
✅ /create              (Create post)
✅ /profile             (Profile)
✅ /profile/edit        (Edit profile)
✅ /profile/[username]  (User profiles)
✅ /leaderboard         (Leaderboard)
✅ /notifications       (Notifications)
✅ /settings            (Settings)
✅ /live-streams        (Live streams)
✅ /analytics           (Analytics)
✅ /auth/signin         (Auth)
✅ /auth/signup         (Auth)
```

### Remove (Test/Debug)
```
❌ /test*               (12 test routes)
❌ /debug-*             (2 debug routes)
❌ /demo*               (3 demo routes)
❌ /*-backup            (1 backup route)
❌ /*-simple            (2 simple routes)
❌ /*-debug             (1 debug route)
```

**Clean up command**:
```bash
# Remove test/debug routes (optional)
rm -rf app/test*
rm -rf app/debug-*
rm -rf app/demo*
rm -rf app/simple-test
rm -rf app/live-streams-backup
rm -rf app/streams-simple
rm -rf app/streams-debug
```

---

## ✅ Summary

**Current State**:
- Total Routes: **37**
- Production Routes: **15**
- Test/Debug Routes: **22**

**Recommendation**:
- Keep 15 production routes
- Remove 22 test/debug routes before deployment

---

**Main Entry**: `/` (root)  
**Production Ready**: 15 routes  
**To Clean Up**: 22 routes

