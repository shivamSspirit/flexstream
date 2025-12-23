# Social Engagement Features - Smooth & Viral

## 🎯 Overview

FlexStream's social engagement system is designed following **Nikita Bier's viral principles**:
- ⚡ **Instant feedback** - Optimistic updates for zero perceived latency
- 📱 **Mobile-first** - Haptic feedback and native sharing
- 🔥 **Viral loops** - Easy sharing with rewards
- ✨ **Micro-interactions** - Smooth animations and transitions

---

## 🚀 Features

### 1. ❤️ Like System

**Location**: `hooks/useLike.ts`

#### Key Features:
- ✅ **Optimistic UI Updates** - Button responds instantly
- ✅ **Haptic Feedback** - 10ms vibration on mobile
- ✅ **Auto-rollback** - Reverts on API failure
- ✅ **No spam toasts** - Subtle, non-intrusive feedback
- ✅ **Notifications** - Post author gets notified

#### Usage:
```tsx
import { useLike } from '@/hooks/useLike';

const { liked, toggleLike, isLoading } = useLike(postId, userId);

<button onClick={toggleLike} disabled={isLoading}>
  <Heart className={liked ? 'fill-red-500' : ''} />
</button>
```

#### API Endpoint:
- **POST** `/api/posts/like` - Toggle like/unlike
- **GET** `/api/posts/like?postId=xxx&userId=xxx` - Check like status

#### Flow:
```
User Clicks Like
    ↓
Optimistic Update (Instant UI change)
    ↓
Haptic Feedback (10ms vibration)
    ↓
API Call
    ↓
Success: Keep change ✅
Failure: Rollback ↩️
```

---

### 2. 💬 Comment System

**Location**: `hooks/useComments.ts`

#### Key Features:
- ✅ **Optimistic Comments** - Show immediately while saving
- ✅ **Haptic Feedback** - 15ms vibration on submit
- ✅ **Character Limit** - 500 characters max
- ✅ **Reply Support** - Threaded comments with parentId
- ✅ **Notifications** - Post author + parent commenter get notified
- ✅ **Real-time Display** - "You" shown for temp comments

#### Usage:
```tsx
import { useComments } from '@/hooks/useComments';

const { comments, addComment, isAddingComment } = useComments(postId);

// Add comment
addComment({
  userId,
  content: 'Great post!',
  parentId: optionalParentCommentId
});
```

#### API Endpoint:
- **POST** `/api/posts/comment` - Add comment
- **GET** `/api/posts/comment?postId=xxx` - Get all comments

#### Flow:
```
User Submits Comment
    ↓
Create Temp Comment (Shows as "You")
    ↓
Haptic Feedback (15ms vibration)
    ↓
API Call
    ↓
Success: Replace temp with real comment ✅
Failure: Remove temp comment ↩️
```

---

### 3. 🔗 Share System

**Location**: `components/posts/ShareModal.tsx`

#### Key Features:
- ✅ **Native Web Share API** - Use phone's native share sheet
- ✅ **Platform Sharing** - X (Twitter), WhatsApp, Telegram, Reddit
- ✅ **Copy Link** - Clipboard with toast feedback
- ✅ **Haptic Feedback** - 10ms vibration on copy/share
- ✅ **Referral Rewards** - "Earn when someone buys" banner
- ✅ **Auto-detect** - Shows native share button on supported devices

#### Supported Platforms:
| Platform | Share Method | Notes |
|----------|--------------|-------|
| **X (Twitter)** | Intent URL | Opens tweet composer |
| **WhatsApp** | wa.me URL | Pre-fills message + link |
| **Telegram** | t.me/share | Share URL popup |
| **Reddit** | Submit URL | Opens Reddit submit page |
| **Instagram** | Copy fallback | No direct URL sharing |
| **Native Share** | Web Share API | Mobile only - uses OS share sheet |

#### Usage:
```tsx
import { ShareModal } from '@/components/posts/ShareModal';

<ShareModal
  isOpen={showShareModal}
  onClose={() => setShowShareModal(false)}
  postUrl={`https://flexstream.com/post/${post.id}`}
  postId={post.id}
  postTitle={post.title}
/>
```

#### Native Share Detection:
```javascript
// Auto-detects on mount
if (navigator.share) {
  setSupportsNativeShare(true);
}
```

---

## 🎨 UI/UX Principles

### Optimistic Updates
**Why**: Users expect instant feedback. Waiting for server responses feels slow.

**How**: Update UI immediately, rollback on error.

```typescript
onMutate: async () => {
  // 1. Update UI instantly
  setOptimisticLiked(!currentLiked);

  // 2. Haptic feedback
  navigator.vibrate(10);

  // 3. Return rollback data
  return { previousLiked: currentLiked };
},
onError: (error, variables, context) => {
  // Rollback if API fails
  setOptimisticLiked(context.previousLiked);
}
```

### Haptic Feedback
**Why**: Creates tactile connection between action and result.

**How**: Short vibrations (10-15ms) on interactions.

```typescript
if ('vibrate' in navigator) {
  navigator.vibrate(10); // Like
  navigator.vibrate(15); // Comment
}
```

### Toast Strategy
**When to use**:
- ✅ Comments - User needs confirmation
- ✅ Share - User needs copy feedback
- ✅ Errors - User needs to know what failed

**When NOT to use**:
- ❌ Likes - Too frequent, use visual feedback
- ❌ Success on optimistic actions - Already obvious

---

## 📊 Database Schema

### `likes` table
```sql
CREATE TABLE likes (
  id UUID PRIMARY KEY,
  post_id UUID REFERENCES posts(id),
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP,
  UNIQUE(post_id, user_id) -- Prevent duplicate likes
);
```

### `comments` table
```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY,
  post_id UUID REFERENCES posts(id),
  user_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id), -- For replies
  created_at TIMESTAMP
);
```

### `notifications` table
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id), -- Recipient
  type VARCHAR(50), -- 'like', 'comment', 'reply'
  from_user_id UUID REFERENCES users(id), -- Who did the action
  post_id UUID REFERENCES posts(id),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP
);
```

---

## 🔥 Viral Loop Strategy

### Share-to-Earn Mechanism
1. User shares post with unique link
2. Friend clicks link and buys token
3. Original sharer earns commission
4. Sharer shares again → viral loop

### Implementation:
```typescript
// Add referral code to share URL
const shareUrl = `${postUrl}?ref=${userId}`;

// Track in database when someone buys via referral
// Reward the referrer with percentage of transaction
```

---

## 🧪 Testing

### Manual Testing Checklist

#### Like Feature:
- [ ] Click like - should toggle instantly
- [ ] Unlike - should toggle back instantly
- [ ] Refresh page - like state persists
- [ ] Network error - should rollback
- [ ] Not logged in - shows "Connect wallet" toast

#### Comment Feature:
- [ ] Add comment - shows immediately as "You"
- [ ] Comment saves - replaces temp with real data
- [ ] 500 char limit - prevents longer comments
- [ ] Reply to comment - shows nested
- [ ] Empty comment - prevented

#### Share Feature:
- [ ] Copy link - shows success toast
- [ ] Share to X - opens Twitter
- [ ] Share to WhatsApp - opens WhatsApp
- [ ] Native share (mobile) - opens OS share sheet
- [ ] All platforms open correctly

---

## 📱 Mobile Considerations

### Haptic Feedback Support
```javascript
// Check support
if ('vibrate' in navigator) {
  // Device supports haptics
}

// Duration guide:
10ms  - Light tap (like, copy)
15ms  - Medium tap (comment, share)
25ms  - Strong tap (error, warning)
```

### Native Share API
```javascript
// Feature detection
if (navigator.share) {
  // Use native sharing
  await navigator.share({
    title: 'Post Title',
    text: 'Check this out!',
    url: 'https://...'
  });
} else {
  // Fallback to copy link
}
```

---

## 🚀 Performance Optimizations

### React Query Configuration
```typescript
// Comments cache
staleTime: 30000, // 30 seconds - balance freshness vs requests

// Likes cache
staleTime: 0, // Always fresh - critical for accurate counts
```

### Optimistic Updates
- **Reduces perceived latency** by 100-500ms
- **Improves user satisfaction** - instant feedback
- **Increases engagement** - smoother experience

---

## 📈 Metrics to Track

### Engagement Metrics:
- Like rate per post
- Comment rate per post
- Share rate per post
- Time to first engagement
- Engagement retention (7-day)

### Technical Metrics:
- API response time (likes, comments, shares)
- Optimistic update accuracy (rollback rate)
- Share conversion rate (clicks → buys)

---

## 🎯 Future Enhancements

### Phase 2:
- [ ] Real-time comments (WebSockets/Supabase Realtime)
- [ ] Comment reactions (👍 ❤️ 😂)
- [ ] Rich text comments (markdown support)
- [ ] Image comments/replies
- [ ] Share analytics (who clicked your link)

### Phase 3:
- [ ] Live like counter animations
- [ ] Comment sorting (top, newest, oldest)
- [ ] Comment moderation tools
- [ ] Verified commenter badges
- [ ] Share-to-earn tracking dashboard

---

## 🛠️ Troubleshooting

### Like not updating:
1. Check browser console for errors
2. Verify userId is set (wallet connected)
3. Check `/api/posts/like` endpoint logs
4. Verify `likes` table exists in database

### Comments not saving:
1. Check 500 char limit
2. Verify userId and postId are valid UUIDs
3. Check `/api/posts/comment` endpoint logs
4. Verify `comments` table and foreign keys exist

### Share not working:
1. Check if running on HTTPS (required for Web Share API)
2. Verify postUrl is valid
3. Check platform-specific share URL format
4. Test on different devices/browsers

---

**Last Updated**: 2025-12-23
**Version**: 1.0.0
**Status**: ✅ Production Ready

🎉 **Happy Engaging!**
