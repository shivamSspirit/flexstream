# Flexit Viral MVP - Nikita Bier Strategy

**Philosophy:** Ship ONE viral mechanic, not 10 features. Make users look good. Create FOMO. Make sharing dead simple.

---

## The Nikita Bier Playbook

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   NIKITA BIER'S VIRAL FORMULA:                                              │
│                                                                             │
│   1. ONE HOOK → Not 10 features. ONE thing that spreads.                    │
│   2. EGO → Make users look good to their friends                            │
│   3. FOMO → "Everyone is doing this except you"                             │
│   4. SCARCITY → Limited access, exclusive content                           │
│   5. COMPETITION → Leaderboards, battles, rankings                          │
│   6. FRICTIONLESS SHARE → One tap to Twitter/socials                        │
│   7. TIGHT COMMUNITY → Launch in one group, not broadly                     │
│                                                                             │
│   APPS HE BUILT:                                                            │
│   • tbh → "Your friends said nice things about you" (ego)                   │
│   • Gas → "Someone has a crush on you" (curiosity + ego)                    │
│   • Both sold for $100M+ in < 1 year                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3 Viral Narratives for Flexit

### Narrative 1: "TRADE YOUR FRIENDS" (Profile Stock Market)
```
HOOK: "Your profile is a publicly traded stock"

WHY IT'S VIRAL:
├── EGO → "I'm worth $50K on Flexit" (flex on Twitter)
├── FOMO → "My friend's stock is up 300% and I didn't buy"
├── COMPETITION → Leaderboard of most valuable creators
├── SOCIAL PROOF → Price = credibility signal
└── CURIOSITY → "What am I worth?"

SHARE TRIGGERS:
├── "I just hit $100K market cap 📈"
├── "I'm in the Top 50 creators on Flexit"
├── "My token is up 47% today"
└── "[Friend] just bought my token"

IMPLEMENTATION:
├── Already built: Creator tokens (Meteora DBC + Jupiter)
├── Need: Prominent price display on every post
├── Need: Shareable "Market Cap Card" for Twitter
├── Need: Top 100 Creator Leaderboard
└── Need: Price change notifications

COST: $0 (already built)
TIME: 2 days polish
```

### Narrative 2: "PREDICTION BATTLES" (Social Betting)
```
HOOK: "Challenge your friends. Prove you're right."

WHY IT'S VIRAL:
├── COMPETITION → "I challenged @friend on BTC $100K"
├── EGO → "I'm 7-2 against my friends in predictions"
├── SOCIAL PROOF → "5 friends betting YES"
├── BRAGGING RIGHTS → Winner gets public flex
└── CONTROVERSY → "Are you team YES or NO?"

SHARE TRIGGERS:
├── "I just challenged @friend — who's right?"
├── "I'm on a 5-prediction win streak 🔥"
├── "My Flex Score is 847 — beat that"
└── "Just won $50 on [prediction]"

IMPLEMENTATION:
├── Use: Kalshi API for real markets (50+ categories)
├── Use: DFlow for YES/NO token minting (FREE, we get 0.5%)
├── Build: Challenge system (tag friend, pick side)
├── Build: Flex Score (prediction accuracy ranking)
├── Build: Battle history (win/loss record vs friends)
└── Build: One-tap share to Twitter

COST: $0 (DFlow = free, Kalshi = API)
TIME: 3 days
```

### Narrative 3: "HOLDER-ONLY COMMENTS" (Exclusivity)
```
HOOK: "Only my investors can comment"

WHY IT'S VIRAL:
├── SCARCITY → "Can't comment? Buy the token."
├── FOMO → "182 holders are discussing, you're not"
├── EXCLUSIVITY → "Private community for token holders"
├── STATUS → Comment = proof you own the token
└── QUALITY → No spam, only invested fans

SHARE TRIGGERS:
├── "Only my top 50 holders can comment now 🔒"
├── "Unlocked @creator's private comments by buying token"
├── "This is the real alpha — holder-only thread"
└── "My token holders are the real community"

IMPLEMENTATION:
├── Already built: Token balance check
├── Build: Comment gate (must hold X tokens)
├── Build: "Hold to Comment" prompt with buy button
├── Build: Holder count display ("182 can comment")
├── Build: Visual distinction for holder comments
└── Build: Creator controls (min hold amount)

COST: $0 (on-chain verification)
TIME: 2 days
```

---

## The Viral MVP Stack

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                         FLEXIT VIRAL MVP                                │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                                                                      │  │
│   │   LAYER 1: PROFILE STOCK MARKET (Day 1-2)                           │  │
│   │   "Your profile is a publicly traded stock"                          │  │
│   │                                                                      │  │
│   │   ├── Every profile shows: Price, Market Cap, 24h Change            │  │
│   │   ├── Every post shows creator's stock stats                         │  │
│   │   ├── Top 100 Creator Leaderboard                                    │  │
│   │   ├── Shareable "My Market Cap" card                                 │  │
│   │   └── "Someone bought your token" notifications                      │  │
│   │                                                                      │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                                                                      │  │
│   │   LAYER 2: PREDICTION BATTLES (Day 3-5)                              │  │
│   │   "Challenge your friends. Prove you're right."                      │  │
│   │                                                                      │  │
│   │   ├── Pick any Kalshi market (50+ categories)                        │  │
│   │   ├── Challenge friend: "@friend, you're wrong on BTC"               │  │
│   │   ├── Friends see who's betting what                                 │  │
│   │   ├── Winner gets badge + bragging rights                            │  │
│   │   ├── Flex Score (accuracy leaderboard)                              │  │
│   │   └── One-tap share: "I challenged @friend — who wins?"              │  │
│   │                                                                      │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                                                                      │  │
│   │   LAYER 3: HOLDER-ONLY COMMENTS (Day 6-7)                            │  │
│   │   "Only my investors can comment"                                    │  │
│   │                                                                      │  │
│   │   ├── Token-gated comments (must hold to comment)                    │  │
│   │   ├── "182 holders can comment" counter                              │  │
│   │   ├── "Buy token to unlock comments" CTA                             │  │
│   │   ├── Holder badge on comments                                       │  │
│   │   └── Creator sets minimum hold amount                               │  │
│   │                                                                      │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│   ═══════════════════════════════════════════════════════════════════════   │
│                                                                             │
│   RESULT: A social network where you TRADE creators like stocks,            │
│           COMPETE in predictions, and only INVESTORS can engage.            │
│                                                                             │
│   VIRAL LOOPS:                                                              │
│   1. "I'm worth $X" → Share → Friends check their value                     │
│   2. "I challenged @friend" → Share → Friends pick sides                    │
│   3. "Holders-only thread" → FOMO → Buy token to join                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Day-by-Day Build Plan

### Day 1-2: Profile Stock Market (Foundation)

**Goal:** Every profile feels like a publicly traded stock

**Day 1 - Display Layer:**
```
MORNING (4 hours):
├── [ ] Create `CreatorStockCard` component
│       └── Shows: Price, Market Cap, 24h %, Volume
├── [ ] Add stock card to every post in feed
│       └── Displays creator's token stats prominently
├── [ ] Create `ProfileStockHeader` component
│       └── Large stock display on profile page
└── [ ] Real-time price updates via Supabase

AFTERNOON (4 hours):
├── [ ] Create "Top 100 Creators" leaderboard page
│       └── Rank by market cap
├── [ ] Add rank badge to profiles (#1, #5, Top 50)
├── [ ] Create `LeaderboardRow` component
│       └── Avatar, name, price, change %, market cap
└── [ ] Add "Your Rank: #47" to profile header
```

**Day 2 - Share Layer:**
```
MORNING (4 hours):
├── [ ] Create shareable "My Market Cap" card
│       └── Beautiful image card for Twitter
├── [ ] Build `/api/share/market-cap-card` (OG image generation)
│       └── Dynamic image with user's stats
├── [ ] Add "Share My Stats" button to profile
│       └── Copies Twitter-ready text + image
└── [ ] Create share URL: flexit.io/u/[username]/card

AFTERNOON (4 hours):
├── [ ] Add "Someone bought your token" push notification
├── [ ] Add "Your token is up 10%" notification
├── [ ] Create notification preferences
├── [ ] Polish mobile responsive layout
└── [ ] Test share flow end-to-end
```

**Day 1-2 Deliverables:**
- Every post shows creator's stock stats
- Profile pages look like stock tickers
- Top 100 leaderboard live
- One-tap share to Twitter with image card

---

### Day 3-5: Prediction Battles

**Goal:** Make predictions social and competitive

**Day 3 - Core Infrastructure:**
```
MORNING (4 hours):
├── [ ] Set up Kalshi API client
│       └── lib/kalshi-client.ts
├── [ ] Create predictions database schema
│       └── markets, positions, challenges
├── [ ] Build `/api/predictions/markets` endpoint
│       └── Fetch available markets from Kalshi
└── [ ] Build `/api/predictions/categories` endpoint
       └── Group markets by category (crypto, politics, sports)

AFTERNOON (4 hours):
├── [ ] Create `PredictionMarketCard` component
│       └── Question, YES/NO prices, volume
├── [ ] Create `/explore/predictions` page
│       └── Browse all markets by category
├── [ ] Create market detail modal
│       └── Full info, price chart, trade
└── [ ] Wire up Kalshi market data display
```

**Day 4 - Challenge System:**
```
MORNING (4 hours):
├── [ ] Build challenges database schema
│       └── challenger, challenged, market, sides, winner
├── [ ] Build `/api/challenges/create` endpoint
│       └── Create challenge, notify friend
├── [ ] Build `/api/challenges/accept` endpoint
│       └── Accept challenge, lock positions
└── [ ] Create `ChallengeModal` component
       └── Pick friend, pick side, set amount

AFTERNOON (4 hours):
├── [ ] Create `ChallengeCard` component
│       └── Shows: @user vs @user on [market]
├── [ ] Add challenge feed to home
│       └── "5 friends betting YES"
├── [ ] Create challenge notification
│       └── "@friend challenged you on BTC $100K"
└── [ ] Build challenge resolution logic
       └── Winner gets badge + FLEX
```

**Day 5 - Social Proof & Sharing:**
```
MORNING (4 hours):
├── [ ] Build Flex Score system
│       └── Accuracy ranking based on predictions
├── [ ] Create Flex Score leaderboard
│       └── Top predictors
├── [ ] Add Flex Score to profile
│       └── "Flex Score: 847 (Top 5%)"
└── [ ] Create win streak tracking
       └── "🔥 5-prediction streak"

AFTERNOON (4 hours):
├── [ ] Create shareable challenge card
│       └── "@user challenged @user — who wins?"
├── [ ] Build `/api/share/challenge-card` (OG image)
├── [ ] Add "Share Challenge" button
│       └── Posts to Twitter with sides
├── [ ] Create "I won!" celebration share
│       └── "Just won against @friend on [market]"
└── [ ] Polish mobile experience
```

**Day 3-5 Deliverables:**
- Browse 50+ Kalshi markets
- Challenge friends on any prediction
- "5 friends betting YES" social proof
- Flex Score accuracy ranking
- One-tap share challenges to Twitter

---

### Day 6-7: Holder-Only Comments

**Goal:** Create exclusivity that drives token purchases

**Day 6 - Token Gate Logic:**
```
MORNING (4 hours):
├── [ ] Build `/api/gated/check-holder` endpoint
│       └── Verify user holds creator's token
├── [ ] Create `HolderGate` wrapper component
│       └── Checks balance, shows lock/unlock
├── [ ] Modify `CommentsModal` to check holder status
│       └── Lock comment input if not holder
└── [ ] Add minimum hold amount setting for creators
       └── Creator can set: "Hold 100 tokens to comment"

AFTERNOON (4 hours):
├── [ ] Create `HolderCommentLock` component
│       └── "Hold $CREATOR to comment" with Buy button
├── [ ] Create `HolderCount` display
│       └── "182 holders can comment"
├── [ ] Add holder badge to comments
│       └── Visual distinction for holder comments
└── [ ] Create "Unlock Comments" CTA modal
       └── Shows token info, buy button, holder count
```

**Day 7 - Polish & Launch:**
```
MORNING (4 hours):
├── [ ] Creator settings for comment gating
│       └── Enable/disable, min hold amount
├── [ ] Create "Holders-Only Thread" indicator
│       └── Lock icon on gated posts
├── [ ] Add holder-only to post creation flow
│       └── Toggle: "Holder-only comments"
└── [ ] Test full holder verification flow

AFTERNOON (4 hours):
├── [ ] Final UI polish across all 3 narratives
├── [ ] Mobile responsiveness check
├── [ ] Performance optimization
├── [ ] Deploy to production
├── [ ] Create launch tweet thread
└── [ ] Seed with initial creators/predictions
```

**Day 6-7 Deliverables:**
- Comments locked to token holders
- "182 holders can comment" counter
- "Buy to Comment" CTA with Jupiter swap
- Holder badge on comments
- Creator controls for gating

---

## Viral Share Assets

### 1. Market Cap Card (Twitter OG Image)
```
┌─────────────────────────────────────────────┐
│                                             │
│   [Avatar]  @username                       │
│                                             │
│   $47,832                                   │
│   MARKET CAP                                │
│                                             │
│   +23.4%                                    │
│   24H CHANGE                                │
│                                             │
│   #23 on Flexit                         │
│                                             │
│   flexit.io                             │
│                                             │
└─────────────────────────────────────────────┘

SHARE TEXT:
"I'm worth $47K on Flexit 📈
Trade me: flexit.io/u/username"
```

### 2. Prediction Challenge Card
```
┌─────────────────────────────────────────────┐
│                                             │
│   ⚔️ PREDICTION BATTLE                       │
│                                             │
│   @user1     VS     @user2                  │
│   [YES]             [NO]                    │
│                                             │
│   "Will BTC hit $100K by March?"            │
│                                             │
│   WHO'S RIGHT?                              │
│   flexit.io/challenge/xyz               │
│                                             │
└─────────────────────────────────────────────┘

SHARE TEXT:
"I just challenged @friend on BTC $100K
I say YES, they say NO
Who's right? 👇"
```

### 3. Win Celebration Card
```
┌─────────────────────────────────────────────┐
│                                             │
│   🏆 VICTORY                                │
│                                             │
│   @winner beat @loser                       │
│                                             │
│   "Will ETH flip BTC market cap?"           │
│   ANSWER: NO ✓                              │
│                                             │
│   Flex Score: 847 (+12)                     │
│   Win Streak: 🔥🔥🔥🔥🔥                      │
│                                             │
└─────────────────────────────────────────────┘

SHARE TEXT:
"Just beat @friend in our prediction battle 🏆
5-win streak, Flex Score 847
Come at me: flexit.io/u/username"
```

---

## Viral Mechanics Checklist

### Ego Triggers ✓
- [ ] Market cap visible everywhere
- [ ] Leaderboard ranking
- [ ] Flex Score
- [ ] Win streak counter
- [ ] Holder badge on comments

### FOMO Triggers ✓
- [ ] "5 friends betting YES"
- [ ] "182 holders can comment"
- [ ] "@friend just bought your token"
- [ ] "You're missing the discussion"
- [ ] Real-time price notifications

### Competition Triggers ✓
- [ ] Top 100 Creator leaderboard
- [ ] Flex Score leaderboard
- [ ] Head-to-head challenges
- [ ] Win/loss record
- [ ] Streak badges

### Share Triggers ✓
- [ ] One-tap share to Twitter
- [ ] Beautiful OG image cards
- [ ] Pre-written share text
- [ ] Shareable URLs
- [ ] Celebration moments

---

## Launch Strategy (Nikita Bier Style)

### Phase 1: Seed (Before Launch)
```
├── Identify 20-30 crypto Twitter influencers
├── DM them personally: "Be one of the first 50 traded profiles"
├── Give them early access to activate tokens
├── Ask them to NOT post yet (creates scarcity)
└── Goal: 20 active profiles with tokens before public launch
```

### Phase 2: Trigger (Launch Day)
```
├── All 20 influencers post simultaneously
├── Each posts their "Market Cap Card"
├── Create 3-5 public prediction battles between them
├── Leaderboard goes live (competition starts)
└── Goal: FOMO from followers seeing friends trade
```

### Phase 3: Wave (Day 2-3)
```
├── Followers sign up to check their value
├── They can't comment without tokens → buy
├── They challenge friends on predictions
├── They share their market cap cards
└── Goal: Organic viral spread
```

### Phase 4: Lock-In (Week 2)
```
├── Holder-only threads create communities
├── Prediction battles become recurring
├── Leaderboard competition intensifies
├── Token trading volume grows
└── Goal: Retention via financial + social lock-in
```

---

## Success Metrics

### Viral Coefficient Target: >1.0
```
Each user should invite > 1 new user

SHARE ACTIONS PER USER (TARGET):
├── Market cap card shares: 2+ per week
├── Challenge shares: 1+ per week
├── Win celebrations: 1+ per week
├── Total shares: 4+ per week per active user
└── Conversion: 25% of share viewers sign up

MATH:
4 shares × 100 views × 25% conversion = 100 signups per active user
Viral coefficient = 100 / 100 = 1.0 ✓
```

### Week 1 Targets
| Metric | Target |
|--------|--------|
| Signups | 500+ |
| Tokens Activated | 50+ |
| Prediction Challenges | 100+ |
| Twitter Shares | 200+ |
| Token Trades | 500+ |
| Holder-Only Comments | 50+ |

---

## Cost Analysis

### API Costs (Week 1)
```
Kalshi API:       $0 (free tier)
DFlow:            $0 (we earn 0.5%)
Jupiter:          $0 (free)
Helius RPC:       $0 (free tier)
Supabase:         $0 (free tier)
Vercel:           $0 (free tier)
────────────────────────────────
TOTAL:            $0
```

### Revenue (Week 1 Estimate)
```
Token trading fees (0.3%):    $50-200
Prediction fees (0.5%):       $20-100
────────────────────────────────
ESTIMATED:                    $70-300
```

---

## The One-Liner for Each Narrative

```
NARRATIVE 1: "Your profile is a publicly traded stock"
             → Ego, competition, financial alignment

NARRATIVE 2: "Challenge friends. Prove you're right."
             → Competition, social proof, bragging rights

NARRATIVE 3: "Only investors can comment"
             → Exclusivity, FOMO, quality filter
```

---

## Bottom Line

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   NIKITA BIER MVP FORMULA:                                                  │
│                                                                             │
│   ✓ ONE viral hook: "Your profile is a stock"                               │
│   ✓ EGO: Market cap, leaderboard, Flex Score                                │
│   ✓ FOMO: "182 holders can comment", "5 friends betting YES"                │
│   ✓ COMPETITION: Challenges, leaderboards, win streaks                      │
│   ✓ FRICTIONLESS SHARE: One-tap cards to Twitter                            │
│                                                                             │
│   ═══════════════════════════════════════════════════════════════════════   │
│                                                                             │
│   3 NARRATIVES, 7 DAYS:                                                     │
│                                                                             │
│   Day 1-2: Profile Stock Market                                             │
│            → Price on every post, leaderboard, share cards                  │
│                                                                             │
│   Day 3-5: Prediction Battles                                               │
│            → Challenge friends, Flex Score, win streaks                     │
│                                                                             │
│   Day 6-7: Holder-Only Comments                                             │
│            → Token-gated, FOMO, exclusivity                                 │
│                                                                             │
│   ═══════════════════════════════════════════════════════════════════════   │
│                                                                             │
│   COST: $0                                                                  │
│   TIME: 7 days                                                              │
│   VIRAL COEFFICIENT TARGET: >1.0                                            │
│                                                                             │
│   "Twitter if every profile was a publicly traded stock"                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

*Version 1.0 — January 2025*
*Ship fast. Go viral. Compound forever.*
