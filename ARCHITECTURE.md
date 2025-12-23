# FlexStream Architecture Documentation

## 🏗️ System Architecture Overview

### Data Flow Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                     User Creates Post                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│         POST /api/posts/create (Token Creation)              │
│  Location: app/api/posts/create/route.ts                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
┌───────────────┐           ┌──────────────────┐
│ 1. User Setup │           │ 2. Media Upload  │
│ ──────────────│           │ ─────────────────│
│ • Find/Create │           │ • Supabase       │
│   User        │           │   Storage        │
│ • Table:users │           │ • Bucket:        │
└───────┬───────┘           │   post-media     │
        │                   └────────┬─────────┘
        │                            │
        └─────────┬──────────────────┘
                  │
                  ▼
     ┌────────────────────────┐
     │ 3. Token Creation      │
     │ ───────────────────────│
     │ • Generate unique      │
     │   symbol (anti-rug)    │
     │ • Upload metadata      │
     │ • Create DBC token     │
     │ • Meteora integration  │
     └───────┬────────────────┘
             │
     ┌───────┴──────────┐
     │                  │
     ▼                  ▼
┌─────────────┐  ┌────────────────┐
│ 4. Save Post│  │ 5. Save Token  │
│ ────────────│  │ ───────────────│
│ • Table:    │  │ • Table: tokens│
│   posts     │  │ • mint_address │
│ • user_id   │  │ • pool_address │
│ • token_*   │  │ • is_verified  │
└─────────────┘  └────────────────┘
```

---

## 📊 Database Schema

### Core Tables

#### `users`
```sql
- id: uuid (PK)
- wallet_address: text
- username: text (unique, URL-friendly)
- display_name: text
- avatar_url: text
- bio: text
- verified_earnings: number
- success_tier: enum
- created_at: timestamp
```

#### `posts`
```sql
- id: uuid (PK)
- user_id: uuid (FK → users.id) ⚠️ CRITICAL
- type: enum ('trading_journey', 'earnings_flex', etc.)
- title: text
- content: text
- media_urls: text[]
- token_mint: text (Solana address)
- token_symbol: text (unique auto-generated)
- token_display_name: text (user's choice, can duplicate)
- token_is_verified: boolean
- pool_address: text
- verified: boolean
- created_at: timestamp
```

#### `tokens`
```sql
- id: uuid (PK)
- mint_address: text (Solana token address)
- symbol: text (unique)
- display_name: text (can duplicate)
- creator_wallet: text
- post_id: uuid (FK → posts.id)
- pool_address: text
- is_verified: boolean
- created_at: timestamp
```

---

## 🔌 API Routes

### POST /api/posts/create
**Purpose**: Create post and launch token
**Location**: `app/api/posts/create/route.ts`
**Flow**:
1. Validate inputs (title, content, wallet, ticker, media)
2. Find or create user by wallet_address
3. Upload media files to Supabase Storage
4. Generate unique symbol (anti-rug)
5. Create DBC token on Solana
6. Save post with user_id
7. Save token data
8. Return complete post object with user info

**Critical**: Returns post with `users` field populated via JOIN

---

### GET /api/posts
**Purpose**: Fetch posts with user info
**Location**: `app/api/posts/route.ts`
**Query Params**:
- `userId` - Filter by user (optional)
- `limit` - Number of posts (default: 20)
- `offset` - Pagination offset (default: 0)

**Response**:
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": "...",
        "user_id": "...",
        "title": "...",
        "users": {
          "id": "...",
          "username": "...",
          "display_name": "...",
          "avatar_url": "...",
          "wallet_address": "..."
        }
      }
    ],
    "count": 0,
    "limit": 20,
    "offset": 0
  }
}
```

**Debugging Features**:
- Lines 113-200: Extensive logging for user_id mismatch detection
- Checks for duplicate user profiles
- Shows which wallets own posts

---

### GET /api/users/stats
**Purpose**: Get user statistics
**Location**: `app/api/users/stats/route.ts`
**Query Params**: `userId`

**Response**:
```json
{
  "success": true,
  "data": {
    "posts_count": 0,      // FROM posts WHERE user_id = userId
    "tokens_created": 0,    // Same as posts_count (1 post = 1 token)
    "total_holders": 0,     // TODO: On-chain data
    "tokens_holding": 0     // TODO: On-chain data
  }
}
```

---

## 🎣 React Hooks

### `usePosts(options)`
**Location**: `hooks/usePosts.ts`
**Purpose**: Fetch posts from API
**Options**:
- `userId?: string` - Filter by user
- `limit?: number` - Number of posts
- `offset?: number` - Pagination
- `enabled?: boolean` - Enable/disable query

**Features**:
- No caching (staleTime: 0)
- Auto-refetch on mount, focus, reconnect
- React Query powered

---

### `useUserStats(userId)`
**Location**: `hooks/useUserStats.ts`
**Purpose**: Fetch user statistics
**Returns**: `{ posts_count, tokens_created, total_holders, tokens_holding }`

---

## 📱 Page Components

### Main Feed (`app/page.tsx`)
**Component**: `SimpleFeed`
**Data Source**: `usePosts()` - NO userId filter
**Shows**: All posts, newest first

### Profile Page (`app/profile/[username]/page.tsx`)
**Component**: Profile view with tabs
**Data Source**: `usePosts({ userId: profile.id })`
**Shows**: Only user's posts

### Explore Page (`app/explore/page.tsx`)
**Data Source**: `/api/posts`
**Shows**: Posts with token data for discovery

---

## 🐛 Common Issues & Debugging

### Issue: Posts Not Showing in Feed/Profile

**Diagnostic Checklist**:

1. **Check user_id consistency**:
   - Post creation uses: `user.id` from users table
   - Profile fetches uses: `profile.id` from users table
   - These MUST match

2. **Check for duplicate users**:
   ```sql
   SELECT id, username, wallet_address, created_at
   FROM users
   WHERE wallet_address = 'YOUR_WALLET'
   ORDER BY created_at
   ```

3. **Verify post ownership**:
   ```sql
   SELECT p.id, p.title, p.user_id, u.username, u.wallet_address
   FROM posts p
   JOIN users u ON p.user_id = u.id
   ORDER BY p.created_at DESC
   LIMIT 10
   ```

4. **Check API logs**:
   - `/api/posts` has extensive debugging (lines 98-200)
   - Look for "ZERO posts found" warnings
   - Check "DIAGNOSIS" section in logs

---

## 🔐 Anti-Rug Mechanism

**Concept**: First token with a display_name gets verified

**Flow**:
1. User chooses `displayName` (e.g., "PEPE")
2. System generates unique `symbol` (e.g., "PEPE_a1b2c3")
3. Check if any token has this `display_name`
4. If first: `is_verified = true`
5. If duplicate: `is_verified = false`

**Benefits**:
- Prevents rug pulls by making copycats obvious
- Original creators get verification badge
- Users can still create similar tokens (freedom)

---

## 🚀 Performance Optimizations

### Caching Strategy
- **Posts**: No cache (staleTime: 0) - Always fresh
- **User Stats**: No cache - Real-time counts
- **React Query**: Auto-refetch on mount/focus/reconnect

### Database Queries
- Use LEFT JOIN to include posts even if user info missing
- Single query for posts with user data (no N+1)
- COUNT queries use `head: true` for efficiency

---

## 📁 File Structure

```
app/
├── api/
│   ├── posts/
│   │   ├── create/route.ts      # Token creation
│   │   └── route.ts             # Fetch posts
│   └── users/
│       └── stats/route.ts       # User statistics
├── page.tsx                     # Main feed
├── profile/
│   ├── [username]/page.tsx      # User profile
│   └── edit/page.tsx            # Edit profile
└── explore/page.tsx             # Discovery

components/
├── feed/
│   └── SimpleFeed.tsx           # Main feed component
└── posts/
    └── PostCard.tsx             # Post display

hooks/
├── usePosts.ts                  # Posts fetching
└── useUserStats.ts              # Statistics

lib/
├── supabase.ts                  # Supabase client
└── meteora-dbc.ts               # Token creation
```

---

## 🔍 Debugging Commands

### Check posts in database:
```bash
# In Supabase SQL Editor:
SELECT COUNT(*) FROM posts;
SELECT * FROM posts ORDER BY created_at DESC LIMIT 5;
```

### Check users:
```bash
SELECT COUNT(*) FROM users;
SELECT id, username, wallet_address FROM users LIMIT 10;
```

### Check user-post relationships:
```bash
SELECT
  u.username,
  u.wallet_address,
  COUNT(p.id) as post_count
FROM users u
LEFT JOIN posts p ON u.id = p.user_id
GROUP BY u.id, u.username, u.wallet_address
ORDER BY post_count DESC;
```

---

## 📝 Next Steps for Improvement

1. ✅ Implement token holder tracking (on-chain data)
2. ✅ Add pagination for large feeds
3. ✅ Cache strategy for static content
4. ✅ Real-time updates via Supabase subscriptions
5. ✅ Analytics and metrics tracking

---

**Last Updated**: 2025-12-23
**Version**: 1.0
