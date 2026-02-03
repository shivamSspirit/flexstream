# Flexit MVP - One Week Launch Plan

**Goal:** Launch Flexit MVP by end of week
**Start Date:** Week of Jan 27, 2025
**Target Launch:** Feb 3, 2025

---

## MVP Feature Matrix

| Feature | Priority | Status | Day |
|---------|----------|--------|-----|
| Creator Token (Activation) | P1 | Done | - |
| Basic Posting/Feed | P1 | Done | - |
| FLEX Points System | P2 | Build | Day 1-2 |
| Tips (USDC) | P2 | Build | Day 2-3 |
| Prediction Markets (Kalshi) | P2 | Build | Day 3-4 |
| Token-Gated Content | P2 | Build | Day 4-5 |
| Promoted Launches | P2 | Build | Day 5-6 |
| Polish & Launch Prep | P2 | Build | Day 6-7 |

---

## Day-by-Day Breakdown

### Day 1: FLEX Points - Database & Core Logic

**Tasks:**
- [ ] Create FLEX Points database schema
- [ ] Create flex_transactions table for history
- [ ] Create flex_multipliers table for events
- [ ] Build `/api/flex/balance` endpoint
- [ ] Build `/api/flex/earn` endpoint
- [ ] Build `/api/flex/leaderboard` endpoint
- [ ] Create `useFlexPoints` hook

**Database Schema:**

```sql
-- Core FLEX points table
CREATE TABLE flex_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  total_flex BIGINT DEFAULT 0,
  available_flex BIGINT DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_active_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- FLEX transactions history
CREATE TABLE flex_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  amount INTEGER NOT NULL,
  multiplier DECIMAL(3,2) DEFAULT 1.0,
  final_amount INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Multiplier events (2x weekends, special events)
CREATE TABLE flex_multipliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  multiplier DECIMAL(3,2) NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_flex_points_user ON flex_points(user_id);
CREATE INDEX idx_flex_transactions_user ON flex_transactions(user_id);
CREATE INDEX idx_flex_transactions_created ON flex_transactions(created_at);
CREATE INDEX idx_flex_multipliers_active ON flex_multipliers(active, starts_at, ends_at);
```

**FLEX Earning Rules:**

| Action | Base FLEX | Notes |
|--------|-----------|-------|
| Daily Login | 10 | Once per day |
| Create Post | 50 | Max 5/day = 250 |
| Like Post | 5 | Max 50/day = 250 |
| Comment | 15 | Max 20/day = 300 |
| Share Post | 20 | Max 10/day = 200 |
| Watch Full Video | 10 | Max 20/day = 200 |
| First Trade | 100 | One-time bonus |
| Trade (any) | 25 | Max 10/day = 250 |
| Streak Bonus | +10% | Per consecutive day (caps at 7x = 70%) |
| Weekend Multiplier | 2x | Saturday & Sunday |

**API Endpoints:**

```typescript
// GET /api/flex/balance
// Returns user's current FLEX balance and stats
{
  total_flex: number,
  available_flex: number,
  current_streak: number,
  longest_streak: number,
  today_earned: number,
  rank: number
}

// POST /api/flex/earn
// Award FLEX for an action
{
  action: 'login' | 'post' | 'like' | 'comment' | 'share' | 'watch' | 'trade',
  metadata?: { post_id?: string, trade_id?: string }
}

// GET /api/flex/leaderboard
// Top FLEX earners
{
  users: [{ user: User, total_flex: number, rank: number }]
}

// GET /api/flex/history
// User's FLEX transaction history
{
  transactions: FlexTransaction[]
}
```

---

### Day 2: FLEX Points - UI & Tips Start

**Morning - FLEX UI:**
- [ ] Create `FlexPointsDisplay` component (header badge)
- [ ] Create `FlexEarnedToast` component (animated popup)
- [ ] Create `FlexLeaderboard` component
- [ ] Add FLEX display to user profile
- [ ] Add FLEX tab to settings page
- [ ] Integrate FLEX earning into existing actions (like, comment, post)

**Afternoon - Tips Database:**
- [ ] Create tips database schema
- [ ] Create tip_settings table
- [ ] Build `/api/tips/send` endpoint
- [ ] Build `/api/tips/history` endpoint

**Tips Database Schema:**

```sql
-- Tips table
CREATE TABLE tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  to_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  amount_usdc DECIMAL(12,6) NOT NULL,
  tx_signature TEXT,
  status TEXT DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tip settings per user
CREATE TABLE tip_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  min_tip_amount DECIMAL(12,6) DEFAULT 1.0,
  tips_enabled BOOLEAN DEFAULT true,
  thank_you_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_tips_to_user ON tips(to_user_id, created_at);
CREATE INDEX idx_tips_from_user ON tips(from_user_id, created_at);
CREATE INDEX idx_tips_post ON tips(post_id);
```

---

### Day 3: Tips - Complete & Prediction Markets Start

**Morning - Tips UI:**
- [ ] Create `TipButton` component
- [ ] Create `TipModal` component (amount selector + message)
- [ ] Create `TipConfirmation` component
- [ ] Add tip button to PostCard
- [ ] Add tips received to creator profile
- [ ] Create tips history page in settings
- [ ] Integrate USDC token for tipping

**Tips Flow:**
```
User clicks Tip → TipModal opens → Select amount ($1, $5, $10, custom)
→ Add optional message → Confirm wallet transaction → USDC transferred
→ Creator receives USDC → Toast notification → FLEX earned (both parties)
```

**Afternoon - Prediction Markets:**
- [ ] Set up Kalshi API client
- [ ] Create predictions database schema
- [ ] Build `/api/predictions/markets` endpoint
- [ ] Build `/api/predictions/create` endpoint

**Predictions Database Schema:**

```sql
-- Prediction markets
CREATE TABLE prediction_markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES users(id) ON DELETE SET NULL,
  post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  kalshi_market_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  resolution_date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'open',
  yes_price DECIMAL(5,4),
  no_price DECIMAL(5,4),
  total_volume DECIMAL(12,2) DEFAULT 0,
  resolved_outcome TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User positions
CREATE TABLE prediction_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  market_id UUID REFERENCES prediction_markets(id) ON DELETE CASCADE,
  position TEXT NOT NULL, -- 'yes' or 'no'
  shares INTEGER NOT NULL,
  avg_price DECIMAL(5,4) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prediction trades
CREATE TABLE prediction_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  market_id UUID REFERENCES prediction_markets(id) ON DELETE CASCADE,
  side TEXT NOT NULL, -- 'buy' or 'sell'
  position TEXT NOT NULL, -- 'yes' or 'no'
  shares INTEGER NOT NULL,
  price DECIMAL(5,4) NOT NULL,
  total_cost DECIMAL(12,6) NOT NULL,
  tx_signature TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prediction_markets_status ON prediction_markets(status);
CREATE INDEX idx_prediction_markets_creator ON prediction_markets(creator_id);
CREATE INDEX idx_prediction_positions_user ON prediction_positions(user_id);
CREATE INDEX idx_prediction_trades_user ON prediction_trades(user_id);
```

---

### Day 4: Prediction Markets - Complete

**Morning - Prediction API:**
- [ ] Build `/api/predictions/buy` endpoint
- [ ] Build `/api/predictions/sell` endpoint
- [ ] Build `/api/predictions/resolve` endpoint
- [ ] Build `/api/predictions/user-positions` endpoint
- [ ] Integrate Kalshi API for market creation

**Afternoon - Prediction UI:**
- [ ] Create `PredictionCard` component
- [ ] Create `PredictionModal` component
- [ ] Create `CreatePredictionModal` component
- [ ] Create `PredictionChart` component (price history)
- [ ] Add predictions tab to explore page
- [ ] Add prediction creation to post flow

**Prediction Market Flow:**
```
Creator creates post → Option to add prediction → Set question + resolution date
→ Market created via Kalshi → Users can buy YES/NO → Price fluctuates
→ Resolution date arrives → Creator resolves → Winners paid out
→ FLEX earned for participation
```

**Kalshi Integration:**

```typescript
// lib/kalshi-client.ts
export class KalshiClient {
  async createMarket(params: CreateMarketParams): Promise<Market>
  async getMarket(marketId: string): Promise<Market>
  async buyPosition(marketId: string, position: 'yes' | 'no', shares: number): Promise<Trade>
  async sellPosition(marketId: string, position: 'yes' | 'no', shares: number): Promise<Trade>
  async resolveMarket(marketId: string, outcome: 'yes' | 'no'): Promise<void>
}
```

---

### Day 5: Token-Gated Content

**Morning - Token-Gated Database:**
- [ ] Create gated_content database schema
- [ ] Create access_rules table
- [ ] Build `/api/gated/check-access` endpoint
- [ ] Build `/api/gated/content` endpoint

**Token-Gated Database Schema:**

```sql
-- Gated content settings
CREATE TABLE gated_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  gate_type TEXT NOT NULL, -- 'token_hold', 'token_amount', 'nft', 'tip_amount'
  token_mint TEXT,
  min_amount DECIMAL(18,9),
  preview_content TEXT,
  full_content TEXT,
  unlock_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Access logs
CREATE TABLE content_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content_id UUID REFERENCES gated_content(id) ON DELETE CASCADE,
  access_type TEXT NOT NULL, -- 'token_verified', 'tipped', 'purchased'
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, content_id)
);

CREATE INDEX idx_gated_content_post ON gated_content(post_id);
CREATE INDEX idx_gated_content_creator ON gated_content(creator_id);
CREATE INDEX idx_content_access_user ON content_access_logs(user_id);
```

**Afternoon - Token-Gated UI:**
- [ ] Create `GatedContentWrapper` component
- [ ] Create `UnlockModal` component
- [ ] Create `GateContentSettings` component (for post creation)
- [ ] Add gating options to CreatePostModal
- [ ] Add token verification check
- [ ] Create "blurred preview" effect for locked content

**Gate Types:**

| Gate Type | Requirement | Example |
|-----------|-------------|---------|
| Token Hold | Own any amount of creator token | "Hold $SHIVAM to unlock" |
| Token Amount | Own X amount of creator token | "Hold 1000 $SHIVAM to unlock" |
| Tip Unlock | Tip X USDC to unlock | "Tip $5 to unlock" |
| Subscriber | Be a subscriber | "Subscribers only" |

---

### Day 6: Promoted Launches

**Morning - Promoted Database & API:**
- [ ] Create promotions database schema
- [ ] Build `/api/promotions/create` endpoint
- [ ] Build `/api/promotions/active` endpoint
- [ ] Build `/api/promotions/analytics` endpoint

**Promotions Database Schema:**

```sql
-- Promoted launches/posts
CREATE TABLE promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  promotion_type TEXT NOT NULL, -- 'featured_post', 'token_launch', 'trending_boost'
  budget_usdc DECIMAL(12,6) NOT NULL,
  spent_usdc DECIMAL(12,6) DEFAULT 0,
  cpm_rate DECIMAL(8,4) DEFAULT 2.0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Promotion impressions/clicks tracking
CREATE TABLE promotion_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID REFERENCES promotions(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL, -- 'impression', 'click', 'trade'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_promotions_status ON promotions(status, starts_at, ends_at);
CREATE INDEX idx_promotions_user ON promotions(user_id);
CREATE INDEX idx_promotion_events_promotion ON promotion_events(promotion_id);
```

**Afternoon - Promoted UI:**
- [ ] Create `PromotedBadge` component
- [ ] Create `CreatePromotionModal` component
- [ ] Create `PromotionAnalytics` dashboard
- [ ] Add promotion option to post actions
- [ ] Integrate promoted posts into feed algorithm
- [ ] Add "Promoted" label to sponsored content

**Promotion Types:**

| Type | Cost | Placement |
|------|------|-----------|
| Featured Post | $2 CPM | Top of feed, highlighted |
| Token Launch | $5 CPM | Explore page banner |
| Trending Boost | $3 CPM | Trending section |

---

### Day 7: Polish & Launch Prep

**Morning - Polish:**
- [ ] UI/UX review and fixes
- [ ] Mobile responsiveness check
- [ ] Error handling improvements
- [ ] Loading states everywhere
- [ ] Empty states design
- [ ] Toast notifications review

**Afternoon - Launch Prep:**
- [ ] Run full Playwright test suite
- [ ] Performance optimization
- [ ] Database indexes review
- [ ] Rate limiting check
- [ ] Security audit (RLS policies)
- [ ] Environment variables verification
- [ ] Deploy to production
- [ ] Create launch announcement post

---

## Component Inventory

### New Components to Build

```
components/
├── flex/
│   ├── FlexPointsDisplay.tsx      # Header badge showing FLEX
│   ├── FlexEarnedToast.tsx        # Animated "+50 FLEX" popup
│   ├── FlexLeaderboard.tsx        # Top earners list
│   ├── FlexHistory.tsx            # Transaction history
│   └── FlexMultiplierBanner.tsx   # "2x Weekend!" banner
├── tips/
│   ├── TipButton.tsx              # Tip action button
│   ├── TipModal.tsx               # Amount selector modal
│   ├── TipConfirmation.tsx        # Success screen
│   └── TipsReceived.tsx           # Creator's tips display
├── predictions/
│   ├── PredictionCard.tsx         # Market card in feed
│   ├── PredictionModal.tsx        # Trading interface
│   ├── CreatePredictionModal.tsx  # Market creation
│   ├── PredictionChart.tsx        # Price history
│   └── PositionsList.tsx          # User's positions
├── gated/
│   ├── GatedContentWrapper.tsx    # Blur overlay + unlock
│   ├── UnlockModal.tsx            # Unlock options
│   └── GateContentSettings.tsx    # Gate configuration
└── promotions/
    ├── PromotedBadge.tsx          # "Promoted" label
    ├── CreatePromotionModal.tsx   # Create promotion
    └── PromotionAnalytics.tsx     # Analytics dashboard
```

### New Hooks to Build

```
hooks/
├── useFlexPoints.ts         # FLEX balance, earning, history
├── useTips.ts               # Send tips, tip history
├── usePredictions.ts        # Markets, positions, trading
├── useGatedContent.ts       # Access check, unlock
└── usePromotions.ts         # Create, manage promotions
```

### New API Routes

```
app/api/
├── flex/
│   ├── balance/route.ts
│   ├── earn/route.ts
│   ├── leaderboard/route.ts
│   └── history/route.ts
├── tips/
│   ├── send/route.ts
│   ├── history/route.ts
│   └── settings/route.ts
├── predictions/
│   ├── markets/route.ts
│   ├── create/route.ts
│   ├── buy/route.ts
│   ├── sell/route.ts
│   ├── resolve/route.ts
│   └── positions/route.ts
├── gated/
│   ├── check-access/route.ts
│   ├── content/route.ts
│   └── unlock/route.ts
└── promotions/
    ├── create/route.ts
    ├── active/route.ts
    └── analytics/route.ts
```

---

## Success Metrics for Launch

| Metric | Target |
|--------|--------|
| Creator Tokens Activated | 10+ |
| Posts Created | 50+ |
| FLEX Points Distributed | 10,000+ |
| Tips Sent | 5+ |
| Prediction Markets Created | 3+ |
| Token-Gated Posts | 5+ |
| Promoted Launches | 2+ |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Kalshi API issues | Fallback to mock markets for demo |
| USDC transfer fails | Clear error messages, retry logic |
| Token verification slow | Cache balances, background refresh |
| Rate limiting | Redis-based rate limiter |
| Mobile issues | Priority testing on iOS Safari |

---

## Launch Checklist

### Pre-Launch (Day 7 morning)
- [ ] All P2 features working
- [ ] Database migrations applied
- [ ] Environment variables set
- [ ] RLS policies verified
- [ ] Playwright tests passing
- [ ] Mobile responsive

### Launch (Day 7 afternoon)
- [ ] Deploy to Vercel production
- [ ] Verify all API routes
- [ ] Test end-to-end flows
- [ ] Create launch post on Flexit
- [ ] Share on Twitter
- [ ] Monitor error logs

### Post-Launch (Day 8+)
- [ ] Monitor user feedback
- [ ] Fix critical bugs
- [ ] Optimize slow queries
- [ ] Scale infrastructure if needed

---

## Conclusion

This MVP plan prioritizes:

1. **FLEX Points** - Engagement/retention loop (critical for early growth)
2. **Tips** - Direct creator monetization (builds trust)
3. **Prediction Markets** - Volume driver (replaces post tokens)
4. **Token-Gated Content** - Utility for creator tokens
5. **Promoted Launches** - Platform revenue

The architecture follows the YouTube model: **all content contributes to ONE creator token** rather than fragmenting value across content-specific tokens.

By the end of week, Flexit will have:
- Creator tokens with real utility (gated content)
- Multiple revenue streams (tips, promotions, trading fees)
- Engagement incentives (FLEX points)
- Speculation without rugs (prediction markets via Kalshi)

**Let's ship it.**
